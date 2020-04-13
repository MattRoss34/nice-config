import { EnvVariableMapping } from '../../../utils';
import { ConfigClientOptions } from './models';

export const DEFAULT_CONFIG_CLIENT_OPTIONS: Partial<ConfigClientOptions> = {
    enabled: false,
    profiles: [],
    'fail-fast': false,
    retry: {
        enabled: false
    },
    endpoint: 'http://localhost:8888',
    label: 'master',
    rejectUnauthorized: true,
};

export const SPRING_CLOUD_ENV_PROPS: Array<EnvVariableMapping> = [
    { envVariableName: 'SPRING_CONFIG_BOOTSTRAP_FILE', propertyName: 'springBootstrapEnvFile' },
    { envVariableName: 'SPRING_CONFIG_ENDPOINT', propertyName: 'spring.cloud.config.endpoint' },
    { envVariableName: 'SPRING_CONFIG_AUTH_USER', propertyName: 'spring.cloud.config.auth.user' },
    { envVariableName: 'SPRING_CONFIG_AUTH_PASS', propertyName: 'spring.cloud.config.auth.pass' },
];
