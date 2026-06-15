import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/gemini.js';
import logger from '../utils/logger.js';

// Lazy initialization helper for SDK
let genAI = null;

const isApiKeyConfigured = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey && apiKey !== 'your_gemini_api_key_here';
};

const getGenAI = () => {
  if (!isApiKeyConfigured()) {
    logger.error('Gemini API key is not configured in environment variables');
    throw new Error('Gemini API Key is missing or unconfigured. Please check your .env file.');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// --- MOCK FALLBACK DATA GENERATORS ---

const getMockProfile = (organizationName, categoryName, positionName) => {
  const org = organizationName || 'Force';
  const pos = positionName || 'Officer';
  const cat = categoryName || 'Cadet';

  // Templates that can be dynamically populated
  const introTemplates = [
    `Tell us about yourself and why you want to join ${org} as a ${pos}.`,
    `Describe your educational background and how it qualifies you for a role in ${org}.`,
    `What are your three greatest personal strengths, and how will they benefit your ${pos} duties?`,
    "How would your close friends or colleagues describe your character in three words?",
    "What is the most significant achievement in your life so far, and what did it teach you?",
    "How do you prepare yourself mentally before entering a highly professional environment?",
    `Explain how your current lifestyle fits the discipline required for a ${pos}.`,
    "What hobbies or extracurricular activities have contributed most to your personal growth?"
  ];

  const motivationTemplates = [
    `Why did you choose ${org} over other career paths or corporate opportunities?`,
    `What does serving as a ${pos} mean to you personally?`,
    `Describe when you first realized you wanted to join the ${cat} ranks.`,
    `What aspect of the ${pos} duties do you find most challenging, and why does it motivate you?`,
    `How does your family feel about your decision to pursue a career in ${org}?`,
    `Where do you see yourself in ten years within the hierarchy of ${org}?`,
    `What do you think is the most noble value a ${pos} must uphold?`,
    `What will you do if you are not selected for the ${pos} entry course this time?`
  ];

  const leadershipTemplates = [
    `What is your definition of leadership, and how does it apply to a ${pos}?`,
    "Describe a time you had to take charge of a group under difficult circumstances. What was the outcome?",
    "How do you handle a team member who refuses to follow instructions or respect authority?",
    "Is it more important for a leader to be liked or respected? Explain your perspective.",
    "Describe a situation where you had to compromise your personal preferences for the success of a group.",
    "How do you motivate others when team morale is low during stressful assignments?",
    "How do you delegate tasks when working under strict and unforgiving deadlines?",
    "Tell us about a leader you look up to, and what qualities you strive to emulate from them."
  ];

  const situationalTemplates = [
    `You witness a peer violating security protocols in ${org}. What immediate actions do you take?`,
    "If you are assigned to a remote station with minimal contact and resources, how will you adapt?",
    "Imagine you are in charge of a checkpoint and a VIP demands passage without standard verification. How do you respond?",
    "You are given an order that you believe is operationally flawed but not illegal. Do you execute it?",
    "A citizen approaches you with a complaint about officer conduct. Describe your response procedure.",
    "Your unit is split on a critical decision during field exercise. How do you resolve the disagreement?",
    "You discover a technical discrepancy in the report of a senior officer. How do you handle it?",
    "What would you do if you suspect a colleague is suffering from severe mental fatigue or depression?",
    "A sensitive document goes missing from your department. Describe your immediate reaction.",
    `How do you handle a situation where a close relative requests a favor that violates ${org} guidelines?`
  ];

  const pressureTemplates = [
    "How do you maintain absolute focus and emotional control during high-intensity crises?",
    "Describe a time when you failed to meet an expectation. How did you handle the pressure and recover?",
    "You have been working continuous shifts with very little sleep and face a critical task. How do you ensure accuracy?",
    `How do you deal with public criticism or hostility while performing your duties as a ${pos}?`,
    "Describe a high-stress decision you had to make in less than thirty seconds.",
    "What is your strategy for coping with the isolation and physical strain of rigorous training?",
    "How do you manage stress in your personal life so it does not affect your professional capacity?",
    "Explain how you handle physical discomfort (extreme heat, cold, fatigue) during operational exercises."
  ];

  const intelTemplates = [
    "What is the significance of information security and cyber awareness in modern policing/defense?",
    "How do you distinguish between reliable intelligence and rumors/disinformation in the field?",
    `Why is situational awareness critical for a ${pos} during tactical operations?`,
    "Describe how you keep yourself updated on national security issues and regional geopolitics.",
    `What role does technology play in improving efficiency and response times in ${org}?`,
    "How would you address a suspected leak of sensitive data within your communication channels?",
    "Explain the importance of intelligence-led operations versus traditional reactive methods.",
    "What threats do you perceive as the most significant to public order and security in your region today?"
  ];

  // Distribute 20 questions across categories
  const questions = [];
  
  // Helper to add questions from templates with cyclic indexing
  const addQuestions = (templates, category, countRequired) => {
    for (let i = 0; i < countRequired; i++) {
      const template = templates[i % templates.length];
      const diff = i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard";
      // To keep them unique, suffix slightly if they cycle
      const questionText = i >= templates.length
        ? `${template} (Follow-up scenario ${Math.floor(i / templates.length)})`
        : template;
      questions.push({
        question: questionText,
        category: category,
        difficulty: diff
      });
    }
  };

  addQuestions(introTemplates, "Introduction", 3);
  addQuestions(motivationTemplates, "Motivation", 3);
  addQuestions(leadershipTemplates, "Leadership", 3);
  addQuestions(situationalTemplates, "Situational", 5);
  addQuestions(pressureTemplates, "Pressure Handling", 3);
  addQuestions(intelTemplates, "Intelligence Awareness", 3);

  // Return generated 20 items
  const physicalPlan = {
    exercises: [
      { name: "Running / Stamina Test", target: "1.6 km run in 7:30 minutes" },
      { name: "Push-ups", target: "22 repetitions in 2 minutes" },
      { name: "Sit-ups", target: "30 repetitions in 2 minutes" },
      { name: "Pull-ups / Chin-ups", target: "3 repetitions in 2 minutes" },
      { name: "Plank Hold", target: "2 minutes flat hold" }
    ]
  };

  const medicalChecklist = {
    criteria: [
      { name: "Visual Acuity", requirement: "6/6 distance vision in both eyes (with or without corrective glasses)" },
      { name: "Height Requirement", requirement: "Minimum 5 feet 4 inches (162.5 cm) for general criteria" },
      { name: "Weight & Body Mass Index", requirement: "Weight standard as per height/age Body Mass Index (BMI) scale" },
      { name: "Chest Expansion", requirement: "33 inches chest size with minimum 1.5 inches expansion (male candidates)" },
      { name: "Dental Points", requirement: "Minimum 14 dental points, clean healthy teeth and gums" },
      { name: "General Physical Deformities", requirement: "No history of bone fractures, chronic back pain, flat foot, or joint pain" }
    ]
  };

  return {
    questions,
    physicalPlan,
    medicalChecklist
  };
};

export const getMockQuestions = (organizationName, categoryName, positionName, count = 20) => {
  const profile = getMockProfile(organizationName, categoryName, positionName);
  return profile.questions.slice(0, count);
};

const getMockEvaluation = (question, answer) => {
  const ansLength = (answer || '').trim().length;
  let score = 75;
  let strengths = "The response is relevant and directly addresses the core question. Demonstrates appropriate vocabulary for the position.";
  let weaknesses = "Could expand more on specific practical steps and operational regulations.";
  let suggestions = "Structure your answer using a problem-action-outcome approach. Highlight direct examples of your past experience or relevant training.";

  if (ansLength < 15) {
    score = 45;
    strengths = "Initial attempt to address the prompt.";
    weaknesses = "The answer is extremely short, generic, and lacks professional depth or detailed reasoning.";
    suggestions = "Elaborate further by detailing the exact steps you would take, the reasoning behind them, and how it aligns with organization values.";
  } else if (ansLength > 150) {
    score = 88;
    strengths = "Highly detailed answer. Good structural coherence and solid understanding of the organization's requirements.";
    weaknesses = "Slightly verbose. Ensure key points are highlighted first to maintain absolute clarity under pressure.";
    suggestions = "Refine the response to be slightly more concise. Focus on presenting the actionable steps clearly.";
  }

  return {
    score,
    strengths,
    weaknesses,
    suggestions
  };
};

/**
 * Reusable helper to generate standard text responses
 */
export const generateText = async (prompt, modelName = GEMINI_CONFIG.defaultModel) => {
  if (!isApiKeyConfigured()) {
    logger.warn('Gemini API key is not configured. Returning simulated mock response.');
    return "Simulated text response because Gemini API Key is not configured.";
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ 
      model: modelName,
      generationConfig: GEMINI_CONFIG.generationConfig
    });

    logger.info(`Sending prompt to Gemini model ${modelName}...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Error during Gemini text generation', error);
    throw new Error(`AI Generation Failed: ${error.message}`);
  }
};

/**
 * Evaluates candidate answer against a stored ideal answer
 * Returns matchPercentage, score (out of 10), strengths (array), weaknesses (array), suggestions (array)
 */
export const evaluateCandidateAnswerAgainstIdeal = async (question, candidateAnswer, idealAnswer) => {
  if (!isApiKeyConfigured()) {
    logger.warn('Gemini API key is not configured. Falling back to simulated mock evaluation.');
    const answerLen = (candidateAnswer || '').trim().length;
    let score = 30;
    if (answerLen < 30) {
      score = 10;
    } else if (answerLen < 80) {
      score = 25;
    }
    const level = score < 15 ? 'poor' : score <= 30 ? 'average' : 'good';
    const feedback = score < 15
      ? '1. Response is too short and completely lacks depth.\n2. Failed to mention any key operational concepts.\n3. Contains multiple grammatical errors.'
      : '1. Misses critical factual elements from the expected ideal answer.\n2. Generalization used instead of specific operating procedures.\n3. Grammatical structure needs significant improvement.';
    return {
      matchPercentage: score,
      score: Math.round(score / 10),
      strengths: [`Level: ${level.toUpperCase()}`],
      weaknesses: [feedback],
      suggestions: [
        'Ensure your response is factually correct, logically sound, and complete.',
        'Avoid grammatical mistakes.',
        'Align response with standard force protocols.'
      ]
    };
  }

  const prompt = `
You are an exceptionally harsh, critical, and strict military/police recruitment board examiner. You are NOT a motivator or a coach. Your sole goal is to filter out weak candidates and assign realistic, uninflated scores.

Your task is to evaluate the Candidate's Answer against the Expected Ideal Reference Answer based ONLY on factual relevance, correctness, completeness, and grammatical accuracy.

CRITICAL GRADING RULES (APPLY HARSHLY):
1. **No Politeness or Encouragement**: Do NOT use encouraging phrases like "Good try", "Great effort", "However", "encouragingly", or polite transitions. Keep the feedback sharp, direct, and critical.
2. **Concept Matching**: Compare the Candidate's Answer directly with the Expected Ideal Reference Answer. If key factual elements, steps, or terminology from the Expected Answer are missing, deduct 30% for EACH missing key concept. Do NOT assume the candidate knows what they did not write down.
3. **Length and Depth Penalty**: If the answer is extremely brief, generic, or uses high-level filler words (e.g. "I want to serve", "I will do my best", "it is my dream") without concrete details, cap the maximum score at 15%.
4. **Grammar and Professionalism Penalty**: Check for spelling errors, punctuation mistakes, run-on sentences, or poor grammar. If even a single grammatical or spelling mistake is found, deduct 20% immediately.
5. **Irrelevance Penalty**: If the candidate's answer is off-topic, evasive, or does not directly answer the specific question, the score MUST be below 10%.
6. **Strict Score Caps**:
   - **Never give above 30%** if the answer is only partially correct, vague, or too short. Score must be between 10%–30% based on accuracy.
   - Cap at **50%** if the answer is mostly accurate but misses a minor detail or has minor grammatical issues.
   - A score of **80% or above** is reserved ONLY for a flawless, comprehensive, grammatically perfect response that matches all concepts of the ideal answer perfectly.

EVALUATION MATERIAL:
- Expected Ideal Reference Answer (Expected Knowledge): "${idealAnswer}"
- Question Asked: "${question}"
- Candidate's Answer: "${candidateAnswer}"

OUTPUT FORMAT (STRICT JSON ONLY, DO NOT ADD ANY MARKDOWN OR WRAPPERS):
{
  "score": number (0–100 representing the final strict percentage),
  "level": "poor | average | good | excellent",
  "feedback": "2-3 short strict points of critique justifying the deductions. List exactly what was missing, incorrect, or grammatically wrong."
}
`;

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: GEMINI_CONFIG.defaultModel,
      generationConfig: GEMINI_CONFIG.jsonGenerationConfig
    });

    logger.info(`Evaluating candidate answer against ideal answer using strict examiner Gemini prompt...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
      const parsed = JSON.parse(text);
      const score = typeof parsed.score === 'number' ? parsed.score : 0;
      const level = parsed.level || 'poor';
      const feedback = parsed.feedback || 'No justification provided.';

      return {
        matchPercentage: score,
        score: Math.max(1, Math.round(score / 10)),
        strengths: [`Level: ${level.toUpperCase()}`],
        weaknesses: [feedback],
        suggestions: [
          'Ensure your response is factually correct, logically sound, and complete.',
          'Avoid grammatical mistakes.',
          'Align response with standard force protocols.'
        ]
      };
    } catch (parseError) {
      logger.error('Failed to parse Gemini comparison response as JSON. Raw response:', text);
      throw new Error('AI returned an invalid JSON response structure for candidate comparison.');
    }
  } catch (error) {
    logger.error('Error during candidate ideal comparison evaluation', error);
    throw new Error(`AI Evaluation Failed: ${error.message}`);
  }
};

/**
 * Backward compatibility wrapper — evaluates candidate response
 */
export const evaluateInterviewResponse = async (question, answer, organizationName, positionName) => {
  const dummyIdealAnswer = "Demonstrate deep understanding of organization protocols and standard operating procedures.";
  const res = await evaluateCandidateAnswerAgainstIdeal(question, answer, dummyIdealAnswer);
  return {
    score: res.matchPercentage, // old system expects score out of 100
    strengths: res.strengths.join(' '),
    weaknesses: res.weaknesses.join(' '),
    suggestions: res.suggestions.join(' ')
  };
};

/**
 * Generates a full career preparation profile for custom positions
 * @param {string} organizationName 
 * @param {string} categoryName 
 * @param {string} positionName 
 * @returns {Promise<Object>}
 */
export const generateFullPreparationProfile = async (organizationName, categoryName, positionName) => {
  if (!isApiKeyConfigured()) {
    logger.warn('Gemini API key is not configured. Falling back to simulated full career profile.');
    return getMockProfile(organizationName, categoryName, positionName);
  }

  const prompt = `
    You are a senior recruitment examiner and tactical preparation specialist for military, security, and law enforcement agencies.
    Simulate a full career preparation training profile for the following role:
    Organization: "${organizationName}"
    Category: "${categoryName}"
    Position: "${positionName}"

    Generate:
    1. Exactly 20 mock interview questions. The questions must range in difficulty ("Easy", "Medium", "Hard") and be distributed across these categories:
       - "Introduction"
       - "Motivation"
       - "Leadership"
       - "Situational"
       - "Pressure Handling"
       - "Intelligence Awareness"
    2. A physical preparation plan with 4-6 specific exercises tailored to the role's fitness requirements (e.g. running, pushups, sit-ups, pull-ups, weight training), specifying standard targets.
    3. A medical checklist with 4-6 crucial clinical criteria (e.g. vision, dental, height, chest, medical history) needed for this specific role.

    Provide the response as a valid JSON object matching this exact structure:
    {
      "questions": [
        {
          "question": "Question text?",
          "category": "Introduction/Motivation/Leadership/Situational/Pressure Handling/Intelligence Awareness",
          "difficulty": "Easy/Medium/Hard"
        }
      ],
      "physicalPlan": {
        "exercises": [
          {
            "name": "Exercise Name",
            "target": "Target representation (e.g., '1.6 km in 7:30 minutes' or '30 reps in 1 minute')"
          }
        ]
      },
      "medicalChecklist": {
        "criteria": [
          {
            "name": "Criteria Name",
            "requirement": "Requirement representation (e.g., '6/6 visual acuity' or 'Min height 5ft 6in')"
          }
        ]
      }
    }

    Do not wrap the response in any markdown code blocks. Output raw JSON only.
  `;

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: GEMINI_CONFIG.defaultModel,
      generationConfig: GEMINI_CONFIG.jsonGenerationConfig
    });

    logger.info(`Generating full AI preparation profile for custom position: ${positionName} via Gemini...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
      return JSON.parse(text);
    } catch (parseError) {
      logger.error('Failed to parse Gemini full profile JSON response:', text);
      throw new Error('AI returned an invalid JSON response structure for custom profile.');
    }
  } catch (error) {
    logger.error('Error during full career profile generation', error);
    throw new Error(`AI Profile Generation Failed: ${error.message}`);
  }
};

/**
 * Extract structured interview questions from uploaded book/document text.
 * Falls back to mock questions if Gemini API key is not configured.
 *
 * @param {string} text - Plain text content extracted from the uploaded file
 * @returns {Promise<Array<{question, answer, difficulty, tags}>>}
 */
export const extractQuestionsFromText = async (text) => {
  // Mock fallback — used when API key is not configured
  if (!isApiKeyConfigured()) {
    logger.warn('Gemini API key not configured. Returning mock extracted questions.');
    return [
      { question: 'What motivates you to join this organization?', answer: 'A genuine desire to serve and contribute to national security.', difficulty: 'easy', tags: ['motivation', 'personal'] },
      { question: 'How do you handle pressure and high-stress situations?', answer: 'Through systematic planning, controlled breathing, and focusing on the immediate task.', difficulty: 'medium', tags: ['stress', 'performance'] },
      { question: 'Describe a situation where you demonstrated leadership.', answer: 'During a team project, I took initiative when the leader was absent and coordinated the group to meet the deadline.', difficulty: 'medium', tags: ['leadership', 'teamwork'] },
      { question: 'What is your understanding of the organization\'s primary mission?', answer: 'To protect national interests, maintain security, and uphold constitutional values.', difficulty: 'easy', tags: ['knowledge', 'mission'] },
      { question: 'How would you respond if you disagreed with a superior\'s order?', answer: 'I would follow the lawful order while professionally raising my concern through proper channels later.', difficulty: 'hard', tags: ['discipline', 'communication'] },
    ];
  }

  const prompt = `
    You are an expert interview preparation analyst.
    
    The following text is extracted from an interview preparation book or training material.
    Your task is to identify and extract all interview questions and their answers from this text.
    
    Instructions:
    - Extract as many question-answer pairs as you can find
    - If an answer is not explicitly given, provide a suggested model answer
    - Classify each question as: easy, medium, or hard
    - Add 2-4 relevant tags per question (e.g. leadership, motivation, technical, discipline)
    - Return ONLY a JSON array with no extra text or markdown
    
    Output format:
    [
      {
        "question": "...",
        "answer": "...",
        "difficulty": "easy|medium|hard",
        "tags": ["tag1", "tag2"]
      }
    ]
    
    TEXT TO ANALYSE:
    ${text.substring(0, 15000)}
  `;

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: GEMINI_CONFIG.defaultModel,
      generationConfig: GEMINI_CONFIG.jsonGenerationConfig,
    });

    logger.info('Extracting questions from uploaded book text via Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text().trim();

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Expected an array from AI extraction');
    return parsed;
  } catch (error) {
    logger.error('Question extraction from book failed, falling back to mock:', error.message);
    // Return empty array so the caller can handle gracefully
    return [];
  }
};
