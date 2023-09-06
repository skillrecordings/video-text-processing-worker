export function getConfigForProject(project: string, env: Env) {
	switch (project) {
		case 'epic-web':
			return {
				modelName: 'gpt-3.5-turbo-16k',
				ingestEventKey: env.INNGEST_EVENT_KEY,
				inngestName: 'Epic Web Dev by Kent C. Dodds',
				sanity: {
					projectId: 'i1a93n76',
					dataset: 'production',
					token: env.EPIC_WEB_SANITY_TOKEN,
				},
			}
		default:
			break
	}
}
