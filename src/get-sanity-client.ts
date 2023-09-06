import { createClient } from '@sanity/client'
import { getConfigForProject } from './get-config'

export function getSanityClient({ env, projectName }: { env: Env; projectName: string }) {
	const config = getConfigForProject(projectName, env)

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
