
import { injectable } from 'inversify';
import { ConfigObject, NiceConfigOptions } from './models';
import { readApplicationConfig, readBootstrapConfig } from './readers/local';
import * as remoteConfigReaders from './readers/remote';
import { NiceConfigOptionsSchema } from './schemas';
import { logger, mergeProperties } from './utils';

@injectable()
export class NiceConfig {
	private bootstrapConfig: ConfigObject;
	private Config: ConfigObject | undefined;

	/**
	 * Reads an application's configuration properties from various sources
	 * and merges them into a single configuration object.
	 *
	 * @param {NiceConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	private async readConfig(options: NiceConfigOptions): Promise<ConfigObject> {
		let configProperties: ConfigObject[] = [];

		this.bootstrapConfig = await readBootstrapConfig(options);
		logger.debug(`Using Bootstrap Config: ${JSON.stringify(this.bootstrapConfig)}`);

		const applicationConfig: ConfigObject =
			await readApplicationConfig(options.configPath, options.activeProfiles);
		logger.debug(`Using Application Config: ${JSON.stringify(applicationConfig)}`);
		configProperties.push(applicationConfig);

		// Override appliction name in bootstrap config if defined in application config
		if (applicationConfig.spring
				&& applicationConfig.spring.cloud
				&& applicationConfig.spring.cloud.config
				&& applicationConfig.spring.cloud.config.name) {
					this.bootstrapConfig.spring.cloud.config.name = applicationConfig.spring.cloud.config.name;
				}

		const readers = Object.values(remoteConfigReaders);

		for (let i=0; i < readers.length; i++) {
			const remoteConfig = await readers[i](this.bootstrapConfig);
			configProperties.push(remoteConfig);
		}

		// Bootstrap properties have the highest priority, so pushing this last
		configProperties.push(this.bootstrapConfig);

		// Merge the properties into a single object
		this.Config = mergeProperties(configProperties);

		logger.debug(`Using Config: ${JSON.stringify(this.Config)}`);
		return this.Config;
	}

	/**
	 * Initialize the config instance by reading all property sources.
	 *
	 * @param {NiceConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	public async load(options: NiceConfigOptions): Promise<ConfigObject> {
		const { error } = NiceConfigOptionsSchema.validate(options);
		if (error !== null) {
			throw new Error('Invalid options supplied. Please consult the documentation.');
		}

		logger.level = (options.level !== undefined ? options.level : 'info');

		return await this.readConfig(options);
	}

	public instance(): ConfigObject {
		if (this.Config === undefined) {
			throw new Error('NiceConfig hasn\'t been loaded yet. Call \'load\' function first.');
		}

		return this.Config;
	}

}