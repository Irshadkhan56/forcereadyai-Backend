import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Question from '../models/Question.js';
import Organization from '../models/Organization.js';
import Category from '../models/Category.js';
import Position from '../models/Position.js';

dotenv.config();

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const seedCustomQuestions = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log(`[Seed Custom Questions] Connecting to database...`);
    await mongoose.connect(mongoUri);
    console.log(`[Seed Custom Questions] Connected.`);

    // Read customQuestions.json
    const jsonPath = path.join(process.cwd(), 'src', 'scripts', 'customQuestions.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`customQuestions.json file not found at ${jsonPath}`);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const questionsData = JSON.parse(fileContent);

    if (!Array.isArray(questionsData)) {
      throw new Error('customQuestions.json must contain a JSON array of questions');
    }

    console.log(`[Seed Custom Questions] Loaded ${questionsData.length} questions from JSON.`);

    const orgCache = {};
    const catCache = {};
    const posCache = {};
    const questionsToSave = [];

    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i];
      const index = i + 1;

      if (!q.organization || typeof q.organization !== 'string' || !q.organization.trim()) {
        console.warn(`[Row ${index}] Skipping: "organization" name is required.`);
        continue;
      }
      if (!q.category || typeof q.category !== 'string' || !q.category.trim()) {
        console.warn(`[Row ${index}] Skipping: "category" name is required.`);
        continue;
      }
      if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        console.warn(`[Row ${index}] Skipping: "question" text is required.`);
        continue;
      }

      const orgName = q.organization.trim();
      const catName = q.category.trim();
      const posName = q.position ? q.position.trim() : '';
      const questionText = q.question.trim();
      const idealAnswerText = q.idealAnswer ? q.idealAnswer.trim() : '';
      const difficultyValue = q.difficulty ? q.difficulty.toLowerCase().trim() : 'medium';
      
      let tagsValue = [];
      if (Array.isArray(q.tags)) {
        tagsValue = q.tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(Boolean);
      } else if (q.tags && typeof q.tags === 'string') {
        tagsValue = q.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      // 1. Resolve Organization
      let orgId;
      const orgCacheKey = orgName.toLowerCase();
      if (orgCache[orgCacheKey]) {
        orgId = orgCache[orgCacheKey];
      } else {
        let org = await Organization.findOne({ name: { $regex: new RegExp('^' + escapeRegExp(orgName) + '$', 'i') } });
        if (!org) {
          org = await Organization.create({
            name: orgName,
            description: `Auto-created during custom questions seeding.`,
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(orgName)}&background=random`,
          });
          console.log(`[Seed Custom Questions] Created Organization: "${orgName}"`);
        }
        orgId = org._id;
        orgCache[orgCacheKey] = orgId;
      }

      // 2. Resolve Category
      let catId;
      const catCacheKey = `${orgId}_${catName.toLowerCase()}`;
      if (catCache[catCacheKey]) {
        catId = catCache[catCacheKey];
      } else {
        let cat = await Category.findOne({
          organization: orgId,
          name: { $regex: new RegExp('^' + escapeRegExp(catName) + '$', 'i') }
        });
        if (!cat) {
          cat = await Category.create({
            name: catName,
            organization: orgId,
            description: `Auto-created during custom questions seeding.`,
          });
          console.log(`[Seed Custom Questions] Created Category: "${catName}" under "${orgName}"`);
        }
        catId = cat._id;
        catCache[catCacheKey] = catId;
      }

      // 3. Resolve Position
      let posId = null;
      if (posName) {
        const posCacheKey = `${orgId}_${catId}_${posName.toLowerCase()}`;
        if (posCache[posCacheKey]) {
          posId = posCache[posCacheKey];
        } else {
          let pos = await Position.findOne({
            organization: orgId,
            category: catId,
            name: { $regex: new RegExp('^' + escapeRegExp(posName) + '$', 'i') }
          });
          if (!pos) {
            pos = await Position.create({
              name: posName,
              organization: orgId,
              category: catId,
              description: `Auto-created during custom questions seeding.`,
            });
            console.log(`[Seed Custom Questions] Created Position: "${posName}" under "${orgName} → ${catName}"`);
          }
          posId = pos._id;
          posCache[posCacheKey] = posId;
        }
      }

      questionsToSave.push({
        organization: orgId,
        category: catId,
        position: posId,
        question: questionText,
        idealAnswer: idealAnswerText,
        difficulty: ['easy', 'medium', 'hard'].includes(difficultyValue) ? difficultyValue : 'medium',
        tags: tagsValue,
        source: 'manual',
      });
    }

    if (questionsToSave.length > 0) {
      const result = await Question.insertMany(questionsToSave);
      console.log(`[Seed Custom Questions] Successfully inserted ${result.length} custom questions into MongoDB.`);
    } else {
      console.log(`[Seed Custom Questions] No valid questions to insert.`);
    }

    await mongoose.connection.close();
    console.log(`[Seed Custom Questions] Done. Connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Custom Questions Error] Process failed:`, error.message);
    process.exit(1);
  }
};

seedCustomQuestions();
