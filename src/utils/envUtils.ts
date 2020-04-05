import { ConfigObject } from '../models';
import { logger } from './logger';
import { parsePropertiesToObjects } from './documentUtils';

export type EnvVariableMapping = {
    envVariableName: string;
    propertyName: string;
};

export const getPropertiesFromEnv = (envVariableMappings: Array<EnvVariableMapping>): ConfigObject => {
    let envProps: Record<string, string> = {};
    envVariableMappings.forEach(({ envVariableName, propertyName }) => {
        if (process.env[envVariableName] !== undefined) {
            envProps[propertyName] = process.env[envVariableName]!;
        }
    });

    return parsePropertiesToObjects(envProps);
};

/**
 * Retrieves the properties defined by the APPLICATION_JSON env variable, if defined.
 *
 * @returns {ConfigObject} The Spring Application JSON from ENV as an Object.
 */
export const getSpringApplicationJsonFromEnv = (): ConfigObject => {
    let springApplicationJson: ConfigObject = {};
    if (process.env.APPLICATION_JSON !== undefined) {
        springApplicationJson = JSON.parse(process.env.APPLICATION_JSON);
        logger.debug(`Spring Application JSON from Env: ${JSON.stringify(springApplicationJson)}`);
    }

    return springApplicationJson;
};