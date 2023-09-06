import { Inngest } from 'inngest'
import { getConfigForProject } from './get-config'

export function getInngest({ env, projectName }: { env: Env; projectName: string }) {
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

	return new Inngest({ name: config.inngestName, eventKey: config.ingestEventKey })
}
