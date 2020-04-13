import { RetryOptions } from '../../../models';

export type ConfigClientRetryOptions = RetryOptions;

export type ConfigClientOptions = {
    enabled: boolean;
    profiles: string[];
    'fail-fast': boolean;
    retry?: ConfigClientRetryOptions;
    name: string;
    endpoint: string;
    label: string;
    rejectUnauthorized: boolean;
    auth: {
        user: string;
        pass: string;
    }
};

export type SpringCloudConfigOptions = {
    spring: {
        cloud: {
            config: ConfigClientOptions;
        }
    }
};

export type SpringCloudEnvProps = Partial<SpringCloudConfigOptions> & {
    springBootstrapEnvFile: string;
};