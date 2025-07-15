import mongoose from 'mongoose';

const AIConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AIConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.AIConfig || mongoose.model('AIConfig', AIConfigSchema); 