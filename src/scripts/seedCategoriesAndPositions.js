/**
 * Master Seed Script — Complete Org → Category → Position Hierarchy
 *
 * Clears ALL existing organizations, categories, and positions
 * then re-seeds from scratch using the canonical hierarchy below.
 *
 * Run: npm run seed:all
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization.js';
import Category from '../models/Category.js';
import Position from '../models/Position.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL HIERARCHY
// Structure:
//   orgName  ──►  categories[]
//                   name, description
//                   positions[]  ──►  name, description
// ─────────────────────────────────────────────────────────────────────────────

const HIERARCHY = [

  // ═══════════════════════════════════════════════════════
  //  1. PAKISTAN ARMY
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Pakistan Army',
      description: 'The land warfare branch of the Pakistan Armed Forces, responsible for defending land borders and maintaining national security.',
      logo: '/assets/logos/pakistan-army.png',
    },
    categories: [
      {
        name: 'Officer',
        description: 'Commissioned officers leading troops in combat, logistics, and administrative roles.',
        positions: [
          { name: 'PMA Long Course',                description: 'Primary commissioning route through Pakistan Military Academy, Kakul.' },
          { name: 'Lady Cadet Course (LCC)',         description: 'Commissioning programme for female officers into Army corps.' },
          { name: 'Technical Cadet Course (TCC)',    description: 'Engineering and technical branch officer entry via PMA.' },
          { name: 'Short Service Commission (SSC)',  description: 'Time-limited commission for officers in specialist roles.' },
          { name: 'Direct Short Service Commission (DSSC)', description: 'Direct entry short service commission for professionals.' },
        ],
      },
      {
        name: 'Soldier',
        description: 'Enlisted infantry and fighting arm personnel of the Pakistan Army.',
        positions: [
          { name: 'General Duty Soldier', description: 'Frontline infantry soldier in combat arms.' },
          { name: 'Clerk',               description: 'Administrative soldier handling records and correspondence.' },
          { name: 'Driver',              description: 'Military transport driver operating army vehicles.' },
          { name: 'Military Police',     description: 'Law enforcement and discipline within the army.' },
          { name: 'Nursing Assistant',   description: 'Medical support soldier assisting in field hospitals.' },
          { name: 'Cook',               description: 'Ration preparation and field kitchen management.' },
          { name: 'Technical Trade',     description: 'Technically-skilled soldiers in engineering and signals.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  2. PAKISTAN NAVY
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Pakistan Navy',
      description: 'The naval warfare branch of the Pakistan Armed Forces, responsible for defending sea borders and maritime interests.',
      logo: '/assets/logos/pakistan-navy.png',
    },
    categories: [
      {
        name: 'Officer',
        description: 'Commissioned officers of the Pakistan Navy serving aboard warships and shore establishments.',
        positions: [
          { name: 'PN Cadet',              description: 'Officer cadet training at PNS Rahbar for commissioned naval service.' },
          { name: 'Short Service Commission', description: 'Time-limited naval officer commission for specialist roles.' },
          { name: 'Operations Branch',     description: 'Officer responsible for navigation, weapons, and tactical operations.' },
          { name: 'Engineering Branch',    description: 'Marine engineer officer maintaining ship propulsion and systems.' },
          { name: 'Supply Branch',         description: 'Logistics and supply chain officer aboard warships.' },
          { name: 'Education Branch',      description: 'Naval education officer managing training institutions.' },
          { name: 'IT Branch',             description: 'Information technology officer managing naval networks and communications.' },
        ],
      },
      {
        name: 'Sailor',
        description: 'Enlisted deck crew and specialists serving in the Pakistan Navy.',
        positions: [
          { name: 'Technical Sailor', description: 'Maintaining ship machinery, weapons systems, and electronics.' },
          { name: 'Marine',           description: 'Naval infantry responsible for maritime security operations.' },
          { name: 'Naval Police',     description: 'Discipline and law enforcement within naval establishments.' },
          { name: 'Steward',          description: 'Officers\' mess management and hospitality aboard ships.' },
          { name: 'Chef',             description: 'Food preparation for naval crew on warships and shore bases.' },
          { name: 'Driver',           description: 'Naval transport driver operating vehicles at shore establishments.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  3. PAKISTAN AIR FORCE
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Pakistan Air Force',
      description: 'The aerial warfare branch of the Pakistan Armed Forces, providing air defence and protecting Pakistani airspace.',
      logo: '/assets/logos/pakistan-airforce.png',
    },
    categories: [
      {
        name: 'Officer',
        description: 'Commissioned officers of the PAF in flying and ground support branches.',
        positions: [
          { name: 'GD Pilot',             description: 'General Duty Pilot operating combat and transport aircraft.' },
          { name: 'Aeronautical Engineer', description: 'Aircraft maintenance and airworthiness officer.' },
          { name: 'Air Defence Officer',  description: 'Managing radar systems and air defence operations.' },
          { name: 'Education Officer',    description: 'PAF officer managing training and academic institutions.' },
          { name: 'Admin & Special Duties', description: 'Administrative officer handling PAF base management and protocol.' },
          { name: 'Logistics Officer',    description: 'Supply chain and inventory management for PAF resources.' },
          { name: 'IT Officer',           description: 'Managing PAF information technology and communication systems.' },
        ],
      },
      {
        name: 'Airman',
        description: 'Enlisted technical and support personnel of the Pakistan Air Force.',
        positions: [
          { name: 'Aero Technician',  description: 'Aircraft technician maintaining airframes, engines, and avionics.' },
          { name: 'Security',         description: 'Ground defence and base protection specialist.' },
          { name: 'Clerk',           description: 'Administrative airman managing records and correspondence.' },
          { name: 'Driver',          description: 'Transport driver operating PAF ground vehicles.' },
          { name: 'Medical Assistant', description: 'Medical support airman assisting in PAF medical facilities.' },
          { name: 'Sportsman',        description: 'Professional athlete representing PAF in national competitions.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  4. ANTI NARCOTICS FORCE (ANF)
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Anti Narcotics Force (ANF)',
      description: 'Federal agency responsible for combating drug smuggling and illicit narcotics trade within and across Pakistan.',
      logo: '/assets/logos/anf.png',
    },
    categories: [
      {
        name: 'Executive Staff',
        description: 'Investigative and enforcement officers leading narcotics operations.',
        positions: [
          { name: 'Inspector',              description: 'Senior ANF officer handling drug seizure cases and investigations.' },
          { name: 'Sub Inspector',          description: 'Field investigator conducting surveillance on drug networks.' },
          { name: 'Assistant Sub Inspector', description: 'Support investigator assisting field anti-narcotics operations.' },
        ],
      },
      {
        name: 'Constabulary Staff',
        description: 'Uniformed ANF personnel executing narcotics interdiction and enforcement.',
        positions: [
          { name: 'Constable',        description: 'Uniformed officer participating in drug raids and border checks.' },
          { name: 'Driver Constable', description: 'Uniformed driver constable supporting ANF field operations.' },
        ],
      },
      {
        name: 'Support Staff',
        description: 'Administrative and clerical support for ANF operations.',
        positions: [
          { name: 'Clerk',               description: 'Administrative clerk handling ANF office records and correspondence.' },
          { name: 'Assistant',           description: 'Office assistant supporting administrative functions.' },
          { name: 'Stenotypist',         description: 'Typist specializing in shorthand for official dictation.' },
          { name: 'Data Entry Operator', description: 'Data entry operator managing digital records and databases.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  5. AIRPORT SECURITY FORCE (ASF)
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Airport Security Force (ASF)',
      description: 'Federal force protecting airports, facilities, aircraft, and maintaining security in civil aviation.',
      logo: '/assets/logos/asf.png',
    },
    categories: [
      {
        name: 'Executive Staff',
        description: 'Officers overseeing ASF security operations at airports.',
        positions: [
          { name: 'Inspector',                description: 'ASF security supervisor managing shift operations at airports.' },
          { name: 'Assistant Director',       description: 'Senior officer overseeing airport security planning and policy.' },
          { name: 'Deputy Assistant Director', description: 'Deputy officer supporting airport zone security management.' },
        ],
      },
      {
        name: 'Uniform Staff',
        description: 'Uniformed ASF personnel conducting passenger and baggage screening.',
        positions: [
          { name: 'Corporal',              description: 'Entry-level ASF officer conducting terminal screening.' },
          { name: 'Assistant Sub Inspector', description: 'Supervisory officer coordinating ASF checkpoint operations.' },
        ],
      },
      {
        name: 'Support Staff',
        description: 'Administrative and logistics support for ASF operations.',
        positions: [
          { name: 'Clerk',               description: 'Administrative clerk maintaining ASF records and documentation.' },
          { name: 'Assistant',           description: 'Office assistant supporting ASF administrative functions.' },
          { name: 'Driver',              description: 'Transport driver operating ASF vehicles at airports.' },
          { name: 'Data Entry Operator', description: 'Data entry operator managing passenger and security records.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  6. COUNTER TERRORISM DEPARTMENT (CTD)
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Counter Terrorism Department (CTD)',
      description: 'Specialized wing responsible for intelligence collection, investigations, and operations against terrorist organizations.',
      logo: '/assets/logos/ctd.png',
    },
    categories: [
      {
        name: 'Investigation Staff',
        description: 'Officers investigating terrorist networks, financing, and threat assessments.',
        positions: [
          { name: 'Inspector',    description: 'CTD field investigator working on terrorism cases and threat analysis.' },
          { name: 'Sub Inspector', description: 'Support investigator conducting surveillance and evidence gathering.' },
          { name: 'ASI',          description: 'Assistant Sub Inspector assisting counter-terrorism investigations.' },
        ],
      },
      {
        name: 'Operational Staff',
        description: 'Tactical CTD personnel executing counter-terror raids and cordon operations.',
        positions: [
          { name: 'Constable',        description: 'Front-line CTD operator in raids, arrests, and site security.' },
          { name: 'Driver Constable', description: 'Tactical driver supporting CTD rapid response teams.' },
        ],
      },
      {
        name: 'Intelligence Staff',
        description: 'Intelligence officers collecting and analysing terrorism-related data.',
        positions: [
          { name: 'Intelligence Officer', description: 'Collecting and processing intelligence on terrorist activities.' },
          { name: 'Analyst',              description: 'Data analyst assessing threat intelligence for CTD operations.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  7. PAKISTAN CUSTOMS
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Pakistan Customs',
      description: 'Tasked with collecting customs duties and taxes, preventing smuggling, and enforcing trade regulations at borders and ports.',
      logo: '/assets/logos/customs.png',
    },
    categories: [
      {
        name: 'Enforcement Staff',
        description: 'Officers preventing smuggling and enforcing customs laws at borders and ports.',
        positions: [
          { name: 'Inspector Customs',  description: 'Customs inspector examining cargo and enforcing tariff regulations.' },
          { name: 'Preventive Officer', description: 'Frontline officer intercepting smuggling at border crossings.' },
          { name: 'Intelligence Officer', description: 'Gathering and analysing intelligence on customs violations.' },
        ],
      },
      {
        name: 'Administrative Staff',
        description: 'Administrative personnel managing customs office operations.',
        positions: [
          { name: 'Assistant', description: 'Office assistant supporting customs administrative functions.' },
          { name: 'UDC',       description: 'Upper Division Clerk managing classified and general correspondence.' },
          { name: 'LDC',       description: 'Lower Division Clerk handling routine office records and files.' },
        ],
      },
      {
        name: 'Technical Staff',
        description: 'Technical experts managing data systems and IT infrastructure.',
        positions: [
          { name: 'Data Entry Operator', description: 'Managing digital customs records and duty assessment databases.' },
          { name: 'IT Support',          description: 'Maintaining customs IT systems and network infrastructure.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  8. INTELLIGENCE BUREAU (IB)
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Intelligence Bureau (IB)',
      description: 'Premier civilian intelligence agency responsible for counter-intelligence, domestic security, and intelligence gathering.',
      logo: '/assets/logos/ib.png',
    },
    categories: [
      {
        name: 'Intelligence Staff',
        description: 'Officers collecting, analysing, and managing domestic intelligence.',
        positions: [
          { name: 'Intelligence Officer', description: 'Field officer collecting domestic security and counter-intelligence data.' },
          { name: 'Assistant Director',   description: 'Entry-level gazetted officer managing regional intelligence networks.' },
          { name: 'Investigation Officer', description: 'Officer investigating threats to national security and state institutions.' },
        ],
      },
      {
        name: 'Field Operations',
        description: 'Ground-level operatives conducting surveillance and field intelligence.',
        positions: [
          { name: 'Field Staff',       description: 'Ground-level operative assisting intelligence collection operations.' },
          { name: 'Surveillance Staff', description: 'Specialist in physical and technical surveillance operations.' },
        ],
      },
      {
        name: 'Support Staff',
        description: 'Administrative and technical support for IB operational units.',
        positions: [
          { name: 'Data Entry Operator', description: 'Managing classified and general intelligence databases.' },
          { name: 'Assistant',           description: 'Office assistant supporting IB administrative functions.' },
          { name: 'Clerk',              description: 'Administrative clerk handling IB correspondence and records.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  9. FEDERAL INVESTIGATION AGENCY (FIA)
  // ═══════════════════════════════════════════════════════
  {
    org: {
      name: 'Federal Investigation Agency (FIA)',
      description: 'Border control, criminal investigation, intelligence and security agency tasked with investigating federal crimes.',
      logo: '/assets/logos/fia.png',
    },
    categories: [
      {
        name: 'Investigation Wing',
        description: 'FIA officers investigating federal crimes, fraud, and criminal networks.',
        positions: [
          { name: 'Inspector',        description: 'FIA investigating officer handling criminal and federal cases.' },
          { name: 'Sub Inspector',    description: 'Field investigator conducting surveillance and arrests.' },
          { name: 'Assistant Director', description: 'Senior gazetted officer managing FIA investigation teams.' },
        ],
      },
      {
        name: 'Immigration Wing',
        description: 'Officers managing border control and immigration law enforcement.',
        positions: [
          { name: 'Immigration Officer', description: 'Enforcing immigration laws and managing passport control at borders.' },
        ],
      },
      {
        name: 'Cyber Crime Wing',
        description: 'Technical specialists investigating digital crimes and cybersecurity threats.',
        positions: [
          { name: 'Cyber Crime Investigator', description: 'Investigating online fraud, hacking, and digital evidence.' },
          { name: 'Technical Officer',        description: 'Providing technical expertise for cyber crime investigations.' },
        ],
      },
      {
        name: 'Administrative Staff',
        description: 'Administrative personnel supporting FIA operations and case management.',
        positions: [
          { name: 'Assistant',   description: 'Office assistant supporting FIA administrative functions.' },
          { name: 'UDC',         description: 'Upper Division Clerk managing classified FIA correspondence.' },
          { name: 'LDC',         description: 'Lower Division Clerk handling routine office records.' },
          { name: 'Stenotypist', description: 'Typist specializing in shorthand for FIA official dictation.' },
        ],
      },
      {
        name: 'Technical Staff',
        description: 'IT and data management personnel supporting FIA digital infrastructure.',
        positions: [
          { name: 'Data Entry Operator', description: 'Managing FIA case records and digital databases.' },
          { name: 'IT Technician',       description: 'Maintaining FIA network infrastructure and computer systems.' },
        ],
      },
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected.\n');

    // ── 1. Drop stale indexes (safe to ignore "not found" errors) ─────────────
    try {
      await mongoose.connection.collection('categories').dropIndex('name_1');
      console.log('[Seed] Dropped stale categories.name_1 index.');
    } catch (_) { /* index may not exist */ }

    try {
      await mongoose.connection.collection('positions').dropIndex('name_1');
      console.log('[Seed] Dropped stale positions.name_1 index.');
    } catch (_) { /* index may not exist */ }

    // ── 2. Wipe existing data (positions first due to refs) ───────────────────
    await Position.deleteMany({});
    await Category.deleteMany({});
    await Organization.deleteMany({});
    console.log('[Seed] Cleared existing organizations, categories, and positions.\n');

    // ── 3. Seed each org → category → position ────────────────────────────────
    let totalOrgs = 0, totalCats = 0, totalPos = 0;

    for (const entry of HIERARCHY) {
      // Create org
      const orgDoc = await Organization.create(entry.org);
      totalOrgs++;
      console.log(`[Seed] ✔ Org: ${orgDoc.name}`);

      for (const cat of entry.categories) {
        // Create category linked to this org
        const catDoc = await Category.create({
          name: cat.name,
          description: cat.description,
          organization: orgDoc._id,
        });
        totalCats++;
        console.log(`         ├── Category: ${catDoc.name} (${cat.positions.length} positions)`);

        for (const pos of cat.positions) {
          await Position.create({
            name: pos.name,
            description: pos.description,
            category: catDoc._id,
            organization: orgDoc._id,
          });
          totalPos++;
        }
      }
      console.log('');
    }

    // ── 4. Summary ─────────────────────────────────────────────────────────────
    console.log('─'.repeat(55));
    console.log(`[Seed] ✅ Done!`);
    console.log(`         Organizations : ${totalOrgs}`);
    console.log(`         Categories    : ${totalCats}`);
    console.log(`         Positions     : ${totalPos}`);
    console.log('─'.repeat(55));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] ❌ Error:', error.message);
    process.exit(1);
  }
};

seedDB();
