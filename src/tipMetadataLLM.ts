import { CharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAI, OpenAIChat } from 'langchain/llms/openai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { RetrievalQAChain } from 'langchain/chains'
import { HumanChatMessage, SystemChatMessage } from 'langchain/schema'
import { getInngest } from './get-inngest'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)

		const videoResourceId = url.searchParams.get('videoResourceId')
		const siteName = url.searchParams.get('siteName') || 'epic-web'

		const inngest = getInngest({ env, projectName: siteName })

		const { transcript }: { transcript: string } = await request.json()

		const splitter = new CharacterTextSplitter()
		const docs = await splitter.createDocuments([transcript])

		const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY }))

		const model = new OpenAI({ openAIApiKey: env.OPENAI_API_KEY, modelName: 'gpt-3.5-turbo-16k', temperature: 0.2 })
		const chain = RetrievalQAChain.fromLLM(model, store.asRetriever())

		const question = `# SEO Expert Video Metadata Assitant
		
		You're a deeply technical SEO expert with a focus on Modern Web Development

		You are never corny or pandering.

		You don't veer from the subject matter in the provided transcript, but you're not afraid to be a little creative.

		I'm your customer, a web developer, and I need you to process my video transcript and give me some suggestions for titles, descriptions, tweets, and emails.
		
		Do NOT talk about SEO or your expertise unless the transcript specifically talks about that subject.

		For the provided transcript create:

		* several drafts for potential titles, sorted by the best first. avoid exclamation points.vary the style. try to summarize the content in a way that will make people want to click through.
		* an article body that serves as a written version of the transcript to be posted alongside the video for people that prefer text. use markdown formatting for the body. divide the text into meaningful sections. do not include an h1 or #. the language for the body should be presented as written material and not as something being watched.
		* several drafts for potential SEO descriptions, sorted by the best first. use markdown formatting for the description.
		* several drafts for potential tweets, sorted by the best first. avoid hashtags and @mentions. don't overuse emoji or excited punctuation. try to summarize the content in a way that will make people want to click through. using hashtags will ruin everything. do not use them like some sort of piece of crap boomer. poast like you mean it.
		* several drafts for potential emails, sorted by the best first. use markdown formatting for the email body.
		* a list of keywords or content tags
		* finally a selection of ideas for additional articles, videos, or follow ups
		
		Output should be in JSON format with all text properly escaped for parsing using this template:

		{
			"body": ""
			"titles": [],
			"descriptions": [],
			"tweets": [],
			"emails": [],
			keywords: [],
			articleIdeas: [],
		}
		`

		async function loadSuggestions() {
			let parsedSuggestions
			let llmSuggestions = await chain.call({
				query: question,
			})

			console.log('llmSuggestions', llmSuggestions)

			try {
				parsedSuggestions = JSON.parse(llmSuggestions.text.trim())
			} catch (error: any) {
				const chat = new ChatOpenAI({ openAIApiKey: env.OPENAI_API_KEY, modelName: 'gpt-4-0613', temperature: 0.2 })
				const response = await chat.call([
					new SystemChatMessage(
						`You are an efficient JSON data formatter. You will be provided with broken json. Parse it and make sure it is valid JSON and return ONLY the JSON`
					),
					new HumanChatMessage(llmSuggestions.text.trim()),
				])

				console.log('chat response', response.text.trim())

				parsedSuggestions = JSON.parse(response.text.trim())
			}

			return parsedSuggestions
		}

		const llmSuggestions = await loadSuggestions()

		const data = {
			videoResourceId,
			llmSuggestions,
		}

		await inngest.send({
			name: 'tip/video.llm.suggestions.created',
			data,
		})

		console.log('videoResourceId', videoResourceId)

		return new Response(JSON.stringify(llmSuggestions, null, 2), {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		})
	},
}
