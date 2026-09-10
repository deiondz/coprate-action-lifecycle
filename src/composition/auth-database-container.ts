import "server-only";

import { getMongoAuthDatabaseAdapter } from "@/infrastructure/database/mongo/mongo-auth-database-adapter";

export function getAuthDatabaseAdapter() {
	return getMongoAuthDatabaseAdapter();
}
