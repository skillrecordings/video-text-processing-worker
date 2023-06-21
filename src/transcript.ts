const deepgramUrl = `https://api.deepgram.com/v1/listen`
const callbackUrl = `https://deepgram-wrangler.skillstack.workers.dev/transcriptComplete`

//  deepgram config
const utteranceSpiltThreshold = 0.5

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)

		const videoUrl = url.searchParams.get('videoUrl')
		const videoResourceId = url.searchParams.get('videoResourceId')
		const siteName = url.searchParams.get('siteName') || 'epic-web'

		if (!videoUrl) {
			return new Response('Bad request: Missing `videoUrl` query param', { status: 400 })
		}

		if (!videoResourceId) {
			return new Response('Bad request: Missing `videoResourceId` query param', { status: 400 })
		}

		if (!siteName) {
			return new Response('Bad request: Missing `siteName` query param', { status: 400 })
		}

		const callbackParams = new URLSearchParams({
			videoResourceId,
			siteName,
		})

		const deepgramParams = new URLSearchParams({
			model: 'whisper',
			punctuate: 'true',
			paragraphs: 'true',
			utterances: 'true',
			utt_split: String(utteranceSpiltThreshold),
			callback: `${callbackUrl}?${callbackParams.toString()}`,
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
