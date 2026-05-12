# Technical Documentation - TTU Industrial Attachment Portal

## System Architecture

### Technology Stack

**Frontend:**

- React 18.3.1
- TypeScript
- Tailwind CSS v4
- React Router v7 (Data Mode)

**UI Components:**

- Radix UI (Accessible component primitives)
- Lucide React (Icons)
- Recharts (Data visualization)
- Sonner (Toast notifications)

**State Management:**

- Context API (Authentication & Data)
- Local component state (useState)

**Form Handling:**

- React Hook Form v7.55.0
- Native HTML5 validation

**Date Handling:**

- date-fns v3.6.0
- react-day-picker v8.10.1

---

## Project Structure

```text
src/app/
├── components/
│   ├── ui/                          # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── AnalyticsDashboard.tsx       # Charts and analytics
│   ├── BulkDownload.tsx             # Bulk download feature
│   ├── CalendarView.tsx             # Deadline calendar
│   ├── DashboardLayout.tsx          # Common layout wrapper
│   ├── DocumentPreview.tsx          # Document viewer
│   ├── ErrorBoundary.tsx            # Error handling
│   ├── NotificationCenter.tsx       # Notification panel
│   ├── PrintableReport.tsx          # Print templates
│   ├── ProgressTimeline.tsx         # Visual timeline
│   └── SearchFilter.tsx             # Search/filter component
├── context/
│   ├── AuthContext.tsx              # Authentication state
│   └── DataContext.tsx              # Application data
├── pages/
│   ├── AdminDashboard.tsx           # Admin interface
│   ├── Login.tsx                    # Login page
│   ├── StudentDashboard.tsx         # Student interface
│   └── SupervisorDashboard.tsx      # Supervisor interface
├── App.tsx                          # Root component
├── routes.tsx                       # Route configuration
└── types.ts                         # TypeScript definitions
```

---

## Component Documentation

### ErrorBoundary

**Purpose:** Catch and handle React component errors gracefully

**Usage:**

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Features:**

- Displays user-friendly error messages
- Shows error details in development
- Provides reset and navigation options
- Logs errors to console

---

### DashboardLayout

**Purpose:** Consistent layout for all dashboard pages

**Props:**

```tsx
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}
```

**Features:**

- Header with TTU branding
- User profile display
- Notification center integration
- Logout functionality
- Sticky navigation
- Footer with university information

---

### AnalyticsDashboard

**Purpose:** Comprehensive data visualization

**Features:**

- Performance trend line chart
- Report status pie chart
- Student performance bar chart
- Department distribution
- Summary statistics cards

**Data Sources:**

- reports (from DataContext)
- students (from DataContext)

**Charts:**

- Built with Recharts library
- Responsive containers
- Interactive tooltips
- Custom color schemes

---

### CalendarView

**Purpose:** Visual deadline and submission tracking

**Features:**

- Interactive calendar with react-day-picker
- Color-coded dates:
  - Green: Submitted
  - Yellow: Pending
  - Red: Overdue
- Event list for selected date
- Upcoming deadlines sidebar (next 7 days)
- Automatic deadline generation

**Date Calculation:**

- Uses date-fns for manipulation
- Generates weekly deadlines from attachment start date
- Calculates overdue submissions

---

### DocumentPreview

**Purpose:** In-app document viewing

**Props:**

```tsx
interface DocumentPreviewProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**

- Mock PDF preview with actual content
- Report metadata display
- Download functionality
- Responsive modal dialog
- Print-ready format

---

### BulkDownload

**Purpose:** Download multiple reports at once

**Props:**

```tsx
interface BulkDownloadProps {
  reports: Report[];
}
```

**Features:**

- Multi-select checkbox interface
- Select all/none functionality
- File size display
- Status filtering
- Progress indicator
- Mock ZIP creation (text file in demo)

**Implementation Notes:**

- Currently creates text file (demo)
- Production would use JSZip library
- Blob creation and download

---

### ProgressTimeline

**Purpose:** Visual student progress tracker

**Features:**

- Chronological report list
- Milestone markers (Weeks 5, 10, 15, 20)
- Progress bar indicator
- Status icons
- Grade and feedback display
- Vertical timeline design

**Milestones:**

1. Week 5: First Assessment
2. Week 10: Mid-term Review
3. Week 15: Progress Check
4. Week 20: Final Evaluation

---

### SearchFilter

**Purpose:** Report filtering and search

**Props:**

```tsx
interface SearchFilterProps {
  onSearchChange: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onWeekFilter: (value: string) => void;
  showWeekFilter?: boolean;
  showStatusFilter?: boolean;
}
```

**Features:**

- Real-time search input
- Status dropdown filter
- Week number filter
- Clear all filters button
- Active filter indication

---

### PrintableReport

**Purpose:** Professional report printing

**Props:**

```tsx
interface PrintableReportProps {
  report: Report;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**

- TTU letterhead and branding
- Student information section
- Report details
- Feedback display
- Signature fields
- Print CSS media query
- Professional formatting

**Print Behavior:**

- Hides UI elements when printing
- Optimizes page layout
- Sets page margins
- Maintains branding

---

## Context API

### AuthContext

**Purpose:** Manage user authentication state

**State:**

```tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}
```

**Features:**

- Login/logout functionality
- User session persistence
- Role-based access control
- Mock authentication (demo)

**Demo Credentials:**

- Student: <john.doe@university.edu> / password123
- Supervisor: <dr.brown@university.edu> / password123
- Admin: <admin@university.edu> / admin123

---

### DataContext

**Purpose:** Centralized application data management

**State:**

```tsx
interface DataContextType {
  reports: Report[];
  assessments: Assessment[];
  notifications: Notification[];
  students: Student[];
  supervisors: Supervisor[];
  addReport: (report) => void;
  updateReport: (id, updates) => void;
  addAssessment: (assessment) => void;
  markNotificationAsRead: (id) => void;
  assignSupervisor: (studentId, supervisorId) => void;
  addStudent: (student) => void;
  removeUser: (userId) => void;
}
```

**Features:**

- Mock data initialization
- CRUD operations
- Automatic notification generation
- Relationship management

**Notification Triggers:**

- Report submission → Supervisor notification
- Grading complete → Student notification
- Feedback added → Student notification
- Supervisor assigned → Student notification

---

## Type Definitions

### Core Types (types.ts)

```typescript
export type UserRole = "student" | "supervisor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Student extends User {
  role: "student";
  studentId: string;
  department: string;
  supervisorId?: string;
  company?: string;
  attachmentStartDate?: string;
  attachmentEndDate?: string;
  progress: number;
}

export interface Supervisor extends User {
  role: "supervisor";
  department: string;
  assignedStudents: string[];
}

export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  submittedDate: string;
  weekNumber?: number;
  fileName: string;
  fileSize: string;
  status: "pending" | "reviewed" | "graded";
  feedback?: string;
  grade?: number;
}

export interface Assessment {
  id: string;
  reportId: string;
  studentId: string;
  supervisorId: string;
  attendance: number;
  performance: number;
  reportQuality: number;
  professionalism: number;
  overallGrade: number;
  feedback: string;
  assessedDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "deadline" | "assessment" | "feedback" | "assignment";
  read: boolean;
  createdAt: string;
}
```

---

## Routing Configuration

### Routes (routes.tsx)

```tsx
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/student",
    element: <StudentDashboard />,
  },
  {
    path: "/supervisor",
    element: <SupervisorDashboard />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
```

**Navigation Flow:**

1. User lands on Login page (/)
2. After authentication, redirects to role-specific dashboard
3. Invalid routes redirect to login
4. No route protection (demo mode)

**Production Recommendations:**

- Add route guards
- Implement protected routes
- Add 404 page
- Add loading states

---

## Performance Optimizations

### Current Optimizations

1. **Component Lazy Loading** (Future)
   - Code splitting potential
   - Route-based chunking

2. **State Management**
   - Context API for global state
   - Local state for component-specific data
   - Minimal re-renders

3. **Asset Optimization**
   - SVG icons (Lucide React)
   - Tailwind CSS purging
   - Vite bundling

### Recommended Future Optimizations

1. **React.memo** for expensive components
2. **useMemo/useCallback** for calculations
3. **Virtual scrolling** for large lists
4. **Debounced search** input
5. **Image lazy loading**
6. **Service Worker** for offline support

---

## Security Considerations

### Current Implementation (Demo)

⚠️ **This is a demo with mock authentication**

- Passwords stored in plain text (client-side)
- No server-side validation
- No encryption
- Session in localStorage
- No CSRF protection

### Production Requirements

1. **Authentication:**
   - JWT tokens
   - Secure password hashing (bcrypt)
   - HTTPS only
   - Session management
   - Password reset flow

2. **Authorization:**
   - Role-based access control
   - Permission validation
   - Protected API endpoints

3. **Data Protection:**
   - Input sanitization
   - XSS prevention
   - SQL injection prevention
   - CORS configuration

4. **File Uploads:**
   - File type validation
   - Size limits enforcement
   - Virus scanning
   - Secure storage

---

## Environment Variables

See `.env.example` for configuration options:

- `VITE_APP_NAME`: Application name
- `VITE_API_URL`: Backend API endpoint
- `VITE_MAX_FILE_SIZE`: Upload size limit
- `VITE_ALLOWED_FILE_TYPES`: Accepted formats

---

## Build & Deployment

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
```

**Output:** `/dist` directory

### Deployment Platforms

**Recommended:**

- Vercel (Recommended for Vite)
- Netlify
- GitHub Pages
- AWS Amplify

**Configuration:**

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18.x or higher

---

## Testing Guidelines

### Manual Testing Checklist

**Authentication:**

- [ ] Login with all user roles
- [ ] Logout functionality
- [ ] Invalid credentials handling

**Student Features:**

- [ ] Submit report
- [ ] View reports (all tabs)
- [ ] View feedback and grades
- [ ] Progress timeline display

**Supervisor Features:**

- [ ] View assigned students
- [ ] Provide quick feedback
- [ ] Grade reports
- [ ] Update existing grades

**Admin Features:**

- [ ] Add new users
- [ ] Assign supervisors
- [ ] Remove users
- [ ] View analytics

**General Features:**

- [ ] Notifications center
- [ ] Search and filters
- [ ] Calendar view
- [ ] Document preview
- [ ] Bulk download
- [ ] Print reports

### Automated Testing (Future)

**Recommended Libraries:**

- Jest (Unit testing)
- React Testing Library (Component testing)
- Cypress (E2E testing)
- MSW (API mocking)

---

## Browser Compatibility

**Tested and Supported:**

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Mobile:**

- ✅ iOS Safari 14+
- ✅ Chrome Android 90+

---

## Accessibility Features

**Current Implementation:**

- Semantic HTML
- ARIA labels (via Radix UI)
- Keyboard navigation
- Focus management
- Color contrast compliance

**Future Improvements:**

- Screen reader testing
- WCAG 2.1 AA compliance audit
- Keyboard shortcut documentation

---

## Known Limitations

1. **Mock Data:** All data is client-side and resets on refresh
2. **File Storage:** Files aren't actually stored
3. **Authentication:** No real security
4. **Notifications:** Only in-app, no email/SMS
5. **Offline Support:** None
6. **Real-time Updates:** None

---

## Migration to Production

### Backend Integration Steps

1. **Set up API Server**
   - Node.js/Express or Python/Django
   - RESTful API design
   - Authentication middleware

2. **Database**
   - PostgreSQL or MongoDB
   - Schema design based on types.ts
   - Migrations

3. **File Storage**
   - AWS S3, Google Cloud Storage, or Azure
   - Signed URLs for downloads
   - Virus scanning

4. **Authentication**
   - JWT implementation
   - Refresh tokens
   - Session management

5. **Frontend Updates**
   - Replace Context API calls with API calls
   - Add loading states
   - Error handling
   - Form validation

6. **Deployment**
   - CI/CD pipeline
   - Environment configuration
   - Monitoring and logging

---

## Support & Maintenance

### Logging

**Console Errors:**

- Error boundary catches
- API failures (future)
- Validation errors

**Production Monitoring (Recommended):**

- Sentry for error tracking
- Google Analytics for usage
- LogRocket for session replay

### Version Control

- Git branching strategy
- Semantic versioning
- Changelog maintenance

---

## License

©2026 Takoradi Technical University
All Rights Reserved

---

**Last Updated:** March 2026
**Version:** 1.0.0
**Maintained by:** TTU ICT Department
