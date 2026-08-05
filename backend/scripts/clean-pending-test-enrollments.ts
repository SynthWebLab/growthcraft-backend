import mongoose from "mongoose";
import { config } from "../src/config";
import { EventEnrollment } from "../src/database/models/EventEnrollment.model";

async function cleanPending() {
  await mongoose.connect(config.MONGODB_URI);
  console.log("Connected to MongoDB...");
  const result = await EventEnrollment.deleteMany({
    status: "pending",
    paymentStatus: "pending",
  });
  console.log(`Cleaned up ${result.deletedCount} abandoned pending event enrollments.`);
  await mongoose.disconnect();
}

cleanPending().catch(console.error);
