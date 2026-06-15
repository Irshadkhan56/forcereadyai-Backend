import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Position from '../models/Position.js';
import PhysicalPlan from '../models/PhysicalPlan.js';
import MedicalChecklist from '../models/MedicalChecklist.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log(`[Seeding Plans] Connecting to database...`);
    await mongoose.connect(mongoUri);
    console.log(`[Seeding Plans] Connected to database.`);

    // Clear existing templates
    await PhysicalPlan.deleteMany({});
    await MedicalChecklist.deleteMany({});
    console.log(`[Seeding Plans] Existing physical plans and medical checklists cleared.`);

    // Fetch positions to map to
    const positions = await Position.find({});
    console.log(`[Seeding Plans] Found ${positions.length} positions in database.`);

    const posMap = {};
    positions.forEach((pos) => {
      posMap[pos.name] = pos._id;
    });

    const plans = [];
    const checklists = [];

    // 1. PMA Long Course
    if (posMap['PMA Long Course']) {
      plans.push({
        position: posMap['PMA Long Course'],
        exercises: [
          { name: '1.6 KM Run', target: '1.6 KM in 8 minutes', description: 'Run on a flat track within the 8-minute limit' },
          { name: 'Push-ups', target: '15 repetitions in 2 minutes', description: 'Standard form military push-ups' },
          { name: 'Sit-ups', target: '20 repetitions in 2 minutes', description: 'Bent-knee sit-ups' },
          { name: 'Chin-ups', target: '3 repetitions in 2 minutes', description: 'Pulling up to clear chin over bar' },
          { name: 'Ditch Crossing', target: 'Cross a ditch of 7\'4" x 7\'4"', description: 'Ditch jumping ability test' },
        ],
      });

      checklists.push({
        position: posMap['PMA Long Course'],
        criteria: [
          { name: 'Minimum Height', requirement: '5\'4" (162.5 cm)', description: 'Barefoot height check' },
          { name: 'Weight', requirement: 'As per Body Mass Index (BMI) Chart', description: 'Proportionate height-to-weight index' },
          { name: 'Visual Acuity', requirement: '6/6 with or without glasses', description: 'Distance vision checked using Snellen Chart' },
          { name: 'Physical Deformities', requirement: 'No Flat Feet, Knock Knees, or Chest Deformity', description: 'Detailed bone and structural exam' },
          { name: 'Blood Pressure', requirement: 'Normal limits (systolic 100-140, diastolic 60-90)', description: 'Blood pressure test' },
        ],
      });
    }

    // 2. GD Pilot
    if (posMap['GD Pilot']) {
      plans.push({
        position: posMap['GD Pilot'],
        exercises: [
          { name: '1.6 KM Run', target: '1.6 KM in 7 minutes 30 seconds', description: 'Running stamina test' },
          { name: 'Push-ups', target: '20 repetitions in 2 minutes', description: 'Chest and tricep strength check' },
          { name: 'Sit-ups', target: '20 repetitions in 2 minutes', description: 'Abdominal strength check' },
          { name: 'Chin-ups', target: '5 repetitions in 2 minutes', description: 'Upper body pulling strength' },
        ],
      });

      checklists.push({
        position: posMap['GD Pilot'],
        criteria: [
          { name: 'Minimum Height', requirement: '5\'4" (162.5 cm)', description: 'Height standard for pilots' },
          { name: 'Eyesight', requirement: '6/6 without glasses (Strict)', description: 'Uncorrected distance vision must be perfect' },
          { name: 'Color Vision', requirement: 'Normal Color Vision (Ishihara Test)', description: 'Strict test for pilot cockpit indicators' },
          { name: 'Hearing', requirement: 'Force Whisper at 20 feet (Normal)', description: 'Audiometric hearing standards' },
          { name: 'Surgical/Bone issues', requirement: 'No history of major fractures or metal implants', description: 'Strict bone density and structure test' },
        ],
      });
    }

    // 3. Police Constable
    if (posMap['Police Constable']) {
      plans.push({
        position: posMap['Police Constable'],
        exercises: [
          { name: '1.6 KM Run', target: '1.6 KM in 7 minutes', description: 'Cardiovascular run' },
          { name: 'Push-ups', target: '15 repetitions in 2 minutes', description: 'Standard push-ups' },
          { name: 'Sit-ups', target: '15 repetitions in 2 minutes', description: 'Abdominal sit-ups' },
        ],
      });

      checklists.push({
        position: posMap['Police Constable'],
        criteria: [
          { name: 'Minimum Height', requirement: '5\'7" (170 cm)', description: 'Height requirement for male candidates' },
          { name: 'Chest Measurement', requirement: '33" expanded to 34.5" (min)', description: 'Chest expansion test' },
          { name: 'Vision', requirement: '6/6 with or without glasses', description: 'Standard visual test' },
          { name: 'Joint Health', requirement: 'No flat feet or knock knees', description: 'Checked for mobility issues' },
        ],
      });
    }

    // 4. FIA Inspector
    if (posMap['FIA Inspector']) {
      plans.push({
        position: posMap['FIA Inspector'],
        exercises: [
          { name: '1.6 KM Run', target: '1.6 KM in 7 minutes', description: 'Physical fitness run' },
        ],
      });

      checklists.push({
        position: posMap['FIA Inspector'],
        criteria: [
          { name: 'Minimum Height', requirement: '5\'6" (168 cm)', description: 'Height standard' },
          { name: 'Chest Measurement', requirement: '32" expanded to 33.5" (min)', description: 'Chest expansion check' },
          { name: 'Vision', requirement: '6/6 with or without glasses', description: 'Standard eyesight' },
        ],
      });
    }

    // 5. ASF Corporal
    if (posMap['ASF Corporal']) {
      plans.push({
        position: posMap['ASF Corporal'],
        exercises: [
          { name: '1.6 KM Run', target: '1.6 KM in 7 minutes', description: 'Run test' },
          { name: 'Push-ups', target: '15 repetitions in 2 minutes', description: 'Upper body' },
          { name: 'Sit-ups', target: '15 repetitions in 2 minutes', description: 'Abdominals' },
        ],
      });

      checklists.push({
        position: posMap['ASF Corporal'],
        criteria: [
          { name: 'Minimum Height', requirement: '5\'6" (168 cm)', description: 'Height standard' },
          { name: 'Chest Measurement', requirement: '32.5" expanded to 34" (min)', description: 'Chest expansion check' },
          { name: 'Vision', requirement: '6/6 with or without glasses', description: 'Distance vision test' },
        ],
      });
    }

    // Insert to DB
    const seededPlans = await PhysicalPlan.insertMany(plans);
    console.log(`[Seeding Plans] Seeded ${seededPlans.length} physical plans.`);

    const seededChecklists = await MedicalChecklist.insertMany(checklists);
    console.log(`[Seeding Plans] Seeded ${seededChecklists.length} medical checklists.`);

    // Close Connection
    await mongoose.connection.close();
    console.log(`[Seeding Plans] Connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seeding Plans Error] Seeding process failed:`, error.message);
    process.exit(1);
  }
};

seedDB();
