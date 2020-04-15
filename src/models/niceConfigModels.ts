export type NiceConfigOptions = {
    configPath: string;
    activeProfiles: string[];
    logLevel?: string;
};

// tslint:disable-next-line: no-any
export type Document = Record<string, any>;

export type ConfigObject = Document;