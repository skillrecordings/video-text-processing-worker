import handleTranscript from './transcript'
import handleTipMetadataLLM from './tipMetadataLLM'
import handleTranscriptComplete from './transcriptComplete'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		switch (url.pathname) {
			case '/transcript':
				return handleTranscript.fetch(request, env, ctx)
			case '/tipMetadataLLM':
				return handleTipMetadataLLM.fetch(request, env, ctx)
			case '/transcriptComplete':
				return handleTranscriptComplete.fetch(request, env, ctx)
		}
		return new Response('Not found', { status: 404 })
	},
}
