import { EnvVariableMapping } from "./utils";

export const NICE_CONFIG_ENV_OPTIONS: Array<EnvVariableMapping> = [
    { envVariableName: 'CONFIG_PATH', propertyName: 'configPath' },
    { envVariableName: 'ACTIVE_PROFILES', propertyName: 'activeProfiles' },
    { envVariableName: 'LOG_LEVEL', propertyName: 'logLevel' },
];
