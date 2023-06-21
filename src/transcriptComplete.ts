import { getInngest } from './get-inngest'

function srtFromTranscriptResult(results: { utterances: { transcript: string; start: number; end: number }[] }) {
	let srt = ``

	for (let i = 0; i < results.utterances.length; i++) {
		const utterance = results.utterances[i]
		const start = new Date(utterance.start * 1000).toISOString().substr(11, 12).replace('.', ',')
		const end = new Date(utterance.end * 1000).toISOString().substr(11, 12).replace('.', ',')
		srt += `${i + 1}\n${start} --> ${end}\n${utterance.transcript}\n\n`
	}

	return srt
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
