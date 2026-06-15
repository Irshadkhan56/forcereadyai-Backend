import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization.js';

// Load env variables
dotenv.config();

const organizations = [
  {
    name: 'Pakistan Army',
    description: 'The land warfare branch of the Pakistan Armed Forces, responsible for defending the country\'s land borders and maintaining national security.',
    logo: '/assets/logos/pakistan-army.png',
  },
  {
    name: 'Pakistan Navy',
    description: 'The naval warfare branch of the Pakistan Armed Forces, responsible for defending the sea borders and safeguarding maritime interests of Pakistan.',
    logo: '/assets/logos/pakistan-navy.png',
  },
  {
    name: 'Pakistan Air Force',
    description: 'The aerial warfare branch of the Pakistan Armed Forces, tasked with providing air defense of Pakistan and protecting its airspace.',
    logo: '/assets/logos/pakistan-airforce.png',
  },
  {
    name: 'Pakistan Police',
    description: 'The primary law enforcement agency responsible for maintaining public order, prevention, and detection of crime across different provinces and federal territories.',
    logo: '/assets/logos/pakistan-police.png',
  },
  {
    name: 'FIA',
    description: 'Federal Investigation Agency - A border control, criminal investigation, intelligence and security agency tasked with investigating federal crimes.',
    logo: '/assets/logos/fia.png',
  },
  {
    name: 'CTD',
    description: 'Counter Terrorism Department - A specialized wing of the police force responsible for intelligence collection, investigations, and operations against terrorist organizations.',
    logo: '/assets/logos/ctd.png',
  },
  {
    name: 'ANF',
    description: 'Anti Narcotics Force - A federal agency responsible for combating drug smuggling and illicit narcotics trade within and across Pakistan.',
    logo: '/assets/logos/anf.png',
  },
  {
    name: 'ASF',
    description: 'Airport Security Force - A federal force responsible for protecting airports, facilities, aircrafts, and maintaining security in civil aviation.',
    logo: '/assets/logos/asf.png',
  },
  {
    name: 'Customs',
    description: 'Pakistan Customs - Tasked with collecting customs duties and taxes, preventing smuggling, and enforcing trade regulations at borders and ports of entry.',
    logo: '/assets/logos/customs.png',
  },
  {
    name: 'Intelligence Bureau',
    description: 'The premier civilian intelligence agency in Pakistan, responsible for counter-intelligence, domestic security, and intelligence gathering.',
    logo: '/assets/logos/ib.png',
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forceready_db';
    console.log(`[Seeding] Connecting to database...`);
    await mongoose.connect(mongoUri);
    console.log(`[Seeding] Connected to database. Clean-up starting...`);

    // Clean current collection
    await Organization.deleteMany({});
    console.log(`[Seeding] Existing organizations cleared.`);

    // Insert seeds
    const createdOrganizations = await Organization.insertMany(organizations);
    console.log(`[Seeding] Success! ${createdOrganizations.length} organizations seeded successfully.`);

    // Close Connection
    await mongoose.connection.close();
    console.log(`[Seeding] Connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seeding Error] Seeding process failed:`, error.message);
    process.exit(1);
  }
};

seedDB();
