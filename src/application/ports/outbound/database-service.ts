export type DatabaseConnectionState =
	| "connected"
	| "connecting"
	| "disconnected"
	| "disconnecting";

export interface DatabaseService {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	getState(): DatabaseConnectionState;
}
