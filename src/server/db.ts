import mongoose from 'mongoose';

export const DATABASE_NAME = 'campus_loop_marketplace';

const state = globalThis as typeof globalThis & { marketplaceConnection?: Promise<typeof mongoose> };

export function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');

  // dbName overrides the URI path so this app only writes to its dedicated database.
  state.marketplaceConnection ??= mongoose.connect(uri, {
    dbName: DATABASE_NAME,
    maxPoolSize: 8,
    serverSelectionTimeoutMS: 5000,
    autoIndex: true,
  }).catch((error) => {
    state.marketplaceConnection = undefined;
    throw error;
  });
  return state.marketplaceConnection;
}
