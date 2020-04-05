import { ConfigObject, NiceConfigOptions } from "../../models";
import { mergeProperties, readYamlAsDocument, getSpringApplicationJsonFromEnv, getPropertiesFromEnv } from "../../utils";
import { BootstrapConfigSchema } from "../../schemas";
import { PREDEFINED_ENV_PROPERTIES } from "../../constants";

/**
 * Reads the application's bootstrap configuration file into an object.
 *
 * @param {NiceConfigOptions} options The config options that drive behavior here.
 * @returns {Promise<ConfigObject>} The bootstrap configuration.
 */
export const readBootstrapConfig = async (options: NiceConfigOptions): Promise<ConfigObject> => {
    const { bootstrapPath, configPath, activeProfiles } = options;

    // Load bootstrap.yml based on the profile name (like devEast or stagingEast)
    const theBootstrapPath: string = bootstrapPath !== undefined ? bootstrapPath : configPath;
    const thisBootstrapConfig: ConfigObject = mergeProperties([
        await readYamlAsDocument(`${theBootstrapPath}/bootstrap.yml`, activeProfiles),
        getSpringApplicationJsonFromEnv(),
        getPropertiesFromEnv(PREDEFINED_ENV_PROPERTIES)
    ]);

    const { error } = BootstrapConfigSchema.validate(thisBootstrapConfig, { allowUnknown: true });
    if (error) {
        throw new Error(error.details[0].message);
    }

    thisBootstrapConfig.spring.cloud.config.profiles = options.activeProfiles;

    return thisBootstrapConfig;
}