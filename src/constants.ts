import { EnvVariableMapping } from "./utils";

export const NICE_CONFIG_ENV_OPTIONS: Array<EnvVariableMapping> = [
    { envVariableName: 'CONFIG_BOOTSTRAP_PATH', propertyName: 'bootstrapPath' },
    { envVariableName: 'CONFIG_PATH', propertyName: 'configPath' },
    { envVariableName: 'ACTIVE_PROFILES', propertyName: 'activeProfiles' },
    { envVariableName: 'LOG_LEVEL', propertyName: 'logLevel' },
];

export const PREDEFINED_ENV_PROPERTIES: Array<EnvVariableMapping> = [
    { envVariableName: 'SPRING_CONFIG_ENDPOINT', propertyName: 'spring.cloud.config.endpoint' },
    { envVariableName: 'SPRING_CONFIG_AUTH_USER', propertyName: 'spring.cloud.config.auth.user' },
    { envVariableName: 'SPRING_CONFIG_AUTH_PASS', propertyName: 'spring.cloud.config.auth.pass' },
];