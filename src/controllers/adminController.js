import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Question from '../models/Question.js';
import InterviewSession from '../models/InterviewSession.js';
import MedicalChecklist from '../models/MedicalChecklist.js';
import PhysicalPlan from '../models/PhysicalPlan.js';
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
      totalDepts,
      totalQuestions,
      totalSessions,
      recentUsers,
      recentSessions,
    ] = await Promise.all([
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'candidate', isBlocked: false }),
      User.countDocuments({ role: 'candidate', isBlocked: true }),
      Department.countDocuments(),
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
        .populate('departmentId', 'name'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
        departments: totalDepts,
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

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const sessions = await InterviewSession.find({ user: user._id })
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: { user, sessions } });
  } catch (error) {
    next(error);
  }
};

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
// DEPARTMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.status(200).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    
    // Clean up associated resources
    await Promise.all([
      Question.deleteMany({ departmentId: req.params.id }),
      MedicalChecklist.deleteMany({ departmentId: req.params.id }),
      PhysicalPlan.deleteMany({ departmentId: req.params.id }),
    ]);

    res.status(200).json({ success: true, message: 'Department and associated content deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────

export const getQuestions = async (req, res, next) => {
  const { search = '', departmentId, subCategory, position, difficulty, page = 1, limit = 15 } = req.query;
  try {
    const query = {};
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) query.departmentId = departmentId;
    if (subCategory) query.subCategory = subCategory;
    if (position) query.position = position;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('departmentId', 'name')
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

export const createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id, source: 'manual' });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

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

export const uploadBook = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { departmentId, subCategory = '', position = '', difficulty = 'medium' } = req.body;
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }

    const fileText = extractTextFromBuffer(req.file);
    if (!fileText || fileText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract meaningful text from the uploaded file.',
      });
    }

    const extractedItems = await extractQuestionsFromText(fileText);
    if (!extractedItems || extractedItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No questions could be identified in the uploaded file.',
        data: { saved: 0, questions: [] },
      });
    }

    const questionsToSave = extractedItems.map((item) => ({
      departmentId,
      subCategory: subCategory || '',
      position: position || '',
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

function extractTextFromBuffer(file) {
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf') {
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

// ─────────────────────────────────────────────────────────────
// BULK QUESTIONS IMPORT
// ─────────────────────────────────────────────────────────────

export const importQuestionsJson = async (req, res, next) => {
  try {
    const questions = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: Expected an array of questions' });
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload: Array of questions cannot be empty' });
    }

    const deptCache = {};
    const questionsToSave = [];
    const errors = [];

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const index = i + 1;

      if (!q.departmentName || typeof q.departmentName !== 'string' || !q.departmentName.trim()) {
        errors.push(`Row ${index}: "departmentName" is required and must be a string.`);
        continue;
      }
      if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        errors.push(`Row ${index}: "question" text is required.`);
        continue;
      }

      const deptName = q.departmentName.trim();
      const subCategory = q.subCategory ? q.subCategory.trim() : '';
      const position = q.position ? q.position.trim() : '';
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
        tagsValue = q.tags.map(t => String(t).trim()).filter(Boolean);
      } else if (q.tags && typeof q.tags === 'string') {
        tagsValue = q.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      try {
        let deptId;
        const cacheKey = deptName.toLowerCase();
        if (deptCache[cacheKey]) {
          deptId = deptCache[cacheKey];
        } else {
          let dept = await Department.findOne({ name: { $regex: new RegExp('^' + escapeRegExp(deptName) + '$', 'i') } });
          if (!dept) {
            dept = await Department.create({
              name: deptName,
              description: `Auto-created during JSON import of questions.`,
              logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(deptName)}&background=random`,
            });
          }
          deptId = dept._id;
          deptCache[cacheKey] = deptId;
        }

        questionsToSave.push({
          departmentId: deptId,
          subCategory,
          position,
          question: questionText,
          idealAnswer: idealAnswerText,
          difficulty: difficultyValue,
          tags: tagsValue,
          source: 'manual',
          createdBy: req.user._id,
        });

      } catch (err) {
        errors.push(`Row ${index}: Database error: ${err.message}`);
      }
    }

    if (errors.length > 0 && questionsToSave.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Import failed due to errors',
        errors
      });
    }

    let savedQuestions = await Question.insertMany(questionsToSave);
    savedQuestions = await Question.populate(savedQuestions, [
      { path: 'departmentId', select: 'name' }
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

// ─────────────────────────────────────────────────────────────
// ADMIN MEDICAL & PHYSICAL TEMPLATE MANAGERS
// ─────────────────────────────────────────────────────────────

export const getMedicalTemplate = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;
  try {
    let template = await MedicalChecklist.findOne({ departmentId, subCategory, position });
    if (!template) {
      template = { departmentId, subCategory, position, criteria: [] };
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const saveMedicalTemplate = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '', criteria } = req.body;
  try {
    let template = await MedicalChecklist.findOne({ departmentId, subCategory, position });
    if (template) {
      template.criteria = criteria;
      await template.save();
    } else {
      template = await MedicalChecklist.create({ departmentId, subCategory, position, criteria });
    }
    res.status(200).json({ success: true, message: 'Medical checklist template saved successfully', data: template });
  } catch (error) {
    next(error);
  }
};

export const getPhysicalTemplate = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '' } = req.query;
  try {
    let template = await PhysicalPlan.findOne({ departmentId, subCategory, position });
    if (!template) {
      template = { departmentId, subCategory, position, exercises: [] };
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const savePhysicalTemplate = async (req, res, next) => {
  const { departmentId, subCategory = '', position = '', exercises } = req.body;
  try {
    let template = await PhysicalPlan.findOne({ departmentId, subCategory, position });
    if (template) {
      template.exercises = exercises;
      await template.save();
    } else {
      template = await PhysicalPlan.create({ departmentId, subCategory, position, exercises });
    }
    res.status(200).json({ success: true, message: 'Physical plan template saved successfully', data: template });
  } catch (error) {
    next(error);
  }
};
