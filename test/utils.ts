export const setEnvVars = (vars: Record<string, string>) => {
	process.env = {
		...process.env,
		...vars
	};
};