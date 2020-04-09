import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { ConfigObject } from "../../models";
import { readYamlAsDocument, parsePropertiesToObjects, logger, mergeProperties } from "../../utils";

/**
 * Read the application's configuration files and merge them into a single object.
 *
 * @param {string} appConfigPath Path to where the application yaml files can be found.
 * @param {string[]} activeProfiles The active profiles to use for filtering config files.
 * @returns {Promise<ConfigObject>} The merged (local) application configuration files.
 */
export const readApplicationConfig = async (appConfigPath: string, activeProfiles: string[]): Promise<ConfigObject> => {
    const applicationConfig: ConfigObject = await readYamlAsDocument(`${appConfigPath}/application.yml`, activeProfiles);
    const appConfigs: ConfigObject[] = [ applicationConfig ];
    activeProfiles.forEach(function(activeProfile: string) {
        const profileSpecificYaml = `application-${activeProfile}.yml`;
        const profileSpecificYamlPath = `${appConfigPath}/${profileSpecificYaml}`;
        if (fs.existsSync(profileSpecificYamlPath)) {
            const propDoc = yaml.safeLoad(fs.readFileSync(profileSpecificYamlPath, 'utf8'));
            const thisDoc = parsePropertiesToObjects(propDoc);
            appConfigs.push(thisDoc);
        } else {
            logger.debug(`Profile-specific yaml not found: ${profileSpecificYaml}`);
        }
    });

    return mergeProperties(appConfigs);
};