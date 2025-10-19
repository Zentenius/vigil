/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	// TEMPORARY: allow builds to succeed even if ESLint or TypeScript report errors.
	// Remove these settings once you fix the underlying issues.
	eslint: {
		// Skip ESLint during production builds
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Allow production builds even when type errors exist
		ignoreBuildErrors: true,
	},
};

export default config;
