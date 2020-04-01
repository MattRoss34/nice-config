import 'reflect-metadata';
import { NiceConfig } from './NiceConfig';
import Container from './Container';
import { ConfigObject, NiceConfigOptions } from './models';

export * from './models';
export * from './NiceConfig';

export const Config: NiceConfig = Container.get<NiceConfig>(NiceConfig);

// For supporting 'require' syntax, exporting the below as top level functions
export const load = async (cloudConfigOptions: NiceConfigOptions): Promise<ConfigObject> => {
    return await Config.load(cloudConfigOptions);
};

export const instance = (): ConfigObject => {
    return Config.instance();
};