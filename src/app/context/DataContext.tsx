import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import {
  Report, Assessment, Notification, Student, Supervisor,
  AssumptionSubmission, AttachmentLetterSubmission,
  AssignedLocation, DailyLocationCheckIn,
  DailyReport, WeeklyReportUpdate, MonthlyReport, MissingDailyReport, ActivityItem
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
  addDailyReport: (report: Omit<DailyReport, 'id' | 'submittedAt'>) => void;
  reviewDailyReport: (id: string, feedback: string, grade?: number) => void;
  addWeeklyReport: (report: Omit<WeeklyReportUpdate, 'id'>) => void;
  addMonthlyReport: (report: Omit<MonthlyReport, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock initial data
const initialStudents: Student[] = [
  {
    id: 'student1',
    email: 'john.student@ttu.edu.gh',
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
    email: 'jane.student@ttu.edu.gh',
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
    studentRegNo: 'BC/GRD/22/012',
    studentPhone: '0502310663',
    department: 'Bachelor of Technology in Graphic Design',
    academicLevel: 3,
    submittedAt: '2026-01-14T10:00:00Z',
    status: 'submitted',
    companyName: 'Tech Corp Ltd',
    companyTown: 'Accra',
    companyAddress: '12 Independence Avenue, Ridge, Accra',
    letterAddressedTo: 'THE MANAGER',
    startDate: '2026-01-15',
    endDate: '2026-06-15',
    studentSignature: 'John Doe',
    refNumber: 'TTU/IL/AL/2026/001',
    pdfGeneratedAt: '2026-01-14T10:05:00Z',
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


const WORK_DAYS = [1, 2, 3, 4, 5];

const getWeekNumberFromDate = (dateString: string): number => {
  const date = new Date(`${dateString}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
};

const getMonthNameFromDate = (dateString: string): string => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const getWeekRange = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const buildWeeklyUpdates = (dailyReports: DailyReport[], missingReports: MissingDailyReport[]): WeeklyReportUpdate[] => {
  const grouped = new Map<string, { studentId: string; weekNumber: number; monthNumber: number; dates: string[]; dailyReports: DailyReport[]; missing: MissingDailyReport[] }>();

  dailyReports.forEach(report => {
    const monthNum = report.monthNumber || (report.date ? new Date(`${report.date}T00:00:00`).getMonth() + 1 : 1);
    const key = `${report.studentId}-${report.weekNumber}`;
    const group = grouped.get(key) || { studentId: report.studentId, weekNumber: report.weekNumber, monthNumber: monthNum, dates: [], dailyReports: [], missing: [] };
    group.dailyReports.push(report);
    group.dates.push(report.date);
    grouped.set(key, group);
  });

  missingReports.forEach(report => {
    const monthNum = report.monthNumber || (report.date ? new Date(`${report.date}T00:00:00`).getMonth() + 1 : 1);
    const key = `${report.studentId}-${report.weekNumber}`;
    const group = grouped.get(key) || { studentId: report.studentId, weekNumber: report.weekNumber, monthNumber: monthNum, dates: [], dailyReports: [], missing: [] };
    group.missing.push(report);
    group.dates.push(report.date);
    grouped.set(key, group);
  });

  return Array.from(grouped.values()).map(group => {
    const sortedDates = group.dates.sort();
    const range = sortedDates.length > 0 ? getWeekRange(sortedDates[0]) : { startDate: '', endDate: '' };
    const submittedDaysCount = group.dailyReports.length;
    const missingDaysCount = group.missing.length;
    const totalHoursWorked = group.dailyReports.reduce((total, report) => total + report.hoursWorked, 0);

    // Collect all activities from daily reports in this week
    const allActivities: ActivityItem[] = [];
    group.dailyReports.forEach(report => {
      if (report.activities && report.activities.length > 0) {
        report.activities.forEach(act => allActivities.push(act));
      } else if (report.title) {
        allActivities.push({ title: report.title, description: report.tasksCompleted });
      }
    });

    const summaryHighlights = allActivities.length > 0
      ? allActivities.map((act, idx) => `Activity ${idx + 1}: ${act.title}`).join('; ')
      : (submittedDaysCount > 0 ? group.dailyReports.map(report => report.title).join('; ') : 'No daily reports submitted for this week.');

    return {
      id: `wk-${group.studentId}-${group.weekNumber}`,
      studentId: group.studentId,
      weekNumber: group.weekNumber,
      monthNumber: group.monthNumber,
      startDate: range.startDate,
      endDate: range.endDate,
      dailyReports: group.dailyReports.sort((a, b) => a.date.localeCompare(b.date)),
      activities: allActivities,
      missingDaysCount,
      submittedDaysCount,
      totalHoursWorked,
      summaryHighlights,
      status: (missingDaysCount === 0 && submittedDaysCount >= 5 ? 'complete' : 'incomplete') as 'complete' | 'incomplete',
    };
  }).sort((a, b) => a.weekNumber - b.weekNumber);
};

const buildMonthlyReports = (weeklyUpdates: WeeklyReportUpdate[]): MonthlyReport[] => {
  const grouped = new Map<string, WeeklyReportUpdate[]>();
  weeklyUpdates.forEach(week => {
    const monthNum = week.monthNumber || Math.ceil(week.weekNumber / 4) || 1;
    const key = `${week.studentId}-${monthNum}`;
    grouped.set(key, [...(grouped.get(key) || []), week]);
  });

  return Array.from(grouped.entries()).map(([key, weeks]) => {
    const [studentId, monthNumberText] = key.split('-');
    const submitted = weeks.reduce((total, week) => total + week.submittedDaysCount, 0);
    const missing = weeks.reduce((total, week) => total + week.missingDaysCount, 0);
    const totalExpected = submitted + missing;
    const sortedWeeks = weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    // Extract activity summaries per week for this month
    const weeklyActivitySummaries = sortedWeeks.map(w => {
      const acts = w.activities && w.activities.length > 0
        ? w.activities.map((a, i) => `Activity ${i + 1}: ${a.title}`).join(', ')
        : w.summaryHighlights;
      return `Week ${w.weekNumber}: [${acts}]`;
    });

    const executiveSummary = weeklyActivitySummaries.length > 0
      ? `${submitted} daily reports logged across ${weeks.length} weekly updates (${weeklyActivitySummaries.join(' • ')}).`
      : `${submitted} daily reports submitted across ${weeks.length} weekly updates, with ${missing} missing daily reports recorded.`;

    return {
      id: `mo-${key}`,
      studentId,
      monthNumber: Number(monthNumberText),
      monthName: sortedWeeks[0]?.startDate ? getMonthNameFromDate(sortedWeeks[0].startDate) : `Month ${monthNumberText}`,
      startDate: sortedWeeks[0]?.startDate || '',
      endDate: sortedWeeks[sortedWeeks.length - 1]?.endDate || '',
      weeks: sortedWeeks,
      totalDailyReportsSubmitted: submitted,
      totalDailyReportsMissing: missing,
      totalHoursLogged: weeks.reduce((total, week) => total + week.totalHoursWorked, 0),
      complianceRate: totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0,
      executiveSummary,
      status: 'generated' as const,
    };
  }).sort((a, b) => a.monthNumber - b.monthNumber);
};

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
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay() || 7;
    startOfWeek.setDate(today.getDate() - day + 1);

    const generatedMissing: MissingDailyReport[] = [];
    students.forEach(student => {
      for (let d = new Date(startOfWeek); d < today; d.setDate(d.getDate() + 1)) {
        if (!WORK_DAYS.includes(d.getDay())) continue;
        const date = d.toISOString().split('T')[0];
        const alreadySubmitted = dailyReports.some(report => report.studentId === student.id && report.date === date);
        const alreadyMissing = missingDailyReports.some(report => report.studentId === student.id && report.date === date);
        if (alreadySubmitted || alreadyMissing) continue;

        generatedMissing.push({
          id: `miss-${student.id}-${date}`,
          studentId: student.id,
          studentName: student.name,
          date,
          dayOfWeek: d.toLocaleDateString('default', { weekday: 'long' }),
          weekNumber: getWeekNumberFromDate(date),
          monthNumber: d.getMonth() + 1,
          status: 'missing',
        });
      }
    });

    if (generatedMissing.length > 0) {
      setMissingDailyReports(prev => [...generatedMissing, ...prev]);
    }
  }, [students, dailyReports, missingDailyReports]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [
          fetchedReports,
          fetchedAssumptions,
          fetchedLetters,
          fetchedLocations,
          fetchedCheckIns,
          fetchedDailyReports,
          fetchedNotifications,
        ] = await Promise.allSettled([
          fetchApi('/reports'),
          fetchApi('/assumptions'),
          fetchApi('/attachment-letters'),
          fetchApi('/locations'),
          fetchApi('/locations/check-ins'),
          fetchApi('/daily-reports'),
          fetchApi('/notifications'),
        ]);

        if (fetchedReports.status === 'fulfilled' && Array.isArray(fetchedReports.value) && fetchedReports.value.length > 0) {
          setReports(fetchedReports.value.map((r: Report & { _id?: string }) => ({ ...r, id: r._id || r.id })));
        }
        if (fetchedAssumptions.status === 'fulfilled' && Array.isArray(fetchedAssumptions.value) && fetchedAssumptions.value.length > 0) {
          setAssumptionSubmissions(fetchedAssumptions.value.map((a: AssumptionSubmission & { _id?: string }) => ({ ...a, id: a._id || a.id })));
        }
        if (fetchedLetters.status === 'fulfilled' && Array.isArray(fetchedLetters.value) && fetchedLetters.value.length > 0) {
          setAttachmentLetterSubmissions(fetchedLetters.value.map((l: AttachmentLetterSubmission & { _id?: string }) => ({ ...l, id: l._id || l.id })));
        }
        if (fetchedLocations.status === 'fulfilled' && Array.isArray(fetchedLocations.value) && fetchedLocations.value.length > 0) {
          setLocations(fetchedLocations.value.map((loc: AssignedLocation & { _id?: string }) => ({ ...loc, id: loc._id || loc.id })));
        }
        if (fetchedCheckIns.status === 'fulfilled' && Array.isArray(fetchedCheckIns.value) && fetchedCheckIns.value.length > 0) {
          setDailyCheckIns(fetchedCheckIns.value.map((c: DailyLocationCheckIn & { _id?: string }) => ({ ...c, id: c._id || c.id })));
        }
        if (fetchedDailyReports.status === 'fulfilled' && Array.isArray(fetchedDailyReports.value) && fetchedDailyReports.value.length > 0) {
          setDailyReports(fetchedDailyReports.value.map((d: DailyReport & { _id?: string }) => ({ ...d, id: d._id || d.id })));
        }
        if (fetchedNotifications.status === 'fulfilled' && Array.isArray(fetchedNotifications.value) && fetchedNotifications.value.length > 0) {
          setNotifications(fetchedNotifications.value.map((n: Notification & { _id?: string }) => ({ ...n, id: n._id || n.id })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

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

  const addAssessment = async (assessment: Omit<Assessment, 'id' | 'assessedDate'>) => {
    let newAssessment: Assessment;
    try {
      const created = await fetchApi('/assessments', {
        method: 'POST',
        body: JSON.stringify(assessment),
      });
      newAssessment = {
        ...created,
        id: created._id || created.id,
        assessedDate: created.createdAt ? new Date(created.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    } catch {
      newAssessment = {
        ...assessment,
        id: `assess${Date.now()}`,
        assessedDate: new Date().toISOString().split('T')[0],
      };
    }
    setAssessments(prev => [...prev, newAssessment]);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
    } catch {
      // Ignored for offline
    }
  };

  const assignSupervisor = async (studentId: string, supervisorId: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, supervisorId } : s))
    );
    setSupervisors(prev =>
      prev.map(sup =>
        sup.id === supervisorId
          ? { ...sup, assignedStudents: [...sup.assignedStudents, studentId] }
          : sup
      )
    );

    try {
      await fetchApi(`/users/${studentId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ supervisorId }),
      });
    } catch {
      // Offline fallback
    }

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
    setStudents(prev => [...prev, newStudent]);
  };

  const removeUser = async (userId: string) => {
    setStudents(prev => prev.filter(s => s.id !== userId));
    setSupervisors(prev => prev.filter(s => s.id !== userId));
    try {
      await fetchApi(`/users/${userId}`, { method: 'DELETE' });
    } catch {
      // Offline fallback
    }
  };

  const submitAssumptionForm = async (data: Omit<AssumptionSubmission, 'id' | 'submittedAt' | 'status'>) => {
    let newSubmission: AssumptionSubmission;
    try {
      const created = await fetchApi('/assumptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      newSubmission = {
        ...created,
        id: created._id || created.id,
      };
    } catch {
      newSubmission = {
        ...data,
        id: `assumption${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };
    }

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

  const updateAssumptionStatus = async (id: string, status: AssumptionSubmission['status']) => {
    setAssumptionSubmissions(prev =>
      prev.map(a => (a.id === id ? { ...a, status } : a))
    );
    try {
      await fetchApi(`/assumptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      // Offline fallback
    }
  };

  const submitAttachmentLetter = async (data: Omit<AttachmentLetterSubmission, 'id' | 'submittedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const refNumber = data.refNumber || `TTU/IL/AL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`;
    let newSubmission: AttachmentLetterSubmission;
    try {
      const created = await fetchApi('/attachment-letters', {
        method: 'POST',
        body: JSON.stringify({ ...data, refNumber }),
      });
      newSubmission = {
        ...created,
        id: created._id || created.id,
        status: 'submitted',
        pdfGeneratedAt: now,
        refNumber,
      };
    } catch {
      newSubmission = {
        ...data,
        id: `letter${Date.now()}`,
        submittedAt: now,
        status: 'submitted',
        pdfGeneratedAt: now,
        refNumber,
      };
    }

    setAttachmentLetterSubmissions(prev => [newSubmission, ...prev]);

    const newNotif: Notification = {
      id: `notif${Date.now()}`,
      userId: data.studentId,
      title: 'Attachment Letter Submitted',
      message: `Your Attachment Letter for ${data.companyName} has been submitted electronically to the Industrial Liaison Office. Your PDF is ready for download.`,
      type: 'info',
      read: false,
      createdAt: now,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateAttachmentLetterStatus = async (id: string, status: AttachmentLetterSubmission['status'], verifiedBy?: string) => {
    const now = new Date().toISOString();
    setAttachmentLetterSubmissions(prev =>
      prev.map(l =>
        l.id === id
          ? {
              ...l,
              status,
              ...(status === 'verified' || status === 'approved' ? { verifiedAt: now, verifiedBy: verifiedBy || 'Industrial Liaison Office' } : {}),
              ...(status === 'submitted' ? { pdfGeneratedAt: now } : {}),
            }
          : l
      )
    );
    try {
      await fetchApi(`/attachment-letters/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, verifiedBy }),
      });
    } catch {
      // Offline fallback
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Location Allocation & Monitoring Handlers
  // ═══════════════════════════════════════════════════════════

  const addLocation = async (locData: Omit<AssignedLocation, 'id' | 'createdAt'>) => {
    let newLocation: AssignedLocation;
    try {
      const created = await fetchApi('/locations', {
        method: 'POST',
        body: JSON.stringify(locData),
      });
      newLocation = {
        ...created,
        id: created._id || created.id,
      };
    } catch {
      newLocation = {
        ...locData,
        id: `loc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }

    setLocations(prev => [newLocation, ...prev]);
    toast.success(`Location "${newLocation.name}" added successfully`);
  };

  const updateLocation = async (id: string, updates: Partial<AssignedLocation>) => {
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

    try {
      await fetchApi(`/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      // Offline fallback
    }

    toast.success('Location updated successfully');
  };

  const deleteLocation = async (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setStudents(prev => prev.map(st => st.assignedLocationId === id ? {
      ...st,
      assignedLocationId: undefined,
      assignedLocationName: undefined,
      assignedLocationAddress: undefined,
      assignedLocationZone: undefined,
      assignedLocationCity: undefined,
    } : st));

    try {
      await fetchApi(`/locations/${id}`, { method: 'DELETE' });
    } catch {
      // Offline fallback
    }

    toast.success('Location removed');
  };

  const assignStudentLocation = async (studentId: string, locationId: string) => {
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

    try {
      await fetchApi('/locations/assign', {
        method: 'POST',
        body: JSON.stringify({ studentId, locationId }),
      });
    } catch {
      // Offline fallback
    }

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

  const submitDailyLocationCheckIn = async (checkInData: Omit<DailyLocationCheckIn, 'id' | 'timestamp'>) => {
    let newCheckIn: DailyLocationCheckIn;
    try {
      const created = await fetchApi('/locations/check-in', {
        method: 'POST',
        body: JSON.stringify(checkInData),
      });
      newCheckIn = {
        ...created,
        id: created._id || created.id,
      };
    } catch {
      newCheckIn = {
        ...checkInData,
        id: `chk-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }

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

  const addDailyReport = async (reportData: Omit<DailyReport, 'id' | 'submittedAt'>) => {
    let newDaily: DailyReport;
    try {
      const created = await fetchApi('/daily-reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
      newDaily = {
        ...created,
        id: created._id || created.id,
      };
    } catch {
      newDaily = {
        ...reportData,
        id: `dr_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: reportData.status || 'submitted',
        locationVerified: true,
      };
    }

    setDailyReports(prev => [newDaily, ...prev]);

    // If this date was marked as missing, remove it from missing list
    setMissingDailyReports(prev => prev.map(m =>
      m.studentId === reportData.studentId && m.date === reportData.date
        ? { ...m, status: 'late_submitted' }
        : m
    ));

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

    toast.success(`Daily report for ${reportData.dayOfWeek} submitted!`);
  };

  const addWeeklyReport = () => {
    toast.info('Weekly updates are generated automatically from submitted and missing daily reports.');
  };

  const addMonthlyReport = () => {
    toast.info('Monthly reports are generated automatically from weekly updates.');
  };

  const reviewDailyReport = async (id: string, feedback: string, grade?: number) => {
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

    try {
      await fetchApi(`/daily-reports/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ feedback, grade }),
      });
    } catch {
      // Offline fallback
    }

    toast.success('Daily report feedback saved successfully!');
  };

  const weeklyUpdates = buildWeeklyUpdates(dailyReports, missingDailyReports);
  const monthlyReports = buildMonthlyReports(weeklyUpdates);

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
        addWeeklyReport,
        addMonthlyReport,
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





