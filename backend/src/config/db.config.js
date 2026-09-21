import mongoose from 'mongoose';
import env from './env.config.js';

export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected');
}

export default connectDatabase;
