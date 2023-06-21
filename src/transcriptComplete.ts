import { getInngest } from './get-inngest'

function convertTime(inputSeconds: number) {
	const date = new Date(inputSeconds * 1000)
	const hours = String(date.getUTCHours()).padStart(2, '0')
	const minutes = String(date.getUTCMinutes()).padStart(2, '0')
	const seconds = String(date.getUTCSeconds()).padStart(2, '0')
	const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0')

	return `${hours}:${minutes}:${seconds},${milliseconds}`
}

interface WordObject {
	word: string
	start: number
	end: number
	confidence: number
	speaker: number
	speaker_confidence: number
	punctuated_word: string
}

function srtFromTranscriptResult(results: { channels: { alternatives: { words: WordObject[] }[] }[] }) {
	let data = results.channels[0].alternatives[0].words

	let arrayByTimes: WordObject[][] = []
	let tempArray: WordObject[] = []

	let timeLimitInSeconds = 5.5
	let charLimit = 42
	let currentTimeInSeconds = 0
	let currentCharCount = 0

	data.forEach((item, index) => {
		let timeExceeded = currentTimeInSeconds + (item.end - item.start) >= timeLimitInSeconds
		let charCountExceeded = currentCharCount + item.punctuated_word.length > charLimit

		if (timeExceeded || charCountExceeded || index === data.length - 1) {
			if (tempArray.length) {
				arrayByTimes.push(tempArray)
				tempArray = []
				currentTimeInSeconds = 0
				currentCharCount = 0
			}
		}

		if (!timeExceeded || !charCountExceeded) {
			tempArray.push(item)
			currentTimeInSeconds += item.end - item.start
			currentCharCount += item.word.length
		}

		// If the data is at the last item and the time or char count isn't exceeded, push the last item.
		if (index === data.length - 1 && (!timeExceeded || !charCountExceeded)) {
			arrayByTimes.push(tempArray)
		}
	})

	let srtEntries = arrayByTimes.map((timeBlock, index) => {
		let startTime = convertTime(timeBlock[0].start)
		let endTime = convertTime(timeBlock[timeBlock.length - 1].end)
		let text = timeBlock.map((x) => x.punctuated_word).join(' ')
		let srtEntry = `${index + 1}
${startTime} --> ${endTime}
${text}
		`

		return srtEntry
	})

	let srtOutput = srtEntries.join('\n\n')
	return srtOutput
}


function fullTranscriptFromResults(results: any) {
	return results.channels[0].alternatives[0].paragraphs.transcript
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		const videoResourceId = url.searchParams.get('videoResourceId')
		const siteName = url.searchParams.get('siteName') || 'epic-web'

		const inngest = getInngest({ env, projectName: siteName })

		const { results }: { results: any } = await request.json()

		if (!results) {
			return new Response(`Bad request`, { status: 400 })
		}

		const srt = srtFromTranscriptResult(results)
		const transcript = fullTranscriptFromResults(results)

		const data = {
			videoResourceId,
			transcript: {
				text: transcript,
				srt,
			},
		}

		console.log('data', data)

		const inngestResponse = await inngest.send({
			name: 'tip/video.transcript.created',
			data,
		})

		console.log('inngestResponse', inngestResponse)

		const json = JSON.stringify({ transcript, srt, videoResourceId }, null, 2)

		return new Response(json, {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		})
	},
}
