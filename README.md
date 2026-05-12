# Takoradi Technical University - Industrial Attachment Portal

[![Built with React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-TTU-green.svg)](LICENSE)

A comprehensive web-based assessment and reporting portal for managing student industrial attachments, supervisor assessments, and administrative oversight.

![Dashboard Preview](https://via.placeholder.com/800x400/1e40af/ffffff?text=TTU+Industrial+Attachment+Portal)

---

## 🎯 Overview

The TTU Industrial Attachment Portal is a full-featured MVP designed to digitize and streamline the industrial attachment process for Takoradi Technical University. The platform supports three distinct user roles with specialized dashboards and features.

### Key Features

✅ **Role-Based Dashboards** - Student, Supervisor, and Administrator interfaces
✅ **Report Management** - Submit, review, and grade reports with file uploads
✅ **Assessment System** - Multi-criteria grading with detailed feedback
✅ **Real-Time Notifications** - Deadline reminders and status updates
✅ **Analytics Dashboard** - Performance trends and insights
✅ **Calendar View** - Visual deadline tracking
✅ **Progress Timeline** - Student journey visualization
✅ **Document Preview** - In-app report viewing
✅ **Bulk Operations** - Download multiple reports
✅ **Search & Filters** - Advanced filtering capabilities
✅ **Printable Reports** - Professional PDF-ready templates
✅ **Mobile Responsive** - Works on all devices
✅ **Error Handling** - Graceful error boundaries

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ttu-industrial-attachment-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Demo Credentials

**Student:**
- Email: `john.doe@university.edu`
- Password: `password123`

**Supervisor:**
- Email: `dr.brown@university.edu`
- Password: `password123`

**Administrator:**
- Email: `admin@university.edu`
- Password: `admin123`

---

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete guide for all user roles
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Architecture and component docs
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Project Summary](PROJECT_SUMMARY.md)** - Feature overview and status

---

## 🎨 Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **React Router v7** - Navigation (Data Mode)
- **Vite** - Build tool

### UI Components
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **date-fns** - Date manipulation

### State Management
- **Context API** - Authentication & data
- **React Hooks** - Local component state

---

## 📁 Project Structure

```
src/app/
├── components/
│   ├── ui/                    # Base UI components
│   ├── AnalyticsDashboard.tsx # Charts & metrics
│   ├── BulkDownload.tsx       # Multi-report download
│   ├── CalendarView.tsx       # Deadline calendar
│   ├── DashboardLayout.tsx    # Common layout
│   ├── DocumentPreview.tsx    # Report viewer
│   ├── ErrorBoundary.tsx      # Error handling
│   ├── NotificationCenter.tsx # Notifications
│   ├── PrintableReport.tsx    # Print templates
│   ├── ProgressTimeline.tsx   # Visual timeline
│   └── SearchFilter.tsx       # Search/filter
├── context/
│   ├── AuthContext.tsx        # Authentication
│   └── DataContext.tsx        # Application data
├── pages/
│   ├── AdminDashboard.tsx     # Admin interface
│   ├── Login.tsx              # Login page
│   ├── StudentDashboard.tsx   # Student interface
│   └── SupervisorDashboard.tsx# Supervisor interface
├── App.tsx                    # Root component
├── routes.tsx                 # Route config
└── types.ts                   # TypeScript types
```

---

## 🎭 User Roles & Features

### 👨‍🎓 Student Features

- Submit weekly/monthly reports with file uploads
- Track attachment progress
- View grades and supervisor feedback
- Visual progress timeline
- Notification center
- Report history and status

### 👨‍🏫 Supervisor Features

- View assigned students
- Review and grade reports
- Multi-criteria assessment system
- Provide detailed feedback
- Track student progress
- Analytics dashboard
- Bulk report downloads

### 👨‍💼 Administrator Features

- User management (add/remove)
- Assign supervisors to students
- System-wide analytics
- Report monitoring
- Bulk operations
- Calendar view of all deadlines

---

## 📊 Feature Highlights

### Analytics Dashboard
- Performance trend charts
- Report status distribution
- Student comparison metrics
- Department analytics

### Calendar View
- Color-coded deadline tracking
- Submission status visualization
- Upcoming deadlines panel
- Interactive date selection

### Progress Timeline
- Chronological report history
- Milestone markers
- Grade and feedback display
- Visual progress indicator

### Document Management
- In-app preview
- Download functionality
- Print-ready templates
- Bulk download support

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

---

## 🌐 Deployment

### Recommended Platforms

**Vercel (Recommended)**
```bash
npm i -g vercel
vercel --prod
```

**Netlify**
```bash
npm run build
# Drag & drop /dist folder
```

**GitHub Pages**
```bash
npm run deploy
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🎯 Current Status

### ✅ Completed Features

- [x] Authentication system (mock)
- [x] Three role-based dashboards
- [x] Report submission & grading
- [x] User management
- [x] Notification center
- [x] Analytics dashboard
- [x] Calendar view
- [x] Progress timeline
- [x] Document preview
- [x] Bulk download
- [x] Search & filters
- [x] Printable reports
- [x] Error boundaries
- [x] Responsive design
- [x] TTU branding

### 🔄 Production Readiness

**Frontend:** ✅ Complete and production-ready

**Backend:** ⚠️ Currently using mock data
- Ready for API integration
- Types defined
- Context structure prepared

---

## 🚧 Future Enhancements

### Backend Integration
- [ ] RESTful API development
- [ ] Database implementation
- [ ] Real file storage (AWS S3/Azure)
- [ ] JWT authentication
- [ ] Email notifications

### Advanced Features
- [ ] Real-time updates (WebSockets)
- [ ] Advanced analytics
- [ ] Document versioning
- [ ] Export to Excel/CSV
- [ ] Multi-language support
- [ ] Dark mode

### Performance
- [ ] Service Worker
- [ ] Offline support
- [ ] Progressive Web App
- [ ] Code splitting
- [ ] Image optimization

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## 🔐 Security Notes

⚠️ **Current Implementation:** This is a demo with mock authentication

**For Production:**
- Implement secure backend authentication
- Use HTTPS only
- Encrypt sensitive data
- Implement CORS properly
- Add rate limiting
- Use environment variables for secrets

---

## 🤝 Contributing

This project is maintained by the TTU ICT Department.

### Development Workflow

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit for review
5. Merge to main

### Code Standards

- Use TypeScript
- Follow React best practices
- Maintain consistent formatting
- Write descriptive commit messages
- Document complex logic

---

## 📄 License

©2026 Takoradi Technical University. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 👥 Team

**Developed by:** TTU ICT Department
**Project Lead:** [Name]
**Contributors:** [Names]

---

## 📞 Support

### Technical Support
- **Email:** support@ttu.edu.gh
- **Phone:** +233 (0)XX XXX XXXX
- **Office Hours:** Monday-Friday, 8AM-5PM

### Report Issues
- Create an issue in the repository
- Email: techsupport@ttu.edu.gh

---

## 📈 Version History

### v1.0.0 (March 2026)
- ✨ Initial MVP release
- 🎨 Three role-based dashboards
- 📊 Analytics and calendar features
- 📱 Mobile responsive design
- 🔧 Production-ready frontend

---

## 🙏 Acknowledgments

- Takoradi Technical University
- ICT Department
- Students and Supervisors (testing)
- Open-source community

---

## 📖 Additional Resources

- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Built with ❤️ for Takoradi Technical University**

*Last Updated: March 18, 2026*
