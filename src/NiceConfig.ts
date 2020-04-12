
import { injectable } from 'inversify';
import { NICE_CONFIG_ENV_OPTIONS } from './constants';
import { ConfigObject, NiceConfigOptions } from './models';
import { readApplicationConfig } from './readers/local';
import * as remoteConfigReaders from './readers/remote';
import { getApplicationJsonFromEnv, getPropertiesFromEnv, logger, mergeProperties } from './utils';

@injectable()
export class NiceConfig {
	private options?: NiceConfigOptions;
	private bootstrapConfig: ConfigObject;
	private Config: ConfigObject = {};

	private getOptions(): NiceConfigOptions {
		if (!this.options) {
			const {
				configPath = './config',
				activeProfiles = '',
				logLevel = 'warn'
			} = getPropertiesFromEnv(NICE_CONFIG_ENV_OPTIONS);

			this.options = {
				configPath,
				activeProfiles: activeProfiles.split(','),
				logLevel
			};
		}

		return this.options;
	}

	/**
	 * Reads an application's configuration properties from various sources
	 * and merges them into a single configuration object.
	 *
	 * @param {NiceConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	private async readConfig(options: NiceConfigOptions): Promise<ConfigObject> {
		let configProperties: ConfigObject[] = [];

		const applicationConfigFromFile: ConfigObject =
			await readApplicationConfig(options.configPath, options.activeProfiles);

		const applicationConfig = mergeProperties([
			applicationConfigFromFile,
			getApplicationJsonFromEnv()
		]);
		logger.debug(`Using Application Config: ${JSON.stringify(applicationConfig)}`);
		configProperties.push(applicationConfig);

		const readers = Object.values(remoteConfigReaders);

		for (let i = 0; i < readers.length; i++) {
			configProperties.push(await readers[i].invoke({
				activeProfiles: options.activeProfiles,
				defaultConfigPath: options.configPath,
				applicationConfig
			}));
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
	public load = async (): Promise<ConfigObject> => {
		return await this.readConfig(this.getOptions());
	}

	public instance = (): ConfigObject => this.Config;
}