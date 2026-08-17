import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import {
  Report, Assessment, Notification, Student, Supervisor,
  AssumptionSubmission, AttachmentLetterSubmission,
  AssignedLocation, DailyLocationCheckIn,
  DailyReport, WeeklyReportUpdate, MonthlyReport, MissingDailyReport
} from '../types';
import { useAuth } from './AuthContext';
import { fetchApi } from '../api';

interface DataContextType {
  reports: Report[];
  assessments: Assessment[];
  notifications: Notification[];
  students: Student[];
  supervisors: Supervisor[];
  assumptionSubmissions: AssumptionSubmission[];
  attachmentLetterSubmissions: AttachmentLetterSubmission[];
  locations: AssignedLocation[];
  dailyCheckIns: DailyLocationCheckIn[];
  dailyReports: DailyReport[];
  weeklyUpdates: WeeklyReportUpdate[];
  monthlyReports: MonthlyReport[];
  missingDailyReports: MissingDailyReport[];
  addReport: (report: Omit<Report, 'id' | 'submittedDate' | 'status'>) => Promise<void>;
  updateReport: (id: string, updates: Partial<Report>) => void;
  addAssessment: (assessment: Omit<Assessment, 'id' | 'assessedDate'>) => void;
  markNotificationAsRead: (id: string) => void;
  assignSupervisor: (studentId: string, supervisorId: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'progress'>) => void;
  removeUser: (userId: string) => void;
  submitAssumptionForm: (data: Omit<AssumptionSubmission, 'id' | 'submittedAt' | 'status'>) => void;
  updateAssumptionStatus: (id: string, status: AssumptionSubmission['status']) => void;
  submitAttachmentLetter: (data: Omit<AttachmentLetterSubmission, 'id' | 'submittedAt' | 'status'>) => void;
  updateAttachmentLetterStatus: (id: string, status: AttachmentLetterSubmission['status']) => void;
  // Location Allocation & Monitoring
  addLocation: (location: Omit<AssignedLocation, 'id' | 'createdAt'>) => void;
  updateLocation: (id: string, updates: Partial<AssignedLocation>) => void;
  deleteLocation: (id: string) => void;
  assignStudentLocation: (studentId: string, locationId: string) => void;
  submitDailyLocationCheckIn: (checkIn: Omit<DailyLocationCheckIn, 'id' | 'timestamp'>) => void;
  // Daily, Weekly, Monthly Reports
  addDailyReport: (report: Omit<DailyReport, 'id' | 'submittedAt' | 'status'>) => void;
  reviewDailyReport: (id: string, feedback: string, grade?: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock initial data
const initialStudents: Student[] = [
  {
    id: 'student1',
    email: 'john.doe@university.edu',
    name: 'John Doe',
    role: 'student',
    studentId: 'STU001',
    department: 'Bachelor of Technology in Graphic Design',
    supervisorId: 'supervisor1',
    company: 'Tech Corp Ltd',
    attachmentStartDate: '2026-01-15',
    attachmentEndDate: '2026-06-15',
    progress: 65,
    currentLevel: 3,
    currentProjectTitle: 'Corporate Brand Identity & Digital UI Kit Design',
    currentProjectDescription: 'Developing an enterprise design system, interactive web components, and multi-channel brand assets for client marketing pipelines.',
    levelProjects: [
      {
        id: 'p-stu1-l1',
        level: 1,
        levelName: 'Level 100',
        projectTitle: 'Visual Communication Fundamentals & Vector Graphics',
        description: 'Applied color theory, typography hierarchy, and scalable vector assets for institutional branding.',
        companyOrHost: 'TTU Design Studio & Media Lab',
        academicYear: '2023/2024',
        status: 'completed',
        progressPercentage: 100,
        reportsCount: 4,
        finalGrade: 88,
        remark: 'Good',
        startDate: '2024-01-10',
        endDate: '2024-05-18',
        reports: [
          { id: 'l1-r1', title: 'Studio Tools & Workspace Preparation', weekNumber: 2, submittedDate: '2024-01-25', grade: 90, status: 'graded', feedback: 'Excellent introduction and grasp of studio guidelines.' },
          { id: 'l1-r2', title: 'Typography and Color Theory Case Study', weekNumber: 6, submittedDate: '2024-02-28', grade: 85, status: 'graded', feedback: 'Well-researched presentation and visual hierarchy.' },
          { id: 'l1-r3', title: 'Vector Illustration & Logo Suite Development', weekNumber: 10, submittedDate: '2024-03-30', grade: 89, status: 'graded', feedback: 'Clean geometry and creative execution.' },
          { id: 'l1-r4', title: 'Level 1 Final Project & Portfolio Submission', weekNumber: 14, submittedDate: '2024-05-10', grade: 88, status: 'graded', feedback: 'Comprehensive portfolio review passed.' },
        ],
      },
      {
        id: 'p-stu1-l2',
        level: 2,
        levelName: 'Level 200',
        projectTitle: 'Publication Design & Print Production Automation',
        description: 'Managed prepress workflows, editorial magazine layouts, packaging dielines, and quality assurance.',
        companyOrHost: 'Graphic Communications Group Ltd',
        academicYear: '2024/2025',
        status: 'completed',
        progressPercentage: 100,
        reportsCount: 6,
        finalGrade: 84,
        remark: 'Good',
        startDate: '2025-01-12',
        endDate: '2025-06-10',
        reports: [
          { id: 'l2-r1', title: 'Prepress Workflow Setup & Color Profiles', weekNumber: 2, submittedDate: '2025-01-26', grade: 82, status: 'graded', feedback: 'Good understanding of CMYK plate calibration.' },
          { id: 'l2-r2', title: 'Editorial Spread & Grid System Implementation', weekNumber: 4, submittedDate: '2025-02-15', grade: 86, status: 'graded', feedback: 'Solid typography balance.' },
          { id: 'l2-r3', title: 'Offset Lithography Calibration & Proofing', weekNumber: 8, submittedDate: '2025-03-20', grade: 80, status: 'graded', feedback: 'Hands-on plate making mastered.' },
          { id: 'l2-r4', title: 'Packaging Die-lines & Material Prototyping', weekNumber: 11, submittedDate: '2025-04-18', grade: 85, status: 'graded', feedback: 'Accurate folding and structural integrity.' },
          { id: 'l2-r5', title: 'Client Proofing and Revision Management', weekNumber: 14, submittedDate: '2025-05-12', grade: 87, status: 'graded', feedback: 'Professional client interaction.' },
          { id: 'l2-r6', title: 'Level 2 Attachment Comprehensive Summary', weekNumber: 16, submittedDate: '2025-06-05', grade: 88, status: 'graded', feedback: 'Outstanding final assessment summary.' },
        ],
      },
      {
        id: 'p-stu1-l3',
        level: 3,
        levelName: 'Level 300',
        projectTitle: 'Corporate Brand Identity & Digital UI Kit Design',
        description: 'Developing an enterprise design system, interactive web components, and multi-channel brand assets for client marketing pipelines.',
        companyOrHost: 'Tech Corp Ltd',
        academicYear: '2025/2026',
        status: 'in_progress',
        progressPercentage: 65,
        reportsCount: 3,
        finalGrade: 85,
        remark: 'Good',
        startDate: '2026-01-15',
        endDate: '2026-06-15',
      },
    ],
  },
  {
    id: 'student2',
    email: 'jane.smith@university.edu',
    name: 'Jane Smith',
    role: 'student',
    studentId: 'STU002',
    department: 'Bachelor of Technology in Ceramics',
    supervisorId: 'supervisor1',
    company: 'InnovateTech Solutions',
    attachmentStartDate: '2026-01-20',
    attachmentEndDate: '2026-06-20',
    progress: 50,
    currentLevel: 2,
    currentProjectTitle: 'Advanced Ceramic Glaze Formulation & Industrial Molds',
    currentProjectDescription: 'Research and testing of high-durability thermal glazes and plaster mold casting for sanitaryware and architectural tiles.',
    levelProjects: [
      {
        id: 'p-stu2-l1',
        level: 1,
        levelName: 'Level 100',
        projectTitle: 'Ceramic Raw Material Analysis & Wheel Throwing',
        description: 'Clay body preparation, plasticity tests, and basic form construction techniques.',
        companyOrHost: 'TTU Ceramic Technology Workshop',
        academicYear: '2024/2025',
        status: 'completed',
        progressPercentage: 100,
        reportsCount: 4,
        finalGrade: 78,
        remark: 'Average',
        startDate: '2025-01-15',
        endDate: '2025-05-20',
        reports: [
          { id: 'l1-s2-r1', title: 'Clay Processing and Sieve Analysis', weekNumber: 2, submittedDate: '2025-01-28', grade: 75, status: 'graded' },
          { id: 'l1-s2-r2', title: 'Throwing Cylinders and Pitchers', weekNumber: 6, submittedDate: '2025-02-25', grade: 80, status: 'graded' },
          { id: 'l1-s2-r3', title: 'Bisque Firing Temperature Monitoring', weekNumber: 10, submittedDate: '2025-03-29', grade: 77, status: 'graded' },
          { id: 'l1-s2-r4', title: 'Level 1 Studio Evaluation Report', weekNumber: 14, submittedDate: '2025-05-15', grade: 80, status: 'graded' },
        ],
      },
      {
        id: 'p-stu2-l2',
        level: 2,
        levelName: 'Level 200',
        projectTitle: 'Advanced Ceramic Glaze Formulation & Industrial Molds',
        description: 'Research and testing of high-durability thermal glazes and plaster mold casting for sanitaryware and architectural tiles.',
        companyOrHost: 'InnovateTech Solutions',
        academicYear: '2025/2026',
        status: 'in_progress',
        progressPercentage: 50,
        reportsCount: 1,
        startDate: '2026-01-20',
        endDate: '2026-06-20',
      },
    ],
  },
  {
    id: 'student3',
    email: 'mike.johnson@university.edu',
    name: 'Mike Johnson',
    role: 'student',
    studentId: 'STU003',
    department: 'Bachelor of Technology in Textiles',
    company: 'Global Enterprises',
    attachmentStartDate: '2026-02-01',
    attachmentEndDate: '2026-07-01',
    progress: 40,
    currentLevel: 1,
    currentProjectTitle: 'Textile Fiber Processing & Natural Dye Formulation',
    currentProjectDescription: 'Exploring organic mordants and automated weaving looms for sustainable garment manufacturing.',
    levelProjects: [
      {
        id: 'p-stu3-l1',
        level: 1,
        levelName: 'Level 100',
        projectTitle: 'Textile Fiber Processing & Natural Dye Formulation',
        description: 'Exploring organic mordants and automated weaving looms for sustainable garment manufacturing.',
        companyOrHost: 'Global Enterprises',
        academicYear: '2025/2026',
        status: 'in_progress',
        progressPercentage: 40,
        reportsCount: 0,
        startDate: '2026-02-01',
        endDate: '2026-07-01',
      },
    ],
  },
];

const initialSupervisors: Supervisor[] = [
  {
    id: 'supervisor1',
    email: 'josephine.sarpong@university.edu',
    name: 'Mrs. Josephine Sarpong- Nyantakyi',
    role: 'supervisor',
    department: 'Bachelor of Technology in Graphic Design',
    assignedStudents: ['student1', 'student2'],
  },
  {
    id: 'supervisor2',
    email: 'collins.fordjour@university.edu',
    name: 'Mr. Collins Kwesi Fordjour',
    role: 'supervisor',
    department: 'Bachelor of Technology in Ceramics',
    assignedStudents: [],
  },
  {
    id: 'supervisor3',
    email: 'george.brako@university.edu',
    name: 'Dr. George Brako-Hiapa',
    role: 'supervisor',
    department: 'Bachelor of Technology in Textiles',
    assignedStudents: [],
  },
  {
    id: 'supervisor4',
    email: 'betty.faniyan@university.edu',
    name: 'Mrs. Betty Faniyan',
    role: 'supervisor',
    department: 'Bachelor of Technology in Fashion Design',
    assignedStudents: [],
  },
  {
    id: 'supervisor5',
    email: 'patrick.adubempah@university.edu',
    name: 'Mr. Patrick Adu-Bempah',
    role: 'supervisor',
    department: 'Bachelor of Technology in Sculpture and Industrial Production',
    assignedStudents: [],
  },
  {
    id: 'supervisor6',
    email: 'ernest.kudjordjie@university.edu',
    name: 'Mr. Ernest Kudjordjie',
    role: 'supervisor',
    department: 'Bachelor of Technology in Painting',
    assignedStudents: [],
  },
  {
    id: 'supervisor7',
    email: 'prosper.dzukey@university.edu',
    name: 'Mr. Prosper Kofi Dzukey',
    role: 'supervisor',
    department: 'Bachelor of Technology in Graphic Design',
    assignedStudents: [],
  },
];

const initialReports: Report[] = [
  {
    id: 'report1',
    studentId: 'student1',
    studentName: 'John Doe',
    title: 'Week 1 Progress Report',
    description: 'Introduction to company processes and initial training on development tools.',
    submittedDate: '2026-01-22',
    weekNumber: 1,
    fileName: 'week1_report.pdf',
    fileSize: '245 KB',
    status: 'graded',
    feedback: 'Excellent start! Good understanding of the company environment.',
    grade: 85,
  },
  {
    id: 'report2',
    studentId: 'student1',
    studentName: 'John Doe',
    title: 'Week 2 Progress Report',
    description: 'Started working on React components for the company dashboard project.',
    submittedDate: '2026-01-29',
    weekNumber: 2,
    fileName: 'week2_report.pdf',
    fileSize: '312 KB',
    status: 'reviewed',
    feedback: 'Good progress. Consider adding more technical details.',
  },
  {
    id: 'report3',
    studentId: 'student2',
    studentName: 'Jane Smith',
    title: 'Week 1 Progress Report',
    description: 'Orientation and workplace safety training completed.',
    submittedDate: '2026-01-27',
    weekNumber: 1,
    fileName: 'jsmith_week1.pdf',
    fileSize: '189 KB',
    status: 'pending',
  },
];

const initialAssessments: Assessment[] = [
  {
    id: 'assess1',
    reportId: 'report1',
    studentId: 'student1',
    supervisorId: 'supervisor1',
    attendance: 95,
    performance: 85,
    reportQuality: 80,
    professionalism: 90,
    overallGrade: 85,
    feedback: 'John has shown excellent commitment and professionalism during the first week.',
    assessedDate: '2026-01-23',
  },
];

const initialNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'student1',
    title: 'Report Graded',
    message: 'Your Week 1 Progress Report has been graded. Score: 85/100',
    type: 'assessment',
    read: false,
    createdAt: '2026-01-23T10:30:00Z',
  },
  {
    id: 'notif2',
    userId: 'student1',
    title: 'Submission Deadline',
    message: 'Week 3 report is due in 2 days',
    type: 'deadline',
    read: false,
    createdAt: '2026-02-03T08:00:00Z',
  },
  {
    id: 'notif3',
    userId: 'student2',
    title: 'Supervisor Assigned',
    message: 'Mrs. Josephine Sarpong- Nyantakyi has been assigned as your supervisor',
    type: 'assignment',
    read: true,
    createdAt: '2026-01-20T14:00:00Z',
  },
];

const initialAssumptions: AssumptionSubmission[] = [
  {
    id: 'assumption1',
    studentId: 'student1',
    studentName: 'John Doe',
    submittedAt: '2026-01-16T09:00:00Z',
    status: 'pending',
    companyName: 'Tech Corp Ltd',
    companyPhone: '0244123456',
    companyEmail: 'info@techcorp.com',
    companyZone: 'Greater Accra Region',
    companyLocation: '12 Independence Avenue, Accra',
    companyAddress: 'P.O. Box 1234, Accra',
    companySupervisor: 'Mr. Kwame Mensah',
    letterAddressedTo: 'THE MANAGER',
    companyTown: 'Accra',
    dateOfCommencement: '2026-01-15',
    supervisorPhone: '0244987654',
    studentSignature: 'John Doe',
  },
];

const initialAttachmentLetters: AttachmentLetterSubmission[] = [
  {
    id: 'letter1',
    studentId: 'student1',
    studentName: 'John Doe',
    department: 'Bachelor of Technology in Graphic Design',
    submittedAt: '2026-01-14T10:00:00Z',
    status: 'pending',
    companyName: 'Tech Corp Ltd',
    companyTown: 'Accra',
    letterAddressedTo: 'THE MANAGER',
    studentSignature: 'John Doe',
  },
];

const initialLocations: AssignedLocation[] = [
  {
    id: 'loc-1',
    name: 'Tech Corp Industrial Hub',
    zone: 'Greater Accra Industrial Zone',
    city: 'Accra',
    address: '12 Independence Avenue, Ridge, Accra',
    description: 'Enterprise software development, UI/UX systems, and corporate branding agency.',
    contactPerson: 'Mr. Kwame Mensah',
    contactPhone: '+233 24 412 3456',
    latitude: 5.55602,
    longitude: -0.1969,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'loc-2',
    name: 'InnovateTech Ceramic Complex',
    zone: 'Western Industrial Zone',
    city: 'Takoradi',
    address: 'Plot 45 Harbour Road, Commercial Area, Takoradi',
    description: 'Architectural ceramic casting, thermal tiles, and glaze manufacturing plant.',
    contactPerson: 'Eng. Francis Arthur',
    contactPhone: '+233 20 876 5432',
    latitude: 4.8967,
    longitude: -1.7583,
    createdAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 'loc-3',
    name: 'Global Enterprises Textile Mills',
    zone: 'Ashanti Regional Zone',
    city: 'Kumasi',
    address: 'Ahensan Industrial Layout, Kumasi',
    description: 'Textile fiber processing, organic dye synthesis, and automatic loom weaving.',
    contactPerson: 'Mrs. Janet Osei',
    contactPhone: '+233 27 123 4567',
    latitude: 6.6666,
    longitude: -1.6163,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'loc-4',
    name: 'Graphic Communications Press Facility',
    zone: 'Greater Accra Media Zone',
    city: 'Accra',
    address: 'Graphic Road, Adabraka, Accra',
    description: 'Commercial offset printing, prepress workflow, and packaging fabrication.',
    contactPerson: 'Mr. Alex Bediako',
    contactPhone: '+233 24 999 8888',
    latitude: 5.5500,
    longitude: -0.2100,
    createdAt: '2026-01-18T08:00:00Z',
  },
];

const initialDailyCheckIns: DailyLocationCheckIn[] = [
  {
    id: 'chk-1',
    studentId: 'student1',
    studentName: 'John Doe',
    timestamp: '2026-02-15T08:32:00Z',
    date: '2026-02-15',
    latitude: 5.55605,
    longitude: -0.19688,
    address: '12 Independence Avenue, Ridge, Accra',
    city: 'Accra',
    status: 'verified_on_site',
    distanceFromAssignedKm: 0.04,
    notes: 'Morning shift check-in. Workstation verified.',
  },
  {
    id: 'chk-2',
    studentId: 'student2',
    studentName: 'Jane Smith',
    timestamp: '2026-02-15T08:45:00Z',
    date: '2026-02-15',
    latitude: 4.89665,
    longitude: -1.75832,
    address: 'Plot 45 Harbour Road, Takoradi',
    city: 'Takoradi',
    status: 'verified_on_site',
    distanceFromAssignedKm: 0.07,
    notes: 'Ceramic testing lab check-in.',
  },
];

const initialDailyReports: DailyReport[] = [
  // Week 1 (5 days submitted)
  {
    id: 'dr_101',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-03',
    dayOfWeek: 'Monday',
    weekNumber: 1,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Orientation & Workplace Safety Briefing',
    tasksCompleted: 'Attended corporate orientation, received ID badges, toured facility floor and completed industrial safety compliance training.',
    skillsAcquired: 'Industrial Safety Standards (OSHA/ISO), Company Workflow Guidelines',
    challengesFaced: 'Getting familiar with internal network VPN and server access privileges.',
    hoursWorked: 8,
    equipmentOrTools: 'Workstation Setup, Network Diagnostics',
    submittedAt: '2026-08-03T16:30:00Z',
    status: 'graded',
    grade: 90,
    feedback: 'Excellent start and clear documentation of safety compliance.',
    locationVerified: true,
  },
  {
    id: 'dr_102',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-04',
    dayOfWeek: 'Tuesday',
    weekNumber: 1,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Design System Typography & Palette Tokens Setup',
    tasksCompleted: 'Implemented brand color variables and configured CSS typography tokens in design workspace.',
    skillsAcquired: 'Design Tokenization, Responsive Font Scaling',
    hoursWorked: 8,
    equipmentOrTools: 'Figma, VS Code',
    submittedAt: '2026-08-04T17:00:00Z',
    status: 'graded',
    grade: 88,
    feedback: 'Good work on token structure.',
    locationVerified: true,
  },
  {
    id: 'dr_103',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-05',
    dayOfWeek: 'Wednesday',
    weekNumber: 1,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'UI Component Kit: Button & Badge Primitives',
    tasksCompleted: 'Constructed accessible button variants (primary, ghost, outline) and badge indicators for status tagging.',
    skillsAcquired: 'Component Reusability, ARIA standards',
    hoursWorked: 8,
    equipmentOrTools: 'React, TypeScript',
    submittedAt: '2026-08-05T16:45:00Z',
    status: 'graded',
    grade: 92,
    feedback: 'Very thorough and adheres to accessibility standards.',
    locationVerified: true,
  },
  {
    id: 'dr_104',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-06',
    dayOfWeek: 'Thursday',
    weekNumber: 1,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Input Form Controls & Realtime Validation',
    tasksCompleted: 'Developed reusable input fields, select dropdowns, and connected client-side regex validation for student forms.',
    skillsAcquired: 'Form state handling, error messaging',
    hoursWorked: 8,
    equipmentOrTools: 'React Hook Form, Zod',
    submittedAt: '2026-08-06T17:15:00Z',
    status: 'graded',
    grade: 85,
    feedback: 'Clean validation rules.',
    locationVerified: true,
  },
  {
    id: 'dr_105',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-07',
    dayOfWeek: 'Friday',
    weekNumber: 1,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Week 1 Sprint Review & Component Demo',
    tasksCompleted: 'Presented finished UI primitives to industry supervisor and pushed code branches for review.',
    skillsAcquired: 'Git branching workflow, Sprint presentation',
    hoursWorked: 8,
    equipmentOrTools: 'Git, GitHub PR Review',
    submittedAt: '2026-08-07T16:00:00Z',
    status: 'graded',
    grade: 90,
    feedback: 'Great presentation skills during sprint review.',
    locationVerified: true,
  },

  // Week 2 (4 submitted, 1 missing on Thursday)
  {
    id: 'dr_201',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-10',
    dayOfWeek: 'Monday',
    weekNumber: 2,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Dashboard Navigation Shell & Routing Integration',
    tasksCompleted: 'Built responsive sidebar drawer with mobile overlay and active route highlighting.',
    skillsAcquired: 'React Router layout orchestration',
    hoursWorked: 8,
    equipmentOrTools: 'React Router v7',
    submittedAt: '2026-08-10T16:50:00Z',
    status: 'graded',
    grade: 86,
    feedback: 'Responsive navigation works smoothly.',
    locationVerified: true,
  },
  {
    id: 'dr_202',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-11',
    dayOfWeek: 'Tuesday',
    weekNumber: 2,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Student Profile & Assessment Metrics Widgets',
    tasksCompleted: 'Created progress cards, GPA tracking meters, and recent activity logs on student overview.',
    skillsAcquired: 'Metric visualization and card styling',
    hoursWorked: 8,
    equipmentOrTools: 'CSS Grid, Lucide Icons',
    submittedAt: '2026-08-11T17:10:00Z',
    status: 'reviewed',
    feedback: 'Layout looks clean.',
    locationVerified: true,
  },
  {
    id: 'dr_203',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-12',
    dayOfWeek: 'Wednesday',
    weekNumber: 2,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Database Schema Migration & API Endpoints Setup',
    tasksCompleted: 'Drafted MongoDB schema definitions and created Express route handlers for assessment records.',
    skillsAcquired: 'Backend REST API architecture',
    hoursWorked: 8,
    equipmentOrTools: 'Node.js, Express, MongoDB',
    submittedAt: '2026-08-12T16:40:00Z',
    status: 'reviewed',
    feedback: 'Good schema structure.',
    locationVerified: true,
  },
  {
    id: 'dr_205',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-14',
    dayOfWeek: 'Friday',
    weekNumber: 2,
    monthNumber: 1,
    monthName: 'Month 1 (August 2026)',
    title: 'Weekly Attachment Review & Code Refactoring',
    tasksCompleted: 'Refactored backend validation middleware and resolved lint warnings.',
    skillsAcquired: 'Code optimization and unit testing',
    hoursWorked: 8,
    equipmentOrTools: 'Jest, TypeScript',
    submittedAt: '2026-08-14T17:30:00Z',
    status: 'reviewed',
    feedback: 'Please make sure to submit Thursday daily report on time.',
    locationVerified: true,
  },
];

const initialMissingDailyReports: MissingDailyReport[] = [
  {
    id: 'miss_001',
    studentId: 'student1',
    studentName: 'John Doe',
    date: '2026-08-13',
    dayOfWeek: 'Thursday',
    weekNumber: 2,
    monthNumber: 1,
    status: 'missing',
  },
  {
    id: 'miss_002',
    studentId: 'student2',
    studentName: 'Jane Smith',
    date: '2026-08-12',
    dayOfWeek: 'Wednesday',
    weekNumber: 2,
    monthNumber: 1,
    status: 'missing',
  },
  {
    id: 'miss_003',
    studentId: 'student2',
    studentName: 'Jane Smith',
    date: '2026-08-13',
    dayOfWeek: 'Thursday',
    weekNumber: 2,
    monthNumber: 1,
    status: 'missing',
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [supervisors, setSupervisors] = useState<Supervisor[]>(initialSupervisors);
  const [assumptionSubmissions, setAssumptionSubmissions] = useState<AssumptionSubmission[]>(initialAssumptions);
  const [attachmentLetterSubmissions, setAttachmentLetterSubmissions] = useState<AttachmentLetterSubmission[]>(initialAttachmentLetters);
  const [locations, setLocations] = useState<AssignedLocation[]>(initialLocations);
  const [dailyCheckIns, setDailyCheckIns] = useState<DailyLocationCheckIn[]>(initialDailyCheckIns);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(initialDailyReports);
  const [missingDailyReports, setMissingDailyReports] = useState<MissingDailyReport[]>(initialMissingDailyReports);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const fetchedReports = await fetchApi('/reports');
        if (Array.isArray(fetchedReports) && fetchedReports.length > 0) {
          setReports(fetchedReports);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
 
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    
    const userRecord = user as unknown as Record<string, unknown>;
    const userId = (userRecord._id || user.id) as string;
    socket.emit('join_room', userId);

    socket.on('new_notification', (notification: Notification) => {
      const notifRecord = notification as unknown as Record<string, unknown>;
      const newNotif = {
        ...notification,
        id: (notifRecord._id || notification.id || `notif${Date.now()}`) as string
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      
      toast(newNotif.title, {
        description: newNotif.message,
      });

      if (newNotif.type === 'report_submitted' || newNotif.type === 'report_graded' || newNotif.type === 'report_reviewed') {
        fetchApi('/reports')
          .then(data => setReports(data))
          .catch(err => console.error('Error fetching reports after socket event:', err));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const addReport = async (report: Omit<Report, 'id' | 'submittedDate' | 'status'>) => {
    try {
      // Find matching student to stamp current level
      const matchingStudent = students.find(s => s.id === report.studentId || s.email === user?.email);
      const studentLevel = report.level || matchingStudent?.currentLevel || 1;

      let newReport: Report;
      try {
        newReport = await fetchApi('/reports', {
          method: 'POST',
          body: JSON.stringify({ ...report, level: studentLevel }),
        });
      } catch {
        // Mock fallback if offline/no backend
        newReport = {
          ...report,
          id: `rep${Date.now()}`,
          submittedDate: new Date().toISOString().split('T')[0],
          status: 'pending',
          level: studentLevel,
        };
      }
      
      setReports(prev => [newReport, ...prev]);
      
      const newNotif: Notification = {
        id: `notif${Date.now()}`,
        userId: user?.id || report.studentId,
        title: 'Report Submitted',
        message: `Your report "${report.title}" (Level ${studentLevel}00) has been uploaded successfully.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    } catch (error) {
      console.error('Error adding report:', error);
      throw error;
    }
  };

  const updateReport = (id: string, updates: Partial<Report>) => {
    setReports(reports.map(r => (r.id === id ? { ...r, ...updates } : r)));

    if (updates.feedback || updates.grade !== undefined) {
      const report = reports.find(r => r.id === id);
      if (report) {
        const newNotif: Notification = {
          id: `notif${Date.now()}`,
          userId: report.studentId,
          title: updates.grade !== undefined ? 'Report Graded' : 'Feedback Received',
          message:
            updates.grade !== undefined
              ? `Your report "${report.title}" has been graded. Score: ${updates.grade}/100`
              : `New feedback on "${report.title}"`,
          type: updates.grade !== undefined ? 'assessment' : 'feedback',
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [...prev, newNotif]);
      }
    }
  };

  const addAssessment = (assessment: Omit<Assessment, 'id' | 'assessedDate'>) => {
    const newAssessment: Assessment = {
      ...assessment,
      id: `assess${Date.now()}`,
      assessedDate: new Date().toISOString().split('T')[0],
    };
    setAssessments([...assessments, newAssessment]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const assignSupervisor = (studentId: string, supervisorId: string) => {
    setStudents(
      students.map(s => (s.id === studentId ? { ...s, supervisorId } : s))
    );
    setSupervisors(
      supervisors.map(sup =>
        sup.id === supervisorId
          ? { ...sup, assignedStudents: [...sup.assignedStudents, studentId] }
          : sup
      )
    );

    const newNotif: Notification = {
      id: `notif${Date.now()}`,
      userId: studentId,
      title: 'Supervisor Assigned',
      message: `A supervisor has been assigned to your industrial attachment`,
      type: 'assignment',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [...prev, newNotif]);
  };

  const addStudent = (student: Omit<Student, 'id' | 'progress'>) => {
    const newStudent: Student = {
      ...student,
      id: `student${Date.now()}`,
      progress: 0,
      currentLevel: student.currentLevel || 1,
    };
    setStudents([...students, newStudent]);
  };

  const removeUser = (userId: string) => {
    setStudents(students.filter(s => s.id !== userId));
    setSupervisors(supervisors.filter(s => s.id !== userId));
  };

  const submitAssumptionForm = (data: Omit<AssumptionSubmission, 'id' | 'submittedAt' | 'status'>) => {
    const newSubmission: AssumptionSubmission = {
      ...data,
      id: `assumption${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    setAssumptionSubmissions(prev => [newSubmission, ...prev]);
    
    const newNotif: Notification = {
      id: `notif${Date.now()}`,
      userId: data.studentId,
      title: 'Assumption Form Submitted',
      message: 'Your assumption of duty form has been sent to the liaison office.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateAssumptionStatus = (id: string, status: AssumptionSubmission['status']) => {
    setAssumptionSubmissions(prev =>
      prev.map(a => (a.id === id ? { ...a, status } : a))
    );
  };

  const submitAttachmentLetter = (data: Omit<AttachmentLetterSubmission, 'id' | 'submittedAt' | 'status'>) => {
    const newSubmission: AttachmentLetterSubmission = {
      ...data,
      id: `letter${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    setAttachmentLetterSubmissions(prev => [newSubmission, ...prev]);

    const newNotif: Notification = {
      id: `notif${Date.now()}`,
      userId: data.studentId,
      title: 'Attachment Letter Requested',
      message: `Your introductory letter request for ${data.companyName} has been submitted.`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateAttachmentLetterStatus = (id: string, status: AttachmentLetterSubmission['status']) => {
    setAttachmentLetterSubmissions(prev =>
      prev.map(l => (l.id === id ? { ...l, status } : l))
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Location Allocation & Monitoring Handlers
  // ═══════════════════════════════════════════════════════════

  const addLocation = (locData: Omit<AssignedLocation, 'id' | 'createdAt'>) => {
    const newLocation: AssignedLocation = {
      ...locData,
      id: `loc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLocations(prev => [newLocation, ...prev]);
    toast.success(`Location "${newLocation.name}" added successfully`);
  };

  const updateLocation = (id: string, updates: Partial<AssignedLocation>) => {
    setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, ...updates } : loc));
    
    // Also update any students currently assigned to this location
    setStudents(prev => prev.map(st => {
      if (st.assignedLocationId === id) {
        return {
          ...st,
          assignedLocationName: updates.name || st.assignedLocationName,
          assignedLocationAddress: updates.address || st.assignedLocationAddress,
          assignedLocationZone: updates.zone || st.assignedLocationZone,
          assignedLocationCity: updates.city || st.assignedLocationCity,
        };
      }
      return st;
    }));
    toast.success('Location updated successfully');
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    // Clear assignment from students
    setStudents(prev => prev.map(st => st.assignedLocationId === id ? {
      ...st,
      assignedLocationId: undefined,
      assignedLocationName: undefined,
      assignedLocationAddress: undefined,
      assignedLocationZone: undefined,
      assignedLocationCity: undefined,
    } : st));
    toast.success('Location removed');
  };

  const assignStudentLocation = (studentId: string, locationId: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;

    setStudents(prev => prev.map(st => {
      if (st.id === studentId) {
        return {
          ...st,
          assignedLocationId: loc.id,
          assignedLocationName: loc.name,
          assignedLocationAddress: loc.address,
          assignedLocationZone: loc.zone,
          assignedLocationCity: loc.city,
        };
      }
      return st;
    }));

    // Send notification to student
    const newNotif: Notification = {
      id: `notif${Date.now()}`,
      userId: studentId,
      title: 'Attachment Location Allocated',
      message: `You have been allocated to "${loc.name}" (${loc.city}, ${loc.zone}).`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    toast.success(`Student allocated to ${loc.name}`);
  };

  const submitDailyLocationCheckIn = (checkInData: Omit<DailyLocationCheckIn, 'id' | 'timestamp'>) => {
    const newCheckIn: DailyLocationCheckIn = {
      ...checkInData,
      id: `chk-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setDailyCheckIns(prev => [newCheckIn, ...prev]);

    // Update student's daily location status
    setStudents(prev => prev.map(st => {
      if (st.id === checkInData.studentId) {
        return {
          ...st,
          dailyLocationStatus: checkInData.status === 'verified_on_site' ? 'on_site' : 'off_site',
          lastCheckInTime: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          lastCheckInAddress: checkInData.address,
        };
      }
      return st;
    }));

    toast.success('Daily location check-in recorded successfully!');
  };

  // ═══════════════════════════════════════════════════════════════
  // DAILY, WEEKLY, AND MONTHLY REPORTS HIERARCHY LOGIC
  // ═══════════════════════════════════════════════════════════════

  const addDailyReport = (reportData: Omit<DailyReport, 'id' | 'submittedAt' | 'status'>) => {
    const newDaily: DailyReport = {
      ...reportData,
      id: `dr_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      locationVerified: true,
    };

    setDailyReports(prev => [newDaily, ...prev]);

    // If this date was marked as missing, remove it from missing list
    setMissingDailyReports(prev => prev.filter(m => !(m.studentId === reportData.studentId && m.date === reportData.date)));

    // Send supervisor notification
    const student = students.find(s => s.id === reportData.studentId);
    if (student?.supervisorId) {
      const newNotif: Notification = {
        id: `notif${Date.now()}`,
        userId: student.supervisorId,
        title: 'New Daily Report Submitted',
        message: `${reportData.studentName} submitted daily report for ${reportData.dayOfWeek} (${reportData.date}).`,
        type: 'report_submitted',
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    toast.success(`Daily report for ${reportData.dayOfWeek} logged & aggregated into Week ${reportData.weekNumber} update!`);
  };

  const reviewDailyReport = (id: string, feedback: string, grade?: number) => {
    setDailyReports(prev => prev.map(dr => {
      if (dr.id === id) {
        return {
          ...dr,
          feedback,
          grade,
          status: grade !== undefined ? 'graded' : 'reviewed',
        };
      }
      return dr;
    }));

    toast.success('Daily report feedback saved successfully!');
  };

  // Dynamically compute Weekly Updates aggregated from Daily Reports
  const weeklyUpdates: WeeklyReportUpdate[] = (() => {
    const updates: WeeklyReportUpdate[] = [];

    students.forEach(student => {
      const studentDaily = dailyReports.filter(d => d.studentId === student.id);
      const studentMissing = missingDailyReports.filter(m => m.studentId === student.id);

      // Determine active weeks (e.g. 1 to 4)
      const weekNumbers = Array.from(new Set([...studentDaily.map(d => d.weekNumber), 1, 2]));

      weekNumbers.forEach(weekNum => {
        const weekDailies = studentDaily.filter(d => d.weekNumber === weekNum);
        const weekMissing = studentMissing.filter(m => m.weekNumber === weekNum);
        const totalHours = weekDailies.reduce((acc, d) => acc + (d.hoursWorked || 0), 0);
        const gradedDailies = weekDailies.filter(d => d.grade !== undefined);
        const avgGrade = gradedDailies.length > 0
          ? Math.round(gradedDailies.reduce((acc, d) => acc + (d.grade || 0), 0) / gradedDailies.length)
          : undefined;

        const summaryTasks = weekDailies.map(d => d.title).join('; ');

        updates.push({
          id: `wk_${student.id}_${weekNum}`,
          studentId: student.id,
          weekNumber: weekNum,
          monthNumber: weekDailies[0]?.monthNumber || 1,
          startDate: `2026-08-${weekNum === 1 ? '03' : '10'}`,
          endDate: `2026-08-${weekNum === 1 ? '07' : '14'}`,
          dailyReports: weekDailies,
          missingDaysCount: weekMissing.length,
          submittedDaysCount: weekDailies.length,
          totalHoursWorked: totalHours,
          summaryHighlights: summaryTasks || 'Active weekly industrial rotation tasks.',
          status: weekMissing.length === 0 && weekDailies.length >= 5 ? 'complete' : 'incomplete',
          overallGrade: avgGrade,
          supervisorFeedback: weekMissing.length > 0 ? `${weekMissing.length} daily report(s) missing for this week.` : 'All required daily reports submitted.',
        });
      });
    });

    return updates;
  })();

  // Dynamically compute Monthly Reports aggregated from Weekly Updates
  const monthlyReports: MonthlyReport[] = (() => {
    const months: MonthlyReport[] = [];

    students.forEach(student => {
      const studentWeeks = weeklyUpdates.filter(w => w.studentId === student.id);
      const studentDailies = dailyReports.filter(d => d.studentId === student.id);
      const studentMissing = missingDailyReports.filter(m => m.studentId === student.id);

      const totalSubmitted = studentDailies.length;
      const totalMissing = studentMissing.length;
      const totalHours = studentDailies.reduce((acc, d) => acc + (d.hoursWorked || 0), 0);
      const expectedDays = totalSubmitted + totalMissing || 10;
      const compliance = Math.round((totalSubmitted / Math.max(expectedDays, 1)) * 100);

      const gradedWeeks = studentWeeks.filter(w => w.overallGrade !== undefined);
      const monthlyAvg = gradedWeeks.length > 0
        ? Math.round(gradedWeeks.reduce((acc, w) => acc + (w.overallGrade || 0), 0) / gradedWeeks.length)
        : undefined;

      months.push({
        id: `mo_${student.id}_1`,
        studentId: student.id,
        monthNumber: 1,
        monthName: 'Month 1 (August 2026)',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        weeks: studentWeeks,
        totalDailyReportsSubmitted: totalSubmitted,
        totalDailyReportsMissing: totalMissing,
        totalHoursLogged: totalHours,
        complianceRate: compliance,
        executiveSummary: `Cumulative industrial progress across ${studentWeeks.length} weeks. Completed ${totalHours} logged on-site hours with a ${compliance}% daily submission compliance rate.`,
        status: totalMissing === 0 ? 'approved' : 'reviewed',
        overallGrade: monthlyAvg,
        supervisorComments: totalMissing > 0
          ? `Attention required: ${totalMissing} daily submission(s) flagged as missing.`
          : 'Outstanding daily diligence and comprehensive weekly updates.',
      });
    });

    return months;
  })();

  return (
    <DataContext.Provider
      value={{
        reports,
        assessments,
        notifications,
        students,
        supervisors,
        assumptionSubmissions,
        attachmentLetterSubmissions,
        locations,
        dailyCheckIns,
        dailyReports,
        weeklyUpdates,
        monthlyReports,
        missingDailyReports,
        addReport,
        updateReport,
        addAssessment,
        markNotificationAsRead,
        assignSupervisor,
        addStudent,
        removeUser,
        submitAssumptionForm,
        updateAssumptionStatus,
        submitAttachmentLetter,
        updateAttachmentLetterStatus,
        addLocation,
        updateLocation,
        deleteLocation,
        assignStudentLocation,
        submitDailyLocationCheckIn,
        addDailyReport,
        reviewDailyReport,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
