import { ConfigObject } from '../models';
import { logger } from './logger';
import { parsePropertiesToObjects } from './documentUtils';

export type EnvVariableMapping = {
    envVariableName: string;
    propertyName: string;
};

export const getPropertiesFromEnv = (envVariableMappings: Array<EnvVariableMapping>): Record<string, string> => {
    let envProps: Record<string, string> = {};
    envVariableMappings.forEach(({ envVariableName, propertyName }) => {
        if (process.env[envVariableName] !== undefined) {
            envProps[propertyName] = process.env[envVariableName]!;
        }
    });

    return envProps;
};

export const getAndParsePropsFromEnv = (envVariableMappings: Array<EnvVariableMapping>): ConfigObject =>
    parsePropertiesToObjects(getPropertiesFromEnv(envVariableMappings));

/**
 * Retrieves the properties defined by the APPLICATION_JSON env variable, if defined.
 *
 * @returns {ConfigObject} The Application JSON from ENV as an Object.
 */
export const getApplicationJsonFromEnv = (): ConfigObject => {
    let applicationJson: ConfigObject = {};
    if (process.env.APPLICATION_JSON !== undefined) {
        applicationJson = JSON.parse(process.env.APPLICATION_JSON);
        logger.debug(`Application JSON from Env: ${JSON.stringify(applicationJson)}`);
    }

    return applicationJson;
};