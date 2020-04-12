import { ConfigObject } from '.';

export type ConfigReaderOptions = {
    defaultConfigPath?: string;
    activeProfiles: string[];
    applicationConfig: ConfigObject;
};

export interface RemoteConfigReader {
    invoke: (bootstrapConfig: ConfigReaderOptions) => Promise<ConfigObject>;
}