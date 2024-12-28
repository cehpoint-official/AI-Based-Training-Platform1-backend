import mongoose from 'mongoose';

const testReportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  uid: { type: String, required: true, unique: true },
  reportData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("TestReport", testReportSchema);
