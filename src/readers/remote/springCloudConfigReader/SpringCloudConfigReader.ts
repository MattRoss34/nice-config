import * as CloudConfigClient from 'cloud-config-client';
import { ConfigObject, ConfigReaderOptions, RemoteConfigReader, RetryOptions, RetryState } from '../../../models';
import { getAndParsePropsFromEnv, logger, mergeProperties, parsePropertiesToObjects, readYamlAsDocument, retryFunctionWithState } from '../../../utils';
import { DEFAULT_CONFIG_CLIENT_OPTIONS, SPRING_CLOUD_ENV_PROPS } from './constants';
import { ConfigClientOptions, SpringCloudConfigOptions, SpringCloudEnvProps } from './models';
import { BootstrapConfigSchema } from './schemas';

export default class SpringCloudConfigReader implements RemoteConfigReader {

    /**
     * Reads the application's bootstrap configuration file into an object.
     *
     * @param {NiceConfigOptions} options The config options that drive behavior here.
     * @returns {Promise<ConfigObject>} The bootstrap configuration.
     */
    private getSpringBootstrapConfig = async ({
        activeProfiles,
        applicationNameOverride
    }: {
        activeProfiles: string[];
        applicationNameOverride?: string;
    }): Promise<SpringCloudConfigOptions> => {
        const { springBootstrapConfigFile, ...bootstrapEnvProps } = getAndParsePropsFromEnv<SpringCloudEnvProps>(SPRING_CLOUD_ENV_PROPS);

        // Load bootstrap.yml based on the profile name (like devEast or stagingEast)
        let springBootstrapConfig: ConfigObject = {};
        if (springBootstrapConfigFile) {
            try {
                springBootstrapConfig = await readYamlAsDocument(springBootstrapConfigFile, activeProfiles);
            } catch (error) {
                logger.error(`Error reading spring cloud bootstrap file ${springBootstrapConfigFile}: ${error.message}`);
                throw error;
            }
        }

        // Always override active profiles
        // Override appliction name in bootstrap config if defined in application config
        const configClientOverrides: Partial<ConfigClientOptions> = {
            profiles: activeProfiles,
            ...(applicationNameOverride !== undefined ? { name: applicationNameOverride } : {})
        };

        const thisBootstrapConfig: SpringCloudConfigOptions = mergeProperties([
            { spring: { cloud: { config: DEFAULT_CONFIG_CLIENT_OPTIONS }}},
            springBootstrapConfig,
            bootstrapEnvProps,
            { spring: { cloud: { config: configClientOverrides }}}
        ]);

        const { error } = BootstrapConfigSchema.validate(thisBootstrapConfig, { allowUnknown: true });
        if (error) {
            throw new Error(error.details[0].message);
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
		const cloudConfigProperties: ConfigObject | undefined = await CloudConfigClient.load(configClientOptions, null);
		if (cloudConfigProperties) {
			// tslint:disable-next-line: no-any
			cloudConfigProperties.forEach(function(key: string, value: any) {
				cloudConfig[key] = value;
			}, false);
			cloudConfig = parsePropertiesToObjects(cloudConfig);
		}

		return cloudConfig;
	}

    public invoke = async ({ activeProfiles, applicationConfig }: ConfigReaderOptions): Promise<ConfigObject> => {
        const applicationNameOverride = applicationConfig.spring?.cloud?.config?.name;
        const springCloudConfigOptions: SpringCloudConfigOptions = await this.getSpringBootstrapConfig({
            activeProfiles,
            applicationNameOverride
        });
        const configClientOptions = springCloudConfigOptions.spring.cloud.config;

        let cloudConfig: ConfigObject = {};
        if (configClientOptions.enabled) {
            logger.debug(`Spring Cloud Options: ${JSON.stringify(configClientOptions)}`);

            const retryOptions: RetryOptions | undefined = configClientOptions.retry;
            const retryState: RetryState = new RetryState(retryOptions);

            try {
                const cloudConfigResponse = await this.getConfigFromServer(configClientOptions);
                cloudConfig = mergeProperties([
                    cloudConfigResponse,
                    springCloudConfigOptions
                ]);

                logger.debug(`Cloud Config: ${JSON.stringify(cloudConfig)}`);
            } catch (error) {
                logger.warn("Error reading cloud config: ", error);
                if (configClientOptions['fail-fast'] === true) {
                    if (retryOptions && retryOptions.enabled === true) {
                        cloudConfig = await retryFunctionWithState<ConfigObject>(
                            () => this.getConfigFromServer(configClientOptions),
                            retryState
                        );
                    } else {
                        throw error;
                    }
                }
            }
        }

        return cloudConfig;
    }
}
