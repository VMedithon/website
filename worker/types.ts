import type { StaffAuth } from "./lib/auth";

export type AppVariables = {
	userId: string | null;
	staff: StaffAuth | null;
	userEmail: string | null;
	userName: string | null;
};

type AssetManifest = { fetch: (request: Request) => Promise<Response> };

export type AppEnv = {
	Bindings: Cloudflare.Env & { ASSETS?: AssetManifest; CERTIFICATE_SIGNING_SECRET?: string };
	Variables: AppVariables;
};
