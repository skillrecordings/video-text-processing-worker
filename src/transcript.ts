import { Document } from 'langchain/document'
import { CharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAI } from 'langchain/llms/openai'
import { RetrievalQAChain } from 'langchain/chains'
import { Inngest } from 'inngest'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// configure inngest
		const inngest = new Inngest({ name: 'Epic Web Dev by Kent C. Dodds', eventKey: env.INNGEST_EVENT_KEY })

		console.log('Processing Video For Transcript')

		const url = new URL(request.url)

		const videoUrl = url.searchParams.get('videoUrl')
		const videoResourceId = url.searchParams.get('videoResourceId')

		console.log('videoUrl', videoUrl)
		console.log('videoResourceId', videoResourceId)

		if (!videoUrl) {
			return new Response('Bad request: Missing `proxyUrl` query param', { status: 400 })
		}

		const transcribed = await fetch('https://api.deepgram.com/v1/listen?model=whisper&punctuate=true&paragraphs=true&utterances=true', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
			},
			body: JSON.stringify({
				url: videoUrl,
			}),
		})

		const response: any = await transcribed.json()

		let srt = ``

		for (let i = 0; i < response.results.utterances.length; i++) {
			const utterance = response.results.utterances[i]
			const start = new Date(utterance.start * 1000).toISOString().substr(11, 12).replace('.', ',')
			const end = new Date(utterance.end * 1000).toISOString().substr(11, 12).replace('.', ',')
			srt += `${i + 1}\n${start} --> ${end}\n${utterance.transcript}\n\n`
		}

		console.log('srt', srt)

		const transcript = response.results.channels[0].alternatives[0].paragraphs.transcript

		console.log('transcript', transcript)

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
