import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import Report from './models/Report';
import Assessment from './models/Assessment';

dotenv.config();

export const seedDB = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@ttu.edu.gh' });
    if (adminExists) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    // Clear existing data (in case there's partial data or it's a fresh in-memory db)
    console.log('Purging existing data...');
    await User.deleteMany({});
    await Report.deleteMany({});
    await Assessment.deleteMany({});

    // Hash distinct passwords for each role
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('AdminPass2026!', salt);
    const supervisorPasswordHash = await bcrypt.hash('SupervisorPass2026!', salt);
    const studentPasswordHash = await bcrypt.hash('StudentPass123', salt);

    console.log('Seeding Users...');
    // Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@ttu.edu.gh',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+233200000001',
    });

    // Create Supervisors
    const supervisor1 = await User.create({
      name: 'Dr. Kwame Nkrumah',
      email: 'kwame.s@ttu.edu.gh',
      passwordHash: supervisorPasswordHash,
      role: 'supervisor',
      department: 'Bachelor of Technology in Graphic Design',
      phone: '+233200000002',
    });

    const supervisor2 = await User.create({
      name: 'Prof. Yaa Asantewaa',
      email: 'yaa.a@ttu.edu.gh',
      passwordHash: supervisorPasswordHash,
      role: 'supervisor',
      department: 'Bachelor of Technology in Painting',
      phone: '+233200000003',
    });

    // Create Students
    const student1 = await User.create({
      name: 'John Doe',
      email: 'john.student@ttu.edu.gh',
      passwordHash: studentPasswordHash,
      role: 'student',
      department: 'Bachelor of Technology in Graphic Design',
      assignedSupervisorId: supervisor1._id
    });

    const student2 = await User.create({
      name: 'Jane Smith',
      email: 'jane.student@ttu.edu.gh',
      passwordHash: studentPasswordHash,
      role: 'student',
      department: 'Bachelor of Technology in Painting',
      assignedSupervisorId: supervisor2._id
    });

    console.log('Seeding Reports...');
    // Create Reports
    const report1 = await Report.create({
      studentId: student1._id,
      title: 'Week 1 Attachment Report',
      description: 'Learned the basics of UI/UX design workflow in Figma.',
      fileUrl: 'https://example.com/report1.pdf',
      type: 'weekly',
      status: 'pending',
      weekNumber: 1
    });

    const report2 = await Report.create({
      studentId: student2._id,
      title: 'Monthly Progress Report',
      description: 'Completed the first month. Focused heavily on color theory and canvas preparation.',
      fileUrl: 'https://example.com/report2.pdf',
      type: 'monthly',
      status: 'graded'
    });

    console.log('Seeding Assessments...');
    // Create Assessment for the graded report
    await Assessment.create({
      reportId: report2._id,
      supervisorId: supervisor2._id,
      feedback: 'Excellent progress for your first month. Keep up the good work!',
      grade: 85,
      criteria: {
        content: 85,
        presentation: 90,
        understanding: 80
      }
    });

    console.log('Database seeded successfully!');
    console.log('------------------------------------------------');
    console.log('Login credentials for testing:');
    console.log('Admin: admin@ttu.edu.gh / AdminPass2026!');
    console.log('Supervisor 1: kwame.s@ttu.edu.gh / SupervisorPass2026!');
    console.log('Supervisor 2: yaa.a@ttu.edu.gh / SupervisorPass2026!');
    console.log('Student 1: john.student@ttu.edu.gh / StudentPass123');
    console.log('Student 2: jane.student@ttu.edu.gh / StudentPass123');
    console.log('------------------------------------------------');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
