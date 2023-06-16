import { Document } from 'langchain/document';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		const videoUrl = url.searchParams.get('videoUrl');
		const videoResourceId = url.searchParams.has('videoResourceId');

		if (!videoUrl) {
			return new Response('Bad request: Missing `proxyUrl` query param', { status: 400 });
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
		});

		const response: any = await transcribed.json();

		let srt = ``;

		for (let i = 0; i < response.results.utterances.length; i++) {
			const utterance = response.results.utterances[i];
			const start = new Date(utterance.start * 1000).toISOString().substr(11, 12).replace('.', ',');
			const end = new Date(utterance.end * 1000).toISOString().substr(11, 12).replace('.', ',');
			srt += `${i + 1}\n${start} --> ${end}\n${utterance.transcript}\n\n`;
		}

		const transcript = response.results.channels[0].alternatives[0].paragraphs.transcript;

		const splitter = new CharacterTextSplitter();
		const docs = await splitter.createDocuments([transcript]);

		const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY }));

		const model = new OpenAI({ openAIApiKey: env.OPENAI_API_KEY });
		const chain = RetrievalQAChain.fromLLM(model, store.asRetriever());

		const question = `Please give me three suggestions for titles for this text as bullet points. I'd also like a short description to use on the website. Additionally provide text for a tweet to share this and email copy to share it with my newsletter. Output should be in JSON.`;

		const res = await chain.call({
			query: question,
		});

		const json = JSON.stringify({ transcript, srt, raw: response, res }, null, 2);

		return new Response(json, {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		});
	},
};
