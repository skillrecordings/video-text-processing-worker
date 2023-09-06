import { createClient } from '@sanity/client'
import { getConfigForProject } from './get-config'

export function getSanityClient({ env, projectName }: { env: Env; projectName: string }) {
	let config
	switch (projectName) {
		case 'epic-web':
			config = getConfigForProject(projectName, env)
			break
		default:
			break
	}

	if (!config) {
		throw new Error('Bad request: Missing `config`')
	}

	return createClient({
		projectId: config.sanity.projectId,
		dataset: config.sanity.dataset,
		token: config.sanity.token,
		useCdn: false,
	})
}
