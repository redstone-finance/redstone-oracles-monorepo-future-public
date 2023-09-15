import { writeFileSync } from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

// The DB can be stopped by killing the process (e.g sending SIGTERM signal)

const FILE_NAME_WITH_MONGO_DB_URI = "./tmp-mongo-db-uri.log";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const filePath = process.argv[2] ?? FILE_NAME_WITH_MONGO_DB_URI;
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  writeFileSync(filePath, uri);
  console.log(`Started mongo DB in memory: ${uri}`);
})();
