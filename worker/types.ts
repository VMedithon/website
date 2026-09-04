import type { StaffAuth } from "./lib/auth";

export type AppVariables = {
	userId: string | null;
	staff: StaffAuth | null;
	userEmail: string | null;
	userName: string | null;
};

export type AppEnv = {
	Bindings: Cloudflare.Env;
	Variables: AppVariables;
};
