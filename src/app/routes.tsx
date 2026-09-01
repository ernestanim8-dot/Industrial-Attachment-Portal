import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { StudentGrades } from './pages/StudentGrades';
import { StudentProgressPage } from './pages/StudentProgressPage';
import { YourReportsUploaded } from './pages/YourReportsUploaded';
import { DailyReportLogPage } from './pages/DailyReportLogPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentServicePage } from './pages/StudentServicePage';
import { SupervisorDashboard } from './pages/SupervisorDashboard';
import { SupervisorLocationsPage } from './pages/SupervisorLocationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/student/your-reports-uploaded',
    element: (
      <ProtectedRoute allowedRoles={['student', 'supervisor', 'admin']}>
        <YourReportsUploaded />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor/your-reports-uploaded',
    element: (
      <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
        <YourReportsUploaded />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/uploaded-reports',
    element: (
      <ProtectedRoute allowedRoles={['student', 'supervisor', 'admin']}>
        <DailyReportLogPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/daily-report-log',
    element: (
      <ProtectedRoute allowedRoles={['student', 'supervisor', 'admin']}>
        <DailyReportLogPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor/locations',
    element: (
      <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
        <SupervisorLocationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/progress',
    element: (
      <ProtectedRoute allowedRoles={['student', 'supervisor', 'admin']}>
        <StudentProgressPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/grades',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentGrades />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/services/:serviceKey',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentServicePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor',
    element: (
      <ProtectedRoute allowedRoles={['supervisor']}>
        <SupervisorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);