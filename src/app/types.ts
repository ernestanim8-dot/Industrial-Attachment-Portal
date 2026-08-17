// Core types for the Industrial Attachment Portal

export type UserRole = 'student' | 'supervisor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  avatarUrl?: string;
}

export interface LevelProjectReport {
  id: string;
  title: string;
  submittedDate: string;
  weekNumber?: number;
  grade?: number;
  status: 'pending' | 'reviewed' | 'graded';
  feedback?: string;
}

export interface LevelProject {
  id: string;
  level: number; // 1, 2, 3, 4
  levelName: string; // e.g. "Level 100", "Level 200", "Level 300", "Level 400"
  projectTitle: string;
  description: string;
  companyOrHost: string;
  academicYear: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  progressPercentage: number;
  reportsCount: number;
  reports?: LevelProjectReport[];
  finalGrade?: number;
  remark?: 'Good' | 'Average' | 'Bad' | string;
  startDate?: string;
  endDate?: string;
}

export interface AssignedLocation {
  id: string;
  name: string;
  zone: string;
  city: string;
  address: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}

export interface DailyLocationCheckIn {
  id: string;
  studentId: string;
  studentName?: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  status: 'verified_on_site' | 'flagged_off_site' | 'pending';
  distanceFromAssignedKm?: number;
  notes?: string;
}

export interface Student extends User {
  role: 'student';
  supervisorId?: string;
  company?: string;
  attachmentStartDate?: string;
  attachmentEndDate?: string;
  progress: number;
  currentLevel?: number; // e.g. 1, 2, 3, 4
  currentProjectTitle?: string;
  currentProjectDescription?: string;
  levelProjects?: LevelProject[];
  // Location Allocation & Monitoring
  assignedLocationId?: string;
  assignedLocationName?: string;
  assignedLocationAddress?: string;
  assignedLocationZone?: string;
  assignedLocationCity?: string;
  dailyLocationStatus?: 'on_site' | 'off_site' | 'not_checked_in';
  lastCheckInTime?: string;
  lastCheckInAddress?: string;
}

export interface Supervisor extends User {
  role: 'supervisor';
  department: string;
  assignedStudents: string[];
}

export interface DailyReport {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. "Monday"
  weekNumber: number;
  monthNumber: number;
  monthName: string;
  title: string;
  tasksCompleted: string;
  skillsAcquired?: string;
  challengesFaced?: string;
  hoursWorked: number;
  equipmentOrTools?: string;
  submittedAt: string;
  status: 'submitted' | 'reviewed' | 'graded' | 'missing';
  feedback?: string;
  grade?: number;
  locationVerified?: boolean;
}

export interface WeeklyReportUpdate {
  id: string;
  studentId: string;
  weekNumber: number;
  monthNumber: number;
  startDate: string;
  endDate: string;
  dailyReports: DailyReport[];
  missingDaysCount: number;
  submittedDaysCount: number; // e.g. 4/5
  totalHoursWorked: number;
  summaryHighlights: string;
  status: 'complete' | 'incomplete' | 'graded';
  overallGrade?: number;
  supervisorFeedback?: string;
}

export interface MonthlyReport {
  id: string;
  studentId: string;
  monthNumber: number;
  monthName: string;
  startDate: string;
  endDate: string;
  weeks: WeeklyReportUpdate[];
  totalDailyReportsSubmitted: number;
  totalDailyReportsMissing: number;
  totalHoursLogged: number;
  complianceRate: number; // % of expected work days
  executiveSummary: string;
  status: 'generated' | 'reviewed' | 'approved';
  overallGrade?: number;
  supervisorComments?: string;
}

export interface MissingDailyReport {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  dayOfWeek: string;
  weekNumber: number;
  monthNumber: number;
  status: 'missing' | 'excused' | 'late_submitted';
}

export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  submittedDate: string;
  weekNumber?: number;
  month?: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  status: 'pending' | 'reviewed' | 'graded';
  feedback?: string;
  grade?: number;
  level?: number; // 1, 2, 3, 4
  isFinalReport?: boolean;
  reportType?: 'daily' | 'weekly' | 'monthly' | 'level';
  dailyReportsCount?: number;
  missingDaysCount?: number;
}

export interface Assessment {
  id: string;
  reportId: string;
  studentId: string;
  supervisorId: string;
  attendance: number; // 0-100
  performance: number; // 0-100
  reportQuality: number; // 0-100
  professionalism: number; // 0-100
  overallGrade: number; // 0-100
  feedback: string;
  assessedDate: string;
}

export interface Notification {
  id: string;
  _id?: string; // Optional for compatibility with backend
  userId: string;
  recipientId?: string; // Optional for compatibility with backend
  title: string;
  message: string;
  type: 'report_submitted' | 'report_graded' | 'report_reviewed' | 'supervisor_assigned' | 'system' | 'assessment' | 'deadline' | 'assignment' | 'info' | 'feedback';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AssumptionSubmission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  // Company Information
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyZone: string;
  companyLocation: string;
  companyAddress: string;
  companySupervisor: string;
  letterAddressedTo: string;
  companyTown: string;
  dateOfCommencement: string;
  supervisorPhone: string;
  // Agreement
  studentSignature: string;
}

export interface AttachmentLetterSubmission {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  // Company Information
  companyName: string;
  companyTown: string;
  letterAddressedTo: string;
  // Agreement
  studentSignature: string;
}

export interface DailyLocation {
  id: string;
  studentId: string;
  timestamp: string; // ISO string
  latitude: number;
  longitude: number;
  address?: string;
}
