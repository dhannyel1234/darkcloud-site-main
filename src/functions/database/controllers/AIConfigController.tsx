import AIConfig from '../schemas/AIConfigSchema';
import { connectToDatabase } from '../database';

export class AIConfigController {
  static async set(key: string, value: string) {
    await connectToDatabase();
    
    const config = await AIConfig.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
    
    return config;
  }

  static async get(key: string) {
    await connectToDatabase();
    
    const config = await AIConfig.findOne({ key });
    return config?.value;
  }

  static async getAll() {
    await connectToDatabase();
    
    const configs = await AIConfig.find({});
    return configs;
  }
} 