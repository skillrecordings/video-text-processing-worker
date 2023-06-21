import { getInngest } from './get-inngest'
import { Word, srtProcessor } from './srt-processor'

function srtFromTranscriptResult(results: { channels: { alternatives: { words: Word[] }[] }[] }) {
	return srtProcessor(results.channels[0].alternatives[0].words)
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
