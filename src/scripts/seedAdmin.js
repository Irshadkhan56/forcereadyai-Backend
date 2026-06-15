import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load env variables
dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log(`[Admin Seeding] Connecting to database...`);
    await mongoose.connect(mongoUri);
    console.log(`[Admin Seeding] Connected to database.`);

    const adminEmail = 'admin@forceready.ai';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log(`[Admin Seeding] Admin account already exists: ${adminEmail}`);
      // Ensure the role is admin and it's not blocked
      adminExists.role = 'admin';
      adminExists.isBlocked = false;
      await adminExists.save();
      console.log(`[Admin Seeding] Verified/Updated admin role for ${adminEmail}`);
    } else {
      console.log(`[Admin Seeding] Creating new admin account...`);
      const adminUser = await User.create({
        name: 'ForceReady Admin',
        email: adminEmail,
        password: 'Admin@123456',
        role: 'admin',
        authProvider: 'local',
        isBlocked: false
      });
      console.log(`[Admin Seeding] Admin account created successfully: ${adminUser.email}`);
    }

    // Close Connection
    await mongoose.connection.close();
    console.log(`[Admin Seeding] Connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Admin Seeding Error] Seeding process failed:`, error.message);
    process.exit(1);
  }
};

seedAdmin();
