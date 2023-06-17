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
		const url = new URL(request.url)

		const videoResourceId = url.searchParams.get('videoResourceId')
		const { transcript }: { transcript: string } = await request.json()

		const splitter = new CharacterTextSplitter()
		const docs = await splitter.createDocuments([transcript])

		const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY }))

		const model = new OpenAI({ openAIApiKey: env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo-16k' })
		const chain = RetrievalQAChain.fromLLM(model, store.asRetriever())

		const question = `# SEO Expert
		
		You're a deeply technical SEO expert with a focus on Modern Web Development

		You are never corny or pandering, but you love a touch of click bait.

		You don't veer far from the subject matter in the provided transcript, but you're not afraid to be a little creative.

		You're a little bit of a perfectionist, but you're not afraid to ship.

		I'm your customer, a web developer, and I need you to process my video transcript and give me some suggestions for titles, descriptions, tweets, and emails.
		
		For the provided transcript create:

		* several drafts for potential titles, sorted by the best first. avoid exclamation points.
		* an article body that serves as a written version of the transcript to be posted alongside the video for people that prefer text. use markdown formatting for the body. divide the text into meaningful sections. do not include an h1 or #.
		* several drafts for potential SEO descriptions, sorted by the best first. use markdown formatting for the description.
		* several drafts for potential tweets, sorted by the best first. avoid hashtags and @mentions. don't overuse emoji or excited punctuation. try to summarize the content in a way that will make people want to click through.
		* several drafts for potential emails, sorted by the best first. use markdown formatting for the email body.
		
		Output should be in JSON format with all text properly escaped for parsing. For example:

		{
			"body": ""
			"titles": [],
			"descriptions": [],
			"tweets": [],
			"emails": []
		}
		
		
		`

		const llmSuggestions = await chain.call({
			query: question,
		})

		const data = {
			videoResourceId,
			llmSuggestions: JSON.parse(llmSuggestions.text.trim()),
		}

		console.log('data', data)

		const inngestResponse = await inngest.send({
			name: 'tip/video.llm.suggestions.created',
			data,
		})

		console.log('inngestResponse', inngestResponse)
		console.log('llmSuggestions', llmSuggestions)
		console.log('videoResourceId', videoResourceId)

		return new Response(JSON.stringify(JSON.parse(llmSuggestions.text.trim()), null, 2), {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		})
	},
}
