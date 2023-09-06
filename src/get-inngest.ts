import { Inngest } from 'inngest'
import { getConfigForProject } from './get-config'

export function getInngest({ env, projectName }: { env: Env; projectName: string }) {
	const config = getConfigForProject(projectName, env)

	if (!config) {
		throw new Error('Bad request: Missing `config`')
	}

	return new Inngest({ name: config.inngestName, eventKey: config.ingestEventKey })
}
