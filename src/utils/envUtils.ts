import { ConfigObject } from '../models';
import { parsePropertiesToObjects } from './documentUtils';
import { logger } from './logger';

export type EnvVariableMapping = {
    envVariableName: string;
    propertyName: string;
};

export const getPropertiesFromEnv = <TProps extends Record<string, string | undefined>>(envVariableMappings: Array<EnvVariableMapping>): TProps => {
    let envProps: Record<string, string> = {};
    envVariableMappings.forEach(({ envVariableName, propertyName }) => {
        if (process.env[envVariableName] !== undefined) {
            envProps[propertyName] = process.env[envVariableName]!;
        }
    });

    return envProps as TProps;
};

// tslint:disable-next-line: no-any
export const getAndParsePropsFromEnv = <T extends Record<string, any>>(envVariableMappings: Array<EnvVariableMapping>): ConfigObject =>
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