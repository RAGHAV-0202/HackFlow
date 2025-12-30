import mongoose from "mongoose";

async function getStats(){
  const startTime = Date.now();
  const result = await mongoose.connection.db.command({ ping: 1 });
  const endTime = Date.now();
  const latency = endTime - startTime;

  const isMongoConnected = mongoose.connection.readyState === 1;
  const statusInfo = {
    status: "OK",
    mongoDB: isMongoConnected ? "Connected" : "Disconnected",
    latency: latency + "ms",
    timestamp: new Date(),
  };
  return statusInfo
}
export default getStats ;