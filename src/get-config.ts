export function getConfigForProject(project: string, env: Env) {
	switch (project) {
		case 'epic-web':
			return {
				modelName: 'gpt-3.5-turbo-16k',
				ingestEventKey: env.INNGEST_EVENT_KEY,
				inngestName: 'Epic Web Dev by Kent C. Dodds',
			}
		default:
			break
	}
}
