# Developer Guide - TTU Industrial Attachment Portal

Quick reference for developers working on this project.

---

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd ttu-industrial-attachment-portal
npm install

# Development
npm run dev              # Start dev server (http://localhost:5173)

# Build
npm run build            # Production build
npm run preview          # Preview production build
```

---

## 📁 Key Files & Directories

```
├── src/app/
│   ├── components/           # Reusable components
│   │   ├── ui/              # Base UI components (Radix UI)
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── ...
│   ├── context/             # Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── DataContext.tsx  # Application data
│   ├── pages/               # Page components
│   │   ├── Login.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── SupervisorDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── App.tsx              # Root component
│   ├── routes.tsx           # Route configuration
│   └── types.ts             # TypeScript types
├── public/                  # Static assets
├── .env.example             # Environment template
└── vite.config.ts           # Vite configuration
```

---

## 🎨 Component Patterns

### Creating a New Page

```tsx
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export function MyNewPage() {
  const { user } = useAuth();
  const { reports } = useData();

  return (
    <DashboardLayout title="Page Title">
      <div className="space-y-6">
        {/* Content */}
      </div>
    </DashboardLayout>
  );
}
```

### Using Context

```tsx
// Authentication
import { useAuth } from '../context/AuthContext';
const { user, login, logout } = useAuth();

// Data
import { useData } from '../context/DataContext';
const { reports, students, addReport, updateReport } = useData();
```

### Creating a Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## 🎯 Common Tasks

### Adding a New User Role

1. Update `types.ts`:
```typescript
export type UserRole = 'student' | 'supervisor' | 'admin' | 'newrole';
```

2. Update `AuthContext.tsx`:
```typescript
// Add demo credentials
if (email === 'newrole@university.edu') {
  // ... setup
}
```

3. Create new dashboard page
4. Add route in `routes.tsx`

### Adding a New Notification Type

1. Update `types.ts`:
```typescript
export interface Notification {
  // ...
  type: 'info' | 'deadline' | 'assessment' | 'feedback' | 'assignment' | 'newtype';
}
```

2. Update notification generation in `DataContext.tsx`

### Adding a New Report Status

1. Update `types.ts`:
```typescript
export interface Report {
  // ...
  status: 'pending' | 'reviewed' | 'graded' | 'newstatus';
}
```

2. Update status colors in dashboard components
3. Add to filters

---

## 🔧 Utility Functions

### Date Formatting

```tsx
import { format, addWeeks, isSameDay } from 'date-fns';

// Format date
format(new Date(), 'MMM d, yyyy'); // "Mar 18, 2026"

// Add weeks
const nextDeadline = addWeeks(startDate, 1);

// Compare dates
if (isSameDay(date1, date2)) { /* ... */ }
```

### Tailwind CSS Classes

```tsx
// Conditional classes
className={`text-sm ${isActive ? 'text-blue-600' : 'text-gray-600'}`}

// Using clsx
import { clsx } from 'clsx';
className={clsx('text-sm', isActive && 'text-blue-600')}

// Card status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'graded': return 'bg-green-100 text-green-700';
    case 'reviewed': return 'bg-blue-100 text-blue-700';
    case 'pending': return 'bg-orange-100 text-orange-700';
  }
};
```

---

## 🎨 UI Component Library

### Common Components

```tsx
// Button
import { Button } from './components/ui/button';
<Button>Click Me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Card
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>

// Badge
import { Badge } from './components/ui/badge';
<Badge>Default</Badge>
<Badge variant="outline">Outline</Badge>
<Badge className="bg-green-100 text-green-700">Custom</Badge>

// Input
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// Textarea
import { Textarea } from './components/ui/textarea';
<Textarea rows={4} />

// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Toast Notifications
import { toast } from 'sonner';
toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
```

---

## 📊 Working with Charts

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Week 1', grade: 85 },
  { name: 'Week 2', grade: 90 },
];

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="grade" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

---

## 🔍 Debugging Tips

### React DevTools
```bash
# Install React Developer Tools browser extension
# Components tab: Inspect component tree
# Profiler tab: Measure performance
```

### Console Logging

```tsx
// Context values
console.log('User:', user);
console.log('Reports:', reports);

// Component renders
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// State changes
useEffect(() => {
  console.log('State changed:', value);
}, [value]);
```

### Common Issues

**Issue:** Component not re-rendering
```tsx
// ❌ Mutating state directly
reports.push(newReport);

// ✅ Creating new array
setReports([...reports, newReport]);
```

**Issue:** Infinite loop in useEffect
```tsx
// ❌ Missing dependency
useEffect(() => {
  doSomething(data);
}, []);

// ✅ Proper dependencies
useEffect(() => {
  doSomething(data);
}, [data]);
```

**Issue:** "Cannot read property of undefined"
```tsx
// ❌ No null check
<p>{user.name}</p>

// ✅ Optional chaining
<p>{user?.name}</p>

// ✅ Default value
<p>{user?.name || 'Guest'}</p>
```

---

## 🧪 Testing

### Component Testing (Future)

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './components/ui/button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Manual Testing Checklist

```markdown
### Login
- [ ] Student login works
- [ ] Supervisor login works
- [ ] Admin login works
- [ ] Invalid credentials show error

### Student Dashboard
- [ ] Reports display correctly
- [ ] Submit report works
- [ ] File upload accepts valid files
- [ ] Progress bar shows correct percentage
- [ ] Notifications appear

### Supervisor Dashboard
- [ ] Assigned students list correct
- [ ] Pending reports show
- [ ] Grade submission works
- [ ] Feedback appears for student

### Admin Dashboard
- [ ] Add user works
- [ ] Assign supervisor works
- [ ] Remove user works
- [ ] Analytics display
```

---

## 🚀 Performance Tips

### Optimize Re-renders

```tsx
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = React.memo(MyComponent);
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

<Suspense fallback={<div>Loading...</div>}>
  <StudentDashboard />
</Suspense>
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Conventions

```tsx
// Spacing
className="p-4 mb-6 space-y-3"

// Layout
className="flex items-center justify-between"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Colors (Use theme colors)
className="bg-blue-600 text-white"
className="text-gray-600 hover:text-gray-900"

// Responsive
className="text-sm md:text-base lg:text-lg"
className="hidden md:block"
```

### Color Palette

```tsx
// Primary (Blue)
bg-blue-50, bg-blue-100, ..., bg-blue-600

// Success (Green)
bg-green-50, bg-green-100, ..., bg-green-600

// Warning (Orange)
bg-orange-50, bg-orange-100, ..., bg-orange-600

// Error (Red)
bg-red-50, bg-red-100, ..., bg-red-600

// Neutral (Gray)
bg-gray-50, bg-gray-100, ..., bg-gray-900
```

---

## 🔐 Security Best Practices

### Input Validation

```tsx
// Always validate user input
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!title.trim()) {
    toast.error('Title is required');
    return;
  }
  
  if (title.length > 200) {
    toast.error('Title too long');
    return;
  }
  
  // Process...
};
```

### File Upload

```tsx
// Validate file type and size
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  
  if (!file) return;
  
  // Check file type
  const validTypes = ['application/pdf', 'application/msword'];
  if (!validTypes.includes(file.type)) {
    toast.error('Invalid file type');
    return;
  }
  
  // Check file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error('File too large');
    return;
  }
  
  setFileName(file.name);
};
```

---

## 📦 Adding Dependencies

```bash
# Install package
npm install package-name

# Install dev dependency
npm install -D package-name

# Update package
npm update package-name

# Remove package
npm uninstall package-name
```

### Commonly Used Packages

```bash
# Icons
npm install lucide-react

# Forms
npm install react-hook-form

# Date handling
npm install date-fns

# Charts
npm install recharts

# Notifications
npm install sonner
```

---

## 🐛 Common Errors & Solutions

### "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "TypeScript errors"
```bash
# Check types
npm run type-check

# Rebuild
npm run build
```

### "Vite errors"
```bash
# Clear Vite cache
rm -rf .vite

# Restart dev server
npm run dev
```

---

## 📝 Code Style

### Naming Conventions

```tsx
// Components: PascalCase
export function StudentDashboard() {}

// Functions: camelCase
const handleSubmit = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10485760;

// Types/Interfaces: PascalCase
interface UserData {}
type UserRole = 'student' | 'supervisor';
```

### File Organization

```tsx
// 1. Imports
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

// 2. Types (if any)
interface Props {
  title: string;
}

// 3. Component
export function MyComponent({ title }: Props) {
  // 4. Hooks
  const [state, setState] = useState('');
  const { user } = useAuth();
  
  // 5. Functions
  const handleClick = () => {};
  
  // 6. Effects
  useEffect(() => {}, []);
  
  // 7. Render
  return <div>{title}</div>;
}
```

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub

# After merge, update main
git checkout main
git pull origin main
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 📞 Getting Help

- **Documentation:** Check README.md, USER_GUIDE.md, TECHNICAL_DOCUMENTATION.md
- **Code Examples:** Look at existing components
- **Issues:** Search GitHub issues or create new one
- **Team:** Ask team members on Slack/Teams

---

## 🎯 Quick Reference

### Import Aliases

```tsx
// No aliases configured, use relative paths
import { Button } from './components/ui/button';
import { useAuth } from '../context/AuthContext';
```

### Environment Variables

```tsx
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
```

### TypeScript Tips

```tsx
// Type inference
const [user, setUser] = useState<User | null>(null);

// Props typing
interface Props {
  title: string;
  optional?: number;
  onClick: () => void;
}

// Event typing
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); };
```

---

**Happy Coding! 🚀**

*Last Updated: March 18, 2026*
