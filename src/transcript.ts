import { Inngest } from 'inngest'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)

		let videoUrl = url.searchParams.get('videoUrl')
		const videoResourceId = url.searchParams.get('videoResourceId')
		const siteName = url.searchParams.get('siteName') || 'epic-web'

		console.log('videoUrl', videoUrl)
		console.log('videoResourceId', videoResourceId)

		if (!videoUrl) {
			return new Response('Bad request: Missing `videoUrl` query param', { status: 400 })
		}

		const utteranceSpiltThreshold = 0.5
		const deepgramUrl = `https://api.deepgram.com/v1/listen`
		const callbackUrl = `https://deepgram-wrangler.skillstack.workers.dev/transcriptComplete`

		const deepgramParams = new URLSearchParams({
			model: 'whisper',
			punctuate: 'true',
			paragraphs: 'true',
			utterances: 'true',
			utt_split: String(utteranceSpiltThreshold),
			callback: `${callbackUrl}?videoResourceId=${videoResourceId}&site=${siteName}`,
		})

		const deepgramResponse = await fetch(`${deepgramUrl}?${deepgramParams.toString()}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
			},
			body: JSON.stringify({
				url: videoUrl,
			}),
		})

		const deepgramResponseJson = await deepgramResponse.json()

		return new Response(JSON.stringify(deepgramResponseJson, null, 2), {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		})
	},
}
