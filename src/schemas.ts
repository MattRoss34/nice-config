import * as joi from '@hapi/joi';

export const NiceConfigOptionsSchema = joi.object().keys({
    bootstrapPath: joi.string(),
    configPath: joi.string().required(),
    activeProfiles: joi.array().items(joi.string()).required(),
    logLevel: joi.string()
});
