import Container from '../../Container';
import { SpringCloudConfigGateway } from '../../gateways';
import { ConfigClientOptions, ConfigObject, RemoteConfigReader, RetryOptions, RetryState } from '../../models';
import { logger, retryFunctionWithState } from '../../utils';

export const springCloudConfigReader: RemoteConfigReader = async (bootstrapConfig: ConfigObject): Promise<ConfigObject> => {
        const configClientOptions: ConfigClientOptions | undefined = bootstrapConfig 
                && bootstrapConfig.spring
                && bootstrapConfig.spring.cloud
                && bootstrapConfig.spring.cloud.config;

        let cloudConfig: ConfigObject = {};
        if (configClientOptions && configClientOptions.enabled) {
            logger.debug(`Spring Cloud Options: ${JSON.stringify(configClientOptions)}`);

            const retryOptions: RetryOptions | undefined = configClientOptions.retry;
            const retryState: RetryState = new RetryState(retryOptions);
            const springCloudConfigGateway = Container.get(SpringCloudConfigGateway)

            try {
                cloudConfig = await springCloudConfigGateway.getConfigFromServer(configClientOptions);
                logger.debug(`Cloud Config: ${JSON.stringify(cloudConfig)}`);
            } catch (error) {
                logger.warn("Error reading cloud config: ", error);
                if (configClientOptions['fail-fast'] === true) {
                    if (retryOptions && retryOptions.enabled === true) {
                        cloudConfig = await retryFunctionWithState<ConfigObject>(
                            () => springCloudConfigGateway.getConfigFromServer(configClientOptions),
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