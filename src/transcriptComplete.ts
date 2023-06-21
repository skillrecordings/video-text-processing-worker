import { getInngest } from './get-inngest'
import { Word, srtProcessor } from './srt-processor'

function srtFromTranscriptResult(results: { channels: { alternatives: { words: Word[] }[] }[] }) {
	return srtProcessor(results.channels[0].alternatives[0].words)
}

function convertTime(inputSeconds: number) {
	const date = new Date(inputSeconds * 1000)
	const hours = String(date.getUTCHours()).padStart(2, '0')
	const minutes = String(date.getUTCMinutes()).padStart(2, '0')
	const seconds = String(date.getUTCSeconds()).padStart(2, '0')

	return `${hours}:${minutes}:${seconds}`
}

function formatTimeString(str: string) {
	let [h, m, s] = str.split(':')
	if (h == '00') {
		return `${m}:${s}`
	}

	return `${h}:${m}:${s}`
}

function transcriptAsParagraphsWithTimestamps(results: any) {
	const { paragraphs } = results.channels[0].alternatives[0].paragraphs

	return paragraphs.reduce((acc: string, paragraph: { sentences: { text: string; start: number; end: number }[] }) => {
		const startTime = formatTimeString(convertTime(paragraph.sentences[0].start))
		const text = paragraph.sentences.map((x) => x.text).join(' ')

		return `${acc}[${startTime}] ${text}
		
`
	}, ``)
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
		const transcript = transcriptAsParagraphsWithTimestamps(results)

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

		const json = JSON.stringify(data, null, 2)

		return new Response(json, {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		})
	},
}
