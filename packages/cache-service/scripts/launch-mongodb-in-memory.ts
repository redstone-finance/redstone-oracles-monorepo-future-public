import { writeFileSync } from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

// The DB can be stopped by killing the process (e.g sending SIGTERM signal)

const FILE_NAME_WITH_MONGO_DB_URI = "./tmp-mongo-db-uri.log";

(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  writeFileSync(FILE_NAME_WITH_MONGO_DB_URI, uri);
  console.log(`Started mongo DB in memory: ${uri}`);
})();
