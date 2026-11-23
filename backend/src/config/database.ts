import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables. Set it in your .env file.');
}

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI as string, {
      // Render-compatible options — no deprecated flags needed in Mongoose 8
      serverSelectionTimeoutMS: 10_000, // fail fast if Atlas unreachable
      socketTimeoutMS: 45_000,
    });

    isConnected = connection.connections[0].readyState === 1;
    console.log(`✅  MongoDB connected: ${connection.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect…');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected.');
      isConnected = true;
    });
  } catch (error) {
    console.error('❌  MongoDB connection failed:', error);
    // Exit process so the host (Render) can restart the dyno cleanly
    process.exit(1);
  }
}
