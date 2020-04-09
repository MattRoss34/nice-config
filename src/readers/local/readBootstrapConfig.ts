import { ConfigObject, NiceConfigOptions, Document } from "../../models";
import { mergeProperties, readYamlAsDocument, getApplicationJsonFromEnv, getAndParsePropsFromEnv, logger } from "../../utils";
import { BootstrapConfigSchema } from "../../schemas";
import { PREDEFINED_ENV_PROPERTIES } from "../../constants";

const DEFAULT_BOOTSTRAP_YAML = { spring: { cloud: { config: { enabled: false }}}};

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
    let bootstrapYaml: Document = {};
    try {
        bootstrapYaml = await readYamlAsDocument(`${theBootstrapPath}/bootstrap.yml`, activeProfiles);
    } catch (error) {
        logger.warn(`No bootstrap.yml found in ${theBootstrapPath}`);
    }

    const thisBootstrapConfig: ConfigObject = mergeProperties([
        DEFAULT_BOOTSTRAP_YAML,
        bootstrapYaml,
        getApplicationJsonFromEnv(),
        getAndParsePropsFromEnv(PREDEFINED_ENV_PROPERTIES)
    ]);

    const { error } = BootstrapConfigSchema.validate(thisBootstrapConfig, { allowUnknown: true });
    if (error) {
        throw new Error(error.details[0].message);
    }

    thisBootstrapConfig.spring.cloud.config.profiles = options.activeProfiles;

    return thisBootstrapConfig;
};