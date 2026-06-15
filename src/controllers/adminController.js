import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Category from '../models/Category.js';
import Position from '../models/Position.js';
import Question from '../models/Question.js';
import InterviewSession from '../models/InterviewSession.js';
import { extractQuestionsFromText } from '../services/geminiService.js';

// ─────────────────────────────────────────────────────────────
// ANALYTICS / DASHBOARD
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get dashboard analytics stats
 * @route   GET /admin/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalOrgs,
      totalCategories,
      totalPositions,
      totalQuestions,
      totalSessions,
      recentUsers,
      recentSessions,
    ] = await Promise.all([
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'candidate', isBlocked: false }),
      User.countDocuments({ role: 'candidate', isBlocked: true }),
      Organization.countDocuments(),
      Category.countDocuments(),
      Position.countDocuments(),
      Question.countDocuments(),
      InterviewSession.countDocuments(),
      User.find({ role: 'candidate' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt isBlocked authProvider'),
      InterviewSession.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('organization', 'name')
        .populate('position', 'name'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
        organizations: totalOrgs,
        categories: totalCategories,
        positions: totalPositions,
        questions: totalQuestions,
        sessions: totalSessions,
        recentUsers,
        recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all candidates with search & filter
 * @route   GET /admin/users?search=&status=&page=&limit=
 */
export const getUsers = async (req, res, next) => {
  const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
  try {
    const query = { role: 'candidate' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') query.isBlocked = false;
    if (status === 'blocked') query.isBlocked = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user + their session history
 * @route   GET /admin/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const sessions = await InterviewSession.find({ user: user._id })
      .populate('organization', 'name')
      .populate('position', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: { user, sessions } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Block a user
 * @route   PATCH /admin/users/block/:id
 */
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot block an admin account' });

    user.isBlocked = true;
    await user.save();
    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unblock a user
 * @route   PATCH /admin/users/unblock/:id
 */
export const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete an admin account' });

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// ORGANIZATION MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createOrganization = async (req, res, next) => {
  try {
    const org = await Organization.create(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.status(200).json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createCategory = async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: cat });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POSITION MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createPosition = async (req, res, next) => {
  try {
    const pos = await Position.create(req.body);
    res.status(201).json({ success: true, data: pos });
  } catch (error) {
    next(error);
  }
};

export const updatePosition = async (req, res, next) => {
  try {
    const pos = await Position.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pos) return res.status(404).json({ success: false, message: 'Position not found' });
    res.status(200).json({ success: true, data: pos });
  } catch (error) {
    next(error);
  }
};

export const deletePosition = async (req, res, next) => {
  try {
    const pos = await Position.findByIdAndDelete(req.params.id);
    if (!pos) return res.status(404).json({ success: false, message: 'Position not found' });
    res.status(200).json({ success: true, message: 'Position deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get questions with search + filter + pagination
 * @route   GET /admin/questions
 */
export const getQuestions = async (req, res, next) => {
  const { search = '', organization, category, position, difficulty, page = 1, limit = 15 } = req.query;
  try {
    const query = {};
    if (organization && mongoose.Types.ObjectId.isValid(organization)) query.organization = organization;
    if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
    if (position && mongoose.Types.ObjectId.isValid(position)) query.position = position;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('organization', 'name')
        .populate('category', 'name')
        .populate('position', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Question.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a single question
 * @route   POST /admin/questions
 */
export const createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id, source: 'manual' });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a question
 * @route   PUT /admin/questions/:id
 */
export const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a question
 * @route   DELETE /admin/questions/:id
 */
export const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// BOOK UPLOAD & AI EXTRACTION
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Upload a book file, extract text, call AI to identify Q&A, save to Question Bank
 * @route   POST /admin/upload-book
 * @access  Admin only
 *
 * Requires multipart/form-data with fields:
 *   - file       : PDF, DOCX, or TXT
 *   - organization, category (required)
 *   - position   (optional)
 *   - difficulty (optional, default: medium)
 */
export const uploadBook = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { organization, category, position, difficulty = 'medium' } = req.body;
    if (!organization || !category) {
      return res.status(400).json({ success: false, message: 'Organization and category are required' });
    }

    // Extract raw text from the uploaded buffer
    const fileText = extractTextFromBuffer(req.file);

    if (!fileText || fileText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract meaningful text from the uploaded file. Please check the file format.',
      });
    }

    // Call AI to extract structured Q&A
    const extractedItems = await extractQuestionsFromText(fileText);

    if (!extractedItems || extractedItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No questions could be identified in the uploaded file.',
        data: { saved: 0, questions: [] },
      });
    }

    // Save all extracted questions to the Question Bank
    const questionsToSave = extractedItems.map((item) => ({
      organization,
      category,
      ...(position ? { position } : {}),
      question: item.question,
      idealAnswer: item.answer || item.idealAnswer || '',
      difficulty: item.difficulty || difficulty,
      tags: item.tags || [],
      source: 'ai_extracted',
      sourceFile: req.file.originalname,
      createdBy: req.user._id,
    }));

    const savedQuestions = await Question.insertMany(questionsToSave);

    res.status(201).json({
      success: true,
      message: `Successfully extracted and saved ${savedQuestions.length} questions from "${req.file.originalname}"`,
      data: { saved: savedQuestions.length, questions: savedQuestions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extract plain text from uploaded file buffer
 * Supports: TXT (direct), PDF and DOCX (basic extraction)
 */
function extractTextFromBuffer(file) {
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf') {
    // Basic PDF text extraction — strips binary and extracts readable ASCII
    const raw = buffer.toString('binary');
    const text = raw
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, '\n')
      .trim();
    return text.length > 100 ? text : null;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    // Basic DOCX text extraction — strips XML and extracts text nodes
    const raw = buffer.toString('utf-8', 0, Math.min(buffer.length, 500000));
    const text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s{3,}/g, '\n')
      .trim();
    return text.length > 100 ? text : null;
  }

  return null;
}

/**
 * @desc    Import questions in bulk via JSON payload
 * @route   POST /admin/questions/import
 * @access  Admin only
 */
export const importQuestionsJson = async (req, res, next) => {
  try {
    const questions = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: Expected an array of questions' });
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload: Array of questions cannot be empty' });
    }

    const orgCache = {};
    const catCache = {};
    const posCache = {};

    const questionsToSave = [];
    const errors = [];

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const index = i + 1;

      if (!q.organization || typeof q.organization !== 'string' || !q.organization.trim()) {
        errors.push(`Row ${index}: "organization" name is required and must be a string.`);
        continue;
      }
      if (!q.category || typeof q.category !== 'string' || !q.category.trim()) {
        errors.push(`Row ${index}: "category" name is required and must be a string.`);
        continue;
      }
      if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        errors.push(`Row ${index}: "question" text is required and must be a string.`);
        continue;
      }

      const orgName = q.organization.trim();
      const catName = q.category.trim();
      const posName = q.position ? q.position.trim() : '';
      const questionText = q.question.trim();
      const idealAnswerText = q.idealAnswer ? q.idealAnswer.trim() : '';

      let difficultyValue = 'medium';
      if (q.difficulty && typeof q.difficulty === 'string') {
        const diffLower = q.difficulty.toLowerCase().trim();
        if (['easy', 'medium', 'hard'].includes(diffLower)) {
          difficultyValue = diffLower;
        }
      }

      let tagsValue = [];
      if (Array.isArray(q.tags)) {
        tagsValue = q.tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(Boolean);
      } else if (q.tags && typeof q.tags === 'string') {
        tagsValue = q.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      try {
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
              description: `Auto-created during JSON import of questions.`,
              logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(orgName)}&background=random`,
            });
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
              description: `Auto-created during JSON import of questions.`,
            });
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
                description: `Auto-created during JSON import of questions.`,
              });
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
          difficulty: difficultyValue,
          tags: tagsValue,
          source: 'manual',
          createdBy: req.user._id,
        });

      } catch (err) {
        errors.push(`Row ${index}: Database resolution failed: ${err.message}`);
      }
    }

    if (errors.length > 0 && questionsToSave.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Import failed due to validation or database errors',
        errors
      });
    }

    let savedQuestions = await Question.insertMany(questionsToSave);
    savedQuestions = await Question.populate(savedQuestions, [
      { path: 'organization', select: 'name' },
      { path: 'category', select: 'name' },
      { path: 'position', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${savedQuestions.length} questions.`,
      data: {
        saved: savedQuestions.length,
        questions: savedQuestions,
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    next(error);
  }
};

