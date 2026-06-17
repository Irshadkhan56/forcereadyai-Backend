import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../models/Department.js';
import Question from '../models/Question.js';
import MedicalChecklist from '../models/MedicalChecklist.js';
import PhysicalPlan from '../models/PhysicalPlan.js';
import UserMedicalProgress from '../models/UserMedicalProgress.js';
import UserPhysicalProgress from '../models/UserPhysicalProgress.js';
import InterviewSession from '../models/InterviewSession.js';
import Progress from '../models/Progress.js';

dotenv.config();

const departments = [
  {
    name: 'Pakistan Army',
    description: 'The land warfare branch of the Pakistan Armed Forces, defending land borders and maintaining national security.',
    logo: '/assets/logos/pakistan-army.png',
    banner: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: true,
  },
  {
    name: 'Pakistan Navy',
    description: 'The naval warfare branch of the Pakistan Armed Forces, protecting maritime interests and sea borders.',
    logo: '/assets/logos/pakistan-navy.png',
    banner: 'https://images.unsplash.com/photo-1507682531662-421b17ac4f93?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'Pakistan Air Force',
    description: 'The aerial warfare branch of the Pakistan Armed Forces, tasked with providing air defense of Pakistan.',
    logo: '/assets/logos/pakistan-airforce.png',
    banner: 'https://images.unsplash.com/photo-1519074069444-1ba4e66640c2?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'Police',
    description: 'Provincial and federal police forces responsible for law enforcement and public security.',
    logo: '/assets/logos/pakistan-police.png',
    banner: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'FIA',
    description: 'Federal Investigation Agency - Tasked with border control, cybercrime, and white-collar crime investigations.',
    logo: '/assets/logos/fia.png',
    banner: 'https://images.unsplash.com/photo-1453728213013-685d42c1a417?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'Rangers',
    description: 'Paramilitary federal law enforcement corps responsible for border security and counter-terrorism.',
    logo: '/assets/logos/rangers.png',
    banner: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'ANF',
    description: 'Anti Narcotics Force - A federal force tasked with combating drug smuggling and narcotics trafficking.',
    logo: '/assets/logos/anf.png',
    banner: 'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'FC',
    description: 'Frontier Corps - Paramilitary force stationed in Balochistan and KP for border security and order maintenance.',
    logo: '/assets/logos/fc.png',
    banner: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'ASF',
    description: 'Airport Security Force - Responsible for airport and aviation security across Pakistan.',
    logo: '/assets/logos/asf.png',
    banner: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
  {
    name: 'Motorway Police',
    description: 'National Highways & Motorway Police - Responsible for safety, security, and traffic control on major routes.',
    logo: '/assets/logos/motorway-police.png',
    banner: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=1200',
    hasSubCategories: false,
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log(`[Seeding] Connecting to database...`);
    await mongoose.connect(mongoUri);
    console.log(`[Seeding] Connected. Dropping database to clear old indexes...`);

    // Drop entire database to get rid of legacy unique indexes
    await mongoose.connection.db.dropDatabase();
    console.log(`[Seeding] Database dropped.`);

    // 1. Seed Departments
    const createdDepts = await Department.insertMany(departments);
    console.log(`[Seeding] ${createdDepts.length} departments seeded.`);

    const deptMap = {};
    createdDepts.forEach((dept) => {
      deptMap[dept.name] = dept._id;
    });

    const plans = [];
    const checklists = [];
    const questions = [];

    // Define standard physical exercise configurations
    const standardPhysicalExercises = [
      { name: '1.6 KM Run', target: '1.6 KM in 7 minutes 30 seconds', description: 'Stamina cardio test' },
      { name: 'Push-ups', target: '15 reps in 2 minutes', description: 'Chest and upper body strength' },
      { name: 'Sit-ups', target: '20 reps in 2 minutes', description: 'Abdominal core test' },
    ];

    // Define standard medical criteria configurations
    const standardMedicalCriteria = [
      { name: 'Height Check', requirement: 'Minimum 5\'4" (162.5 cm)', description: 'Checked barefoot' },
      { name: 'Visual Acuity', requirement: '6/6 with or without glasses', description: 'Snellen visual chart test' },
      { name: 'Structural Integrity', requirement: 'No Flat Feet, Knock Knees, or Joint Deformities', description: 'Posture and skeletal check' },
    ];

    // 2. Loop and generate templates/questions for each Department
    for (const dept of createdDepts) {
      if (dept.name === 'Pakistan Army') {
        // Special case: Army has subcategories (Officer / Soldier)
        
        // --- Officer (PMA Long Course) ---
        plans.push({
          departmentId: dept._id,
          subCategory: 'Officer',
          position: 'PMA Long Course',
          exercises: [
            ...standardPhysicalExercises,
            { name: 'Chin-ups', target: '3 repetitions in 2 minutes', description: 'Pulling up to clear chin over bar' },
            { name: 'Ditch Crossing', target: 'Jump over a 7\'4" x 7\'4" ditch', description: 'Ditch jump test' },
          ],
        });

        checklists.push({
          departmentId: dept._id,
          subCategory: 'Officer',
          position: 'PMA Long Course',
          criteria: [
            ...standardMedicalCriteria,
            { name: 'Chest Size', requirement: '33 inches with 1.5 inch expansion', description: 'Standard chest measurement' },
          ],
        });

        questions.push(
          {
            departmentId: dept._id,
            subCategory: 'Officer',
            position: 'PMA Long Course',
            question: 'What is the primary motivation for you to choose the PMA Long Course over a civilian corporate career?',
            idealAnswer: 'Serving in the army is a calling of honor and duty to defend the nation. It provides disciplined leadership development and a chance to protect the sovereignty of Pakistan directly, which a corporate career cannot offer.',
            difficulty: 'medium',
            tags: ['motivation', 'pma', 'service'],
          },
          {
            departmentId: dept._id,
            subCategory: 'Officer',
            position: 'PMA Long Course',
            question: 'How do you define the role and responsibilities of a Commissioned Officer in the field?',
            idealAnswer: 'A Commissioned Officer is responsible for tactical leadership, the operational efficiency, discipline, welfare, and morale of their troops. They must lead by personal example, make decisions under extreme combat stress, and achieve strategic objectives.',
            difficulty: 'hard',
            tags: ['leadership', 'discipline', 'role'],
          }
        );

        // --- Soldier (General Duty Soldier) ---
        plans.push({
          departmentId: dept._id,
          subCategory: 'Soldier',
          position: 'General Duty Soldier',
          exercises: standardPhysicalExercises,
        });

        checklists.push({
          departmentId: dept._id,
          subCategory: 'Soldier',
          position: 'General Duty Soldier',
          criteria: standardMedicalCriteria,
        });

        questions.push(
          {
            departmentId: dept._id,
            subCategory: 'Soldier',
            position: 'General Duty Soldier',
            question: 'Why do you want to enlist as a General Duty Soldier in the Pakistan Army?',
            idealAnswer: 'To serve at the frontlines of national defense, uphold military discipline, protect the nation from external threats, and build a career rooted in loyalty and physical excellence.',
            difficulty: 'easy',
            tags: ['motivation', 'enlisted', 'loyalty'],
          }
        );

      } else {
        // Standard flow: All other departments have direct content
        plans.push({
          departmentId: dept._id,
          subCategory: '',
          position: '',
          exercises: dept.name === 'Pakistan Air Force' ? [
            ...standardPhysicalExercises,
            { name: 'Chin-ups', target: '5 reps in 2 minutes', description: 'Pull-up bar test' }
          ] : standardPhysicalExercises,
        });

        checklists.push({
          departmentId: dept._id,
          subCategory: '',
          position: '',
          criteria: dept.name === 'Pakistan Air Force' ? [
            ...standardMedicalCriteria,
            { name: 'Color Vision', requirement: 'Normal Color Vision (Ishihara Test)', description: 'Required for flight cockpit operations' },
          ] : standardMedicalCriteria,
        });

        // Add standard questions for each department
        questions.push(
          {
            departmentId: dept._id,
            subCategory: '',
            position: '',
            question: `What makes you the ideal candidate to join the ${dept.name}?`,
            idealAnswer: `My discipline, integrity, dedication to public service, and alignment with the primary security objectives of the ${dept.name} make me an ideal fit.`,
            difficulty: 'easy',
            tags: ['motivation', 'suitability'],
          },
          {
            departmentId: dept._id,
            subCategory: '',
            position: '',
            question: `How would you handle a high-stress security incident or emergency while on duty?`,
            idealAnswer: `I would remain calm, assess the situation, secure the immediate area, follow the standard operational guidelines of the ${dept.name}, and notify my dispatch or command team instantly.`,
            difficulty: 'medium',
            tags: ['stress', 'situational'],
          }
        );
      }
    }

    // Insert checklists, plans, and questions
    await Promise.all([
      MedicalChecklist.insertMany(checklists),
      PhysicalPlan.insertMany(plans),
      Question.insertMany(questions),
    ]);

    console.log(`[Seeding] Successfully seeded templates and questions.`);
    await mongoose.connection.close();
    console.log(`[Seeding] Done. Connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seeding Error] Failed:`, error.message);
    process.exit(1);
  }
};

seedDB();
