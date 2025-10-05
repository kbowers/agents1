import Database from 'better-sqlite3';
declare const db: Database.Database;
export declare const run: (sql: string, params?: any[]) => Database.RunResult;
export declare const get: (sql: string, params?: any[]) => unknown;
export declare const query: (sql: string, params?: any[]) => unknown[];
export declare const initDb: () => void;
export default db;
//# sourceMappingURL=index.d.ts.map