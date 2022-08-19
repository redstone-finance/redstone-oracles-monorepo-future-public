import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

export const connectToTestDB = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
};

export const dropTestDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};
