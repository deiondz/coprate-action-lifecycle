import "server-only";

import type { DatabaseService } from "@/application/ports/outbound/database-service";
import { MongoDatabaseService } from "@/infrastructure/database/mongo/mongo-database-service";

let databaseService: DatabaseService | undefined;

export function getDatabaseService(): DatabaseService {
	databaseService ??= new MongoDatabaseService();
	return databaseService;
}

export async function connectDatabase(): Promise<DatabaseService> {
	const service = getDatabaseService();
	await service.connect();
	return service;
}
