/// <reference types="vite/client" />

declare module "*.obj?url" {
	const src: string;
	export default src;
}

declare module "*.glb?url" {
	const src: string;
	export default src;
}

interface ImportMetaEnv {
	readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}
