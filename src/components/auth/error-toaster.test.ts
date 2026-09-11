import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

describe("global auth error toaster", () => {
	test("is mounted exactly once by the auth provider", () => {
		const authRoot = dirname(fileURLToPath(import.meta.url));
		const componentsRoot = join(authRoot, "..");
		const authProvider = readFileSync(
			join(authRoot, "auth-provider.tsx"),
			"utf8",
		);
		const providers = readFileSync(
			join(componentsRoot, "providers.tsx"),
			"utf8",
		);

		const mounts = [authProvider, providers].flatMap(
			(source) => source.match(/<ErrorToaster\s*\/>/g) ?? [],
		);

		assert.equal(mounts.length, 1);
	});
});
