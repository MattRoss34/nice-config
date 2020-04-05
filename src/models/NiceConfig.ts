import { RetryOptions } from "./Retry";

export type NiceConfigOptions = {
    bootstrapPath?: string;
    configPath: string;
    activeProfiles: string[];
    logLevel?: string;
};

export type ConfigClientRetryOptions = RetryOptions;

export type ConfigClientOptions = {
    enabled: boolean;
    'fail-fast': boolean;
    retry?: ConfigClientRetryOptions;
};

// tslint:disable-next-line: no-any
export type Document = Record<string, any>;

export type ConfigObject = Document;