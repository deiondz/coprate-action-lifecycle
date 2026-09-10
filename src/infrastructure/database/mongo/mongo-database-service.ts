import "server-only";

import mongoose, { type Connection } from "mongoose";

import env from "@/../env.config";
import type {
	DatabaseConnectionState,
	DatabaseService,
} from "@/application/ports/outbound/database-service";

type MongoDatabaseCache = {
	connection: Connection | null;
	promise: Promise<typeof mongoose> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
	mongoDatabaseCache?: MongoDatabaseCache;
};

if (!globalForMongo.mongoDatabaseCache) {
	globalForMongo.mongoDatabaseCache = {
		connection: null,
		promise: null,
	};
}

const mongoDatabaseCache = globalForMongo.mongoDatabaseCache;

const readyStateMap: Record<number, DatabaseConnectionState> = {
	0: "disconnected",
	1: "connected",
	2: "connecting",
	3: "disconnecting",
};

export class MongoDatabaseService implements DatabaseService {
	constructor(
		private readonly uri = env.MONGODB_URI,
		private readonly maxPoolSize = env.MONGODB_MAX_POOL_SIZE,
	) {}

	async connect(): Promise<void> {
		if (mongoDatabaseCache.connection) {
			return;
		}

		if (!mongoDatabaseCache.promise) {
			mongoDatabaseCache.promise = mongoose
				.connect(this.uri, {
					bufferCommands: false,
					maxPoolSize: this.maxPoolSize,
				})
				.catch((error) => {
					mongoDatabaseCache.promise = null;
					throw error;
				});
		}

		const mongooseInstance = await mongoDatabaseCache.promise;
		mongoDatabaseCache.connection = mongooseInstance.connection;
	}

	async disconnect(): Promise<void> {
		if (!mongoDatabaseCache.connection) {
			return;
		}

		await mongoose.disconnect();
		mongoDatabaseCache.connection = null;
		mongoDatabaseCache.promise = null;
	}

	getState(): DatabaseConnectionState {
		return readyStateMap[mongoose.connection.readyState] ?? "disconnected";
	}

	getConnection(): Connection {
		return mongoDatabaseCache.connection ?? mongoose.connection;
	}
}
