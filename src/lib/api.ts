import { useAuth } from "@clerk/react";
import { useCallback } from "react";

export function useApi() {
	const { getToken } = useAuth();
	return useCallback(
		async (path: string, options: RequestInit = {}) => {
			const headers = new Headers(options.headers);
			if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
				headers.set("Content-Type", "application/json");
			}
			const token = await getToken();
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
			}
			const response = await fetch(`/api${path}`, { ...options, headers });
			if (!response.ok) {
				const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
				throw new Error(body.error?.message ?? response.statusText);
			}
			if (response.status === 204) return null;
			return response.json() as Promise<unknown>;
		},
		[getToken],
	);
}

export function useApiGet<T>(path: string) {
	const api = useApi();
	const fetch = useCallback(() => api(path) as Promise<T>, [api, path]);
	return fetch;
}
