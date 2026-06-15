import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';

dotenv.config();

const deleteAiQuestions = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log(`[Delete AI Questions] Connecting to database...`);
    await mongoose.connect(mongoUri);
    console.log(`[Delete AI Questions] Connected.`);

    const countBefore = await Question.countDocuments({ source: 'ai_generated' });
    console.log(`[Delete AI Questions] Found ${countBefore} AI-generated questions in the database.`);

    if (countBefore > 0) {
      const result = await Question.deleteMany({ source: 'ai_generated' });
      console.log(`[Delete AI Questions] Successfully deleted ${result.deletedCount} AI-generated questions.`);
    } else {
      console.log(`[Delete AI Questions] No AI-generated questions found to delete.`);
    }

    const totalRemaining = await Question.countDocuments();
    console.log(`[Delete AI Questions] Total remaining questions in database: ${totalRemaining}`);

    await mongoose.connection.close();
    console.log(`[Delete AI Questions] Database connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Delete AI Questions Error] Process failed:`, error.message);
    process.exit(1);
  }
};

deleteAiQuestions();
