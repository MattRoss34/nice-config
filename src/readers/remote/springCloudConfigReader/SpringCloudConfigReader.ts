import * as CloudConfigClient from 'nice-cloud-config-client';
import { existsSync } from 'fs';
import { ConfigObject, ConfigReaderOptions, Document, RemoteConfigReader, RetryOptions, RetryState } from '../../../models';
import { getAndParsePropsFromEnv, logger, mergeProperties, parsePropertiesToObjects, readYamlAsDocument, retryFunctionWithState } from '../../../utils';
import { DEFAULT_CONFIG_CLIENT_OPTIONS, SPRING_CLOUD_ENV_PROPS } from './constants';
import { ConfigClientOptions, SpringCloudConfigOptions, SpringCloudEnvProps } from './models';
import { BootstrapConfigSchema } from './schemas';

export default class SpringCloudConfigReader implements RemoteConfigReader {

    private cloudConfig: ConfigObject = {};

    /**
     * Reads the application's bootstrap configuration file into an object.
     *
     * @param {NiceConfigOptions} options The config options that drive behavior here.
     * @returns {Promise<ConfigObject>} The bootstrap configuration.
     */
    private getSpringBootstrapConfig = async ({
        activeProfiles,
        applicationNameOverride,
        defaultConfigPath
    }: {
        activeProfiles: string[];
        applicationNameOverride?: string;
        defaultConfigPath: string;
    }): Promise<SpringCloudConfigOptions | undefined> => {
        const { springBootstrapEnvFile, ...bootstrapEnvProps } = getAndParsePropsFromEnv<SpringCloudEnvProps>(SPRING_CLOUD_ENV_PROPS);
        const springBootstrapConfigFile = springBootstrapEnvFile || `${defaultConfigPath}/bootstrap.yml`;

        const bootstrapExists = existsSync(springBootstrapConfigFile);
        if (!bootstrapExists && springBootstrapEnvFile) {
            throw new Error(`Bootstrap file not found at ${springBootstrapConfigFile}`);
        }

        let thisBootstrapConfig: SpringCloudConfigOptions | undefined = undefined;
        if (bootstrapExists) {
            // Load bootstrap.yml based on the profile name (like devEast or stagingEast)
            let springBootstrapConfigDoc: Document = {};
            try {
                springBootstrapConfigDoc = await readYamlAsDocument(springBootstrapConfigFile, activeProfiles);
            } catch (error) {
                logger.error(`Error reading spring cloud bootstrap file ${springBootstrapConfigFile}: ${error.message}`);
                throw error;
            }

            // Always override active profiles
            // Override appliction name in bootstrap config if defined in application config
            const configClientOverrides: Partial<ConfigClientOptions> = {
                profiles: activeProfiles,
                ...(applicationNameOverride !== undefined ? { name: applicationNameOverride } : {})
            };

            thisBootstrapConfig = mergeProperties<SpringCloudConfigOptions>([
                { spring: { cloud: { config: DEFAULT_CONFIG_CLIENT_OPTIONS }}},
                springBootstrapConfigDoc,
                bootstrapEnvProps,
                { spring: { cloud: { config: configClientOverrides }}}
            ]);

            const { error } = BootstrapConfigSchema.validate(thisBootstrapConfig, { allowUnknown: true });
            if (error) {
                throw new Error(error.details[0].message);
            }
        }

        return thisBootstrapConfig;
    }

	/**
	 * Gets the external configuration from Spring Cloud Config Server.
	 *
	 * @param {ConfigClientOptions} configClientOptions The options to be used for the cloud config client.
	 * @returns {Promise<ConfigObject>} The Spring Environment Object obtained from the Config Server.
	 */
	private getConfigFromServer = async (configClientOptions: ConfigClientOptions): Promise<ConfigObject> => {
		let cloudConfig: ConfigObject = {};
		const cloudConfigProperties: ConfigObject | undefined = await CloudConfigClient.load(configClientOptions, undefined);
		if (cloudConfigProperties) {
			// tslint:disable-next-line: no-any
			cloudConfigProperties.forEach(function(key: string, value: any) {
				cloudConfig[key] = value;
			}, false);
			cloudConfig = parsePropertiesToObjects(cloudConfig);
		}

		return cloudConfig;
	}

    public invoke = async ({ activeProfiles, applicationConfig, defaultConfigPath }: ConfigReaderOptions): Promise<ConfigObject> => {
        const applicationNameOverride = applicationConfig.spring?.cloud?.config?.name;
        const springCloudConfigOptions = await this.getSpringBootstrapConfig({
            activeProfiles,
            applicationNameOverride,
            defaultConfigPath
        });

        if (springCloudConfigOptions && springCloudConfigOptions.spring.cloud.config.enabled) {
            const configClientOptions = springCloudConfigOptions.spring.cloud.config;
            logger.debug(`Spring Cloud Options: ${JSON.stringify(configClientOptions)}`);

            const retryOptions: RetryOptions | undefined = configClientOptions.retry;
            const retryState: RetryState = new RetryState(retryOptions);

            let cloudConfigResponse: ConfigObject | undefined;
            try {
                cloudConfigResponse = await this.getConfigFromServer(configClientOptions);
            } catch (error) {
                logger.warn("Error reading cloud config: ", error);
                if (configClientOptions['fail-fast'] === true) {
                    if (retryOptions && retryOptions.enabled === true) {
                        cloudConfigResponse = await retryFunctionWithState<ConfigObject>(
                            () => this.getConfigFromServer(configClientOptions),
                            retryState
                        );
                    } else {
                        throw error;
                    }
                }
            }

            if (cloudConfigResponse) {
                this.cloudConfig = mergeProperties([
                    cloudConfigResponse,
                    springCloudConfigOptions
                ]);
            }
        }
        logger.debug(`Cloud Config: ${JSON.stringify(this.cloudConfig)}`);

        return this.cloudConfig;
    }
}
