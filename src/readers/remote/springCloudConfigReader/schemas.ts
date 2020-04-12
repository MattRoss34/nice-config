import * as joi from '@hapi/joi';

export const NiceConfigOptionsSchema = joi.object().keys({
    bootstrapPath: joi.string(),
    configPath: joi.string().required(),
    activeProfiles: joi.array().items(joi.string()).required(),
    logLevel: joi.string()
});

export const BootstrapConfigSchema = joi.object().keys({
    spring: joi.object().keys({
        cloud: joi.object().keys({
            config: joi.object().keys({
                enabled: joi.boolean(),
                'fail-fast': joi.boolean(),
                retry: joi.object().keys({
                    enabled: joi.boolean().required(),
                    'max-attempts': joi.number(),
                    'max-interval': joi.number(),
                    'initial-interval': joi.number(),
                    multiplier: joi.number()
                }),
                name: joi.string(),
                endpoint: joi.string().uri(),
                label: joi.string(),
                rejectUnauthorized: joi.boolean(),
                auth: joi.object().keys({
                    user: joi.string().required(),
                    pass: joi.string().required()
                })
            })
        })
    })
});