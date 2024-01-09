import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;

export const createTestDB = async () => {
  mongo = await MongoMemoryServer.create({});
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  return uri;
};

const TEST_DB_ALLOWED_HOSTS = ["127.0.0.1", "localhost", undefined];
export const dropTestDatabase = async () => {
  if (!TEST_DB_ALLOWED_HOSTS.includes(mongoose.connection.host)) {
    throw new Error(
      `You are trying to drop non local database! ${mongoose.connection.host}`
    );
  }
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};
