import { ConfigObject } from "src/models";

// export interface RemoteConfigReader {
//     read(bootstrapConfig: ConfigObject): Promise<ConfigObject>;
// }
export type RemoteConfigReader = (bootstrapConfig: ConfigObject) => Promise<ConfigObject>;