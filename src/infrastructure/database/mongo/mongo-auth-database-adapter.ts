import "server-only";

import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

import env from "@/../env.config";

const globalForMongoAuth = globalThis as typeof globalThis & {
	mongoAuthClient?: MongoClient;
};

if (!globalForMongoAuth.mongoAuthClient) {
	globalForMongoAuth.mongoAuthClient = new MongoClient(env.MONGODB_URI, {
		maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
	});
}

const mongoAuthClient = globalForMongoAuth.mongoAuthClient;

export function getMongoAuthDatabaseAdapter() {
	return mongodbAdapter(mongoAuthClient.db(), {
		client: mongoAuthClient,
		transaction: false,
	});
}
