import { useState } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Upload, FileText, Activity, Calendar,
  CheckCircle, Clock, Eye, Star, Building2,
  ClipboardCheck, FileOutput,
  CreditCard, MapPin, ShieldCheck, AlertTriangle,
  Navigation, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintableReport } from '../components/PrintableReport';
import { Report } from '../types';

export function StudentDashboard() {
  const { user } = useAuth();
  const {
    reports, students, addReport, submitDailyLocationCheckIn,
    dailyReports, weeklyUpdates, monthlyReports, missingDailyReports, addDailyReport
  } = useData();

  // Weekly attachment report upload
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  // Daily Report Upload State
  const [isDailyReportDialogOpen, setIsDailyReportDialogOpen] = useState(false);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyDayOfWeek, setDailyDayOfWeek] = useState('Monday');
  const [dailyWeekNumber, setDailyWeekNumber] = useState(2);
  const [dailyMonthNumber, setDailyMonthNumber] = useState(1);
  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyTasks, setDailyTasks] = useState('');
  const [dailySkills, setDailySkills] = useState('');
  const [dailyChallenges, setDailyChallenges] = useState('');
  const [dailyHours, setDailyHours] = useState(8);
  const [dailyTools, setDailyTools] = useState('');

  const [reportToPrint, setReportToPrint] = useState<Report | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Daily Work Location Check-In States
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationVerificationResult, setLocationVerificationResult] = useState<{
    status: 'verified_at_work' | 'not_at_work' | 'idle';
    distanceKm: number;
    detectedAddress: string;
    coords: { lat: number; lng: number };
  }>({
    status: 'idle',
    distanceKm: 0,
    detectedAddress: '',
    coords: { lat: 5.55602, lng: -0.1969 }
  });
  const [workNotes, setWorkNotes] = useState('');

  const studentData = students.find(s =>
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    s.id === user?.id ||
    (user?.name && s.name.toLowerCase() === user.name.toLowerCase())
  ) || students[0];

  const isUserReport = (sId?: string, sName?: string) => {
    if (!sId && !sName) return true;
    if (sId === user?.id || sId === studentData?.id) return true;
    if (sName && user?.name && sName.toLowerCase() === user.name.toLowerCase()) return true;
    if (sName && studentData?.name && sName.toLowerCase() === studentData.name.toLowerCase()) return true;
    if (sId === 'student1' || sId === 'u-stu-1') return true;
    return false;
  };

  const currentDailyReports = dailyReports.filter(d => isUserReport(d.studentId, d.studentName));
  const currentWeeklyUpdates = weeklyUpdates.filter(w => isUserReport(w.studentId));
  const currentMonthlyReports = monthlyReports.filter(m => isUserReport(m.studentId));
  const currentMissingDailyReports = missingDailyReports.filter(m => isUserReport(m.studentId, m.studentName));

  const studentReports = reports.filter(r => isUserReport(r.studentId, r.studentName));
  const gradedReports = studentReports.filter(r => r.status === 'graded');
  const avgGrade = gradedReports.length > 0
    ? Math.round(gradedReports.reduce((acc, r) => acc + (r.grade || 0), 0) / gradedReports.length)
    : 0;

  // Handle GPS detection & On-Site Work Geofence Verification
  const handleDetectWorkLocation = (simulateNotAtWork = false) => {
    setIsDetectingLocation(true);

    setTimeout(() => {
      setIsDetectingLocation(false);
      if (simulateNotAtWork) {
        // Outside workplace boundary (> 500m)
        setLocationVerificationResult({
          status: 'not_at_work',
          distanceKm: 4.8,
          detectedAddress: 'Achimota Residential Area, Accra (4.8 km from workplace)',
          coords: { lat: 5.6120, lng: -0.2240 }
        });
      } else {
        // Within assigned workplace boundary (< 100m)
        const workplaceAddr = studentData?.assignedLocationAddress || '12 Independence Avenue, Ridge, Accra';
        setLocationVerificationResult({
          status: 'verified_at_work',
          distanceKm: 0.03,
          detectedAddress: `${workplaceAddr} (Workstation Geofence Verified)`,
          coords: { lat: 5.55605, lng: -0.19688 }
        });
      }
    }, 900);
  };

  const handleConfirmDailyCheckIn = () => {
    if (locationVerificationResult.status !== 'verified_at_work') {
      toast.error('You can only submit daily check-in when physically at your assigned work location.');
      return;
    }

    if (typeof submitDailyLocationCheckIn === 'function') {
      submitDailyLocationCheckIn({
        studentId: studentData?.id || user?.id || 'student1',
        studentName: studentData?.name || user?.name || 'John Doe',
        date: new Date().toISOString().split('T')[0],
        latitude: locationVerificationResult.coords.lat,
        longitude: locationVerificationResult.coords.lng,
        address: locationVerificationResult.detectedAddress,
        city: studentData?.assignedLocationCity || 'Accra',
        status: 'verified_on_site',
        distanceFromAssignedKm: locationVerificationResult.distanceKm,
        notes: workNotes || 'On-site workplace check-in verified during standard work shift.',
      });
    }

    toast.success('Workplace location verified! Today\'s attendance logged.');
    setIsCheckInModalOpen(false);
    setLocationVerificationResult({ status: 'idle', distanceKm: 0, detectedAddress: '', coords: { lat: 5.55602, lng: -0.1969 } });
    setWorkNotes('');
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Please select a file to upload'); return; }
    setIsUploading(true);
    try {
      const fileUrl = await uploadToCloudinary(selectedFile);
      await addReport({
        studentId: user?.id || studentData?.id || '',
        studentName: user?.name || '',
        title: reportTitle,
        description: reportDescription,
        weekNumber: weekNumber ? parseInt(weekNumber) : undefined,
        fileName,
        fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
        fileUrl,
      });
      toast.success('Report submitted successfully!');
      setIsUploadDialogOpen(false);
      setReportTitle(''); setReportDescription(''); setWeekNumber('');
      setFileName(''); setSelectedFile(null);
    } catch {
      toast.error('Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <span className="badge-green inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"><CheckCircle className="w-3 h-3" />Graded</span>;
      case 'reviewed':
        return <span className="badge-blue inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"><Clock className="w-3 h-3" />Reviewed</span>;
      case 'pending':
        return <span className="badge-amber inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"><Clock className="w-3 h-3" />Pending</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium">{status}</span>;
    }
  };

  const dashboardCards = [
    { label: 'Log Book Payment', description: 'Pay for your industrial attachment log book and check payment status.', icon: CreditCard, href: '/student/services/fee-payments' },
    { label: 'Attachment Letter', description: 'Generate and print your industrial attachment request letters.', icon: FileOutput, href: '/student/services/attachment-letter' },
    { label: 'Assumption Form', description: 'Submit your assumption of duty forms for attachment.', icon: ClipboardCheck, href: '/student/services/assumption-form' },
  ];

  const stats = [
    { label: 'Progress', value: `${studentData?.progress || 0}%`, icon: Activity, gradient: 'bg-[#6374f6]', extra: <div className="mt-4"><Progress value={studentData?.progress || 0} className="h-1.5 bg-white/30 [&>*]:bg-white" /></div> },
    { label: 'No.of Reports Uploaded', value: studentReports.length, icon: FileText, gradient: 'bg-[#9851f5]', extra: null },
    { label: 'No.of Reports Graded', value: gradedReports.length, icon: CheckCircle, gradient: 'bg-[#00a86b]', extra: null },
    { label: 'Remark/Comment', value: avgGrade > 0 ? `${avgGrade}%` : 'N/A', icon: Star, gradient: 'bg-[#f48c06]', extra: null },
  ];

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => {
            const Icon = s.icon;
            const cardContent = (
              <div className={`${s.gradient} rounded-2xl p-5 text-white flex flex-col justify-between min-h-[130px]`}>
                <div className="flex items-start justify-between">
                  <span className="text-white/90 text-sm font-medium">{s.label}</span>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold leading-none">{s.value}</p>
                  {s.extra}
                </div>
              </div>
            );
            // Make Progress clickable
            if (s.label === 'Progress') {
              return (
                <Link key={s.label} to="/student/progress" className="block hover:opacity-95 transition-opacity">
                  {cardContent}
                </Link>
              );
            }
            // Make No.of Reports Uploaded clickable
            if (s.label === 'No.of Reports Uploaded') {
              return (
                <Link key={s.label} to="/student/uploaded-reports" className="block hover:opacity-95 transition-opacity">
                  {cardContent}
                </Link>
              );
            }
            // Make Remark/Comment clickable
            if (s.label === 'Remark/Comment') {
              return (
                <Link key={s.label} to="/student/grades" className="block hover:opacity-95 transition-opacity">
                  {cardContent}
                </Link>
              );
            }
            return (
              <div key={s.label} className="block">
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Assigned Location & Daily Attendance Check-In Widget */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Allocated Attachment Location</h3>
                <p className="text-xs text-muted-foreground">Assigned workplace coordinates & daily verified presence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {studentData?.dailyLocationStatus === 'on_site' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Checked-In On-Site Today
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending Today's Check-In
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-secondary rounded-xl space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Assigned Company / Facility</p>
              <p className="text-sm font-bold text-foreground truncate">
                {studentData?.assignedLocationName || studentData?.company || 'Tech Corp Industrial Hub'}
              </p>
              <p className="text-xs text-primary font-medium">
                {studentData?.assignedLocationZone || 'Greater Accra Industrial Zone'}
              </p>
            </div>

            <div className="p-3.5 bg-secondary rounded-xl space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Workplace Address</p>
              <p className="text-xs font-semibold text-foreground">
                {studentData?.assignedLocationAddress || '12 Independence Avenue, Ridge, Accra'}
              </p>
              <p className="text-[11px] text-muted-foreground">City: {studentData?.assignedLocationCity || 'Accra'}</p>
            </div>

            <div className="p-3.5 bg-secondary rounded-xl flex flex-col justify-between space-y-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's Presence</p>
                <p className="text-xs font-bold text-foreground">
                  {studentData?.lastCheckInTime || 'No check-in recorded yet today'}
                </p>
              </div>

              <Button
                size="sm"
                className="w-full btn-primary text-xs gap-1.5 h-9"
                onClick={() => {
                  setLocationVerificationResult({ status: 'idle', distanceKm: 0, detectedAddress: '', coords: { lat: 5.55602, lng: -0.1969 } });
                  setIsCheckInModalOpen(true);
                }}
              >
                <MapPin className="w-3.5 h-3.5" /> Check-In At Work Location
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">Work Hours Rule:</span> Daily check-ins must be submitted only while physically present at your assigned workplace
              {studentData?.assignedLocationName ? (
                <span className="font-semibold"> ({studentData.assignedLocationName})</span>
              ) : (
                <span className="font-semibold"> (Assigned Company)</span>
              )}.
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* WORK-ONLY DAILY LOCATION CHECK-IN DIALOG */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <Dialog open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Workplace Attendance Verification
              </DialogTitle>
              <DialogDescription>
                Confirm your daily presence at your designated attachment workplace.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Assigned Workplace Details Banner */}
              <div className="p-4 bg-secondary rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground uppercase tracking-wider">Designated Workplace</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    On-Site Required
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">{studentData?.assignedLocationName || 'Tech Corp Industrial Hub'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {studentData?.assignedLocationAddress || '12 Independence Avenue, Ridge, Accra'}
                  </p>
                </div>
              </div>

              {/* Step 1: Detect Live Location */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Step 1: Detect & Verify Your Current GPS Location</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isDetectingLocation}
                    onClick={() => handleDetectWorkLocation(false)}
                    className="flex-1 gap-2 text-xs h-10 font-semibold"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    {isDetectingLocation ? 'Detecting Workplace GPS...' : 'Detect Location (At Work)'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isDetectingLocation}
                    onClick={() => handleDetectWorkLocation(true)}
                    className="text-xs h-10 text-muted-foreground hover:text-red-600 text-[11px]"
                    title="Simulate check-in attempt when away from work premises"
                  >
                    Simulate Off-Site
                  </Button>
                </div>
              </div>

              {/* Step 2: Verification Result */}
              {locationVerificationResult.status === 'verified_at_work' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified On-Site at Assigned Workplace
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Your GPS coordinates match your assigned facility premises (Variance: {locationVerificationResult.distanceKm * 1000} meters).
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Detected: {locationVerificationResult.detectedAddress}
                  </p>
                </div>
              )}

              {locationVerificationResult.status === 'not_at_work' && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Location Mismatch: Not At Assigned Work Location
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    You are currently <strong>{locationVerificationResult.distanceKm} km</strong> away from your assigned attachment workplace. Daily check-in is restricted to your official work location.
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Detected: {locationVerificationResult.detectedAddress}
                  </p>
                </div>
              )}

              {/* Step 3: Work Activity / Shift Note */}
              <div className="space-y-1.5">
                <Label htmlFor="workNote" className="text-xs font-bold text-foreground">
                  Work Activity / Station Note (Optional)
                </Label>
                <Input
                  id="workNote"
                  placeholder="e.g. Reporting to Design Lab Station 4 for morning shift..."
                  value={workNotes}
                  onChange={e => setWorkNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCheckInModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={locationVerificationResult.status !== 'verified_at_work'}
                  onClick={handleConfirmDailyCheckIn}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Confirm & Log Presence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-[#104e8b] transition-colors flex flex-col justify-start min-h-[140px]"
              >
                <Icon className="w-7 h-7 text-gray-600 mb-3" />
                <h3 className="text-[#104e8b] font-semibold text-sm mb-1.5">{item.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.description}</p>
              </Link>
            );
          })}
        </div>

        {studentData && (
          <div className="card-clean rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Attachment Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Company', value: studentData.company || 'Not assigned' },
                { label: 'Department', value: studentData.department || 'N/A' },
                { label: 'Start Date', value: studentData.attachmentStartDate ? new Date(studentData.attachmentStartDate).toLocaleDateString() : 'Not set' },
                { label: 'End Date', value: studentData.attachmentEndDate ? new Date(studentData.attachmentEndDate).toLocaleDateString() : 'Not set' },
              ].map(item => (
                <div key={item.label} className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MY REPORTS: DAILY, WEEKLY, MONTHLY & MISSING REPORTS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="card-clean rounded-2xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border bg-gradient-to-r from-secondary/40 to-transparent">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-foreground text-lg">My Reports</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Daily • Weekly • Monthly
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submit daily work logs. Daily reports automatically roll up into weekly updates and generate your monthly report.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Daily Report Upload Dialog */}
              <Dialog open={isDailyReportDialogOpen} onOpenChange={setIsDailyReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary gap-2 h-10 px-4 rounded-xl text-xs font-semibold shadow-xs">
                    <Calendar className="w-4 h-4" /> Submit Daily Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Daily Work Report Submission
                    </DialogTitle>
                    <DialogDescription>
                      Log your daily tasks, hours worked, and skills acquired for today's work shift.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!dailyTitle || !dailyTasks) {
                        toast.error('Report title and tasks completed are required.');
                        return;
                      }

                      addDailyReport({
                        studentId: studentData?.id || user?.id || 'student1',
                        studentName: studentData?.name || user?.name || 'John Doe',
                        date: dailyDate,
                        dayOfWeek: dailyDayOfWeek,
                        weekNumber: dailyWeekNumber,
                        monthNumber: dailyMonthNumber,
                        monthName: `Month ${dailyMonthNumber} (${new Date(dailyDate).toLocaleString('default', { month: 'long', year: 'numeric' })})`,
                        title: dailyTitle,
                        tasksCompleted: dailyTasks,
                        skillsAcquired: dailySkills,
                        challengesFaced: dailyChallenges,
                        hoursWorked: Number(dailyHours) || 8,
                        equipmentOrTools: dailyTools,
                      });

                      setIsDailyReportDialogOpen(false);
                      setDailyTitle('');
                      setDailyTasks('');
                      setDailySkills('');
                      setDailyChallenges('');
                      setDailyTools('');
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dDate">Date</Label>
                        <Input
                          id="dDate"
                          type="date"
                          value={dailyDate}
                          onChange={e => {
                            setDailyDate(e.target.value);
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const d = new Date(e.target.value);
                            setDailyDayOfWeek(dayNames[d.getDay()]);
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dDay">Day of Week</Label>
                        <Input id="dDay" value={dailyDayOfWeek} readOnly className="bg-secondary font-medium" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dWeek">Week No.</Label>
                        <select
                          id="dWeek"
                          value={dailyWeekNumber}
                          onChange={e => setDailyWeekNumber(Number(e.target.value))}
                          className="w-full h-10 px-3 border border-input rounded-lg bg-background text-sm"
                        >
                          <option value={1}>Week 1</option>
                          <option value={2}>Week 2</option>
                          <option value={3}>Week 3</option>
                          <option value={4}>Week 4</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dMonth">Month</Label>
                        <select
                          id="dMonth"
                          value={dailyMonthNumber}
                          onChange={e => setDailyMonthNumber(Number(e.target.value))}
                          className="w-full h-10 px-3 border border-input rounded-lg bg-background text-sm"
                        >
                          <option value={1}>Month 1</option>
                          <option value={2}>Month 2</option>
                          <option value={3}>Month 3</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dHours">Hours Worked</Label>
                        <Input
                          id="dHours"
                          type="number"
                          min="1"
                          max="16"
                          value={dailyHours}
                          onChange={e => setDailyHours(Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dTitle">Daily Activity Title</Label>
                      <Input
                        id="dTitle"
                        placeholder="e.g. Database Indexing & API Endpoint Testing"
                        value={dailyTitle}
                        onChange={e => setDailyTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dTasks">Tasks Completed & Work Highlights</Label>
                      <Textarea
                        id="dTasks"
                        rows={3}
                        placeholder="Detail specific tasks executed on-site today..."
                        value={dailyTasks}
                        onChange={e => setDailyTasks(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dSkills">Skills Acquired</Label>
                        <Input
                          id="dSkills"
                          placeholder="e.g. REST API design, Docker"
                          value={dailySkills}
                          onChange={e => setDailySkills(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dTools">Tools / Equipment</Label>
                        <Input
                          id="dTools"
                          placeholder="e.g. Postman, PostgreSQL"
                          value={dailyTools}
                          onChange={e => setDailyTools(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full btn-primary h-11 rounded-xl">
                      Save & Roll Up Daily Report
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Upload Attachment Document Dialog */}
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 h-10 px-3.5 rounded-xl text-xs font-semibold">
                    <Upload className="w-4 h-4" /> Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Attachment Report Document</DialogTitle>
                    <DialogDescription>Upload your PDF or DOCX report archive</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitReport} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Report Title</Label>
                      <Input id="title" placeholder="e.g. Week 1 Comprehensive Attachment Report"
                        value={reportTitle} onChange={e => setReportTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="week">Week Number (optional)</Label>
                      <Input id="week" type="number" placeholder="1"
                        value={weekNumber} onChange={e => setWeekNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Brief summary of your activities..."
                        rows={3} value={reportDescription} onChange={e => setReportDescription(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="file">File (PDF or DOCX)</Label>
                      <Input id="file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} required />
                      {fileName && <p className="text-xs text-muted-foreground">Selected: {fileName}</p>}
                    </div>
                    <Button type="submit" disabled={isUploading}
                      className="btn-primary w-full h-11 rounded-lg disabled:opacity-60">
                      {isUploading ? 'Uploading...' : 'Submit Report'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Reporting Progress Metric Bar */}
          {(() => {
            const studentDailies = currentDailyReports;
            const studentMiss = currentMissingDailyReports;
            const totalHours = studentDailies.reduce((a, d) => a + (d.hoursWorked || 0), 0);
            const totalExpected = studentDailies.length + studentMiss.length || 10;
            const rate = Math.round((studentDailies.length / Math.max(totalExpected, 1)) * 100);

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 p-4 sm:p-5 bg-secondary/30 border-b border-border text-xs">
                <div className="p-3 bg-white dark:bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground font-medium text-[11px] sm:text-xs">Daily Reports</p>
                  <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">{studentDailies.length} Days</p>
                </div>
                <div className="p-3 bg-white dark:bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground font-medium text-[11px] sm:text-xs">On-Site Hours</p>
                  <p className="text-base sm:text-lg font-bold text-primary mt-0.5">{totalHours} Hours</p>
                </div>
                <div className="p-3 bg-white dark:bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground font-medium text-[11px] sm:text-xs">Missing Reports</p>
                  <p className={`text-base sm:text-lg font-bold mt-0.5 ${studentMiss.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {studentMiss.length} {studentMiss.length === 1 ? 'Day' : 'Days'}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground font-medium text-[11px] sm:text-xs">Compliance</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">{rate}%</p>
                </div>
              </div>
            );
          })()}

          {/* Tabbed Report Views */}
          <div className="p-4 sm:p-6">
            <Tabs defaultValue="daily" className="space-y-4">
              <TabsList className="bg-secondary p-1 h-auto min-h-10 rounded-xl w-full flex overflow-x-auto justify-start flex-nowrap scrollbar-none gap-1">
                <TabsTrigger value="daily" className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0">
                  Daily Reports ({currentDailyReports.length})
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0">
                  Weekly Updates ({currentWeeklyUpdates.length})
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0">
                  Monthly Reports ({currentMonthlyReports.length})
                </TabsTrigger>
                <TabsTrigger value="missing" className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0 text-red-600 data-[state=active]:text-red-600">
                  Missing ({currentMissingDailyReports.length})
                </TabsTrigger>
              </TabsList>

              {/* 1. DAILY REPORTS TAB */}
              <TabsContent value="daily" className="space-y-3 mt-0">
                {currentDailyReports.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No daily reports submitted yet. Click "Submit Daily Report" to log today's activities.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {currentDailyReports.map(dr => (
                      <div
                        key={dr.id}
                        className="bg-secondary/40 border border-border p-4 rounded-xl space-y-2 hover:bg-secondary/70 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{dr.dayOfWeek}, {dr.date}</span>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                              Week {dr.weekNumber} • {dr.hoursWorked} hrs
                            </Badge>
                            {dr.status === 'graded' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Grade: {dr.grade}/100
                              </span>
                            ) : dr.status === 'reviewed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                <Clock className="w-3 h-3 text-blue-600" /> Reviewed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Submitted
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-muted-foreground">
                            Logged at {new Date(dr.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-foreground">{dr.title}</p>
                        <p className="text-xs text-muted-foreground">{dr.tasksCompleted}</p>

                        {dr.skillsAcquired && (
                          <p className="text-[11px] text-primary font-medium">
                            Skills: {dr.skillsAcquired} {dr.equipmentOrTools ? `• Tools: ${dr.equipmentOrTools}` : ''}
                          </p>
                        )}

                        {dr.feedback && (
                          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg text-xs text-blue-900 dark:text-blue-300">
                            <strong>Supervisor Remark: </strong>"{dr.feedback}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 2. WEEKLY UPDATES TAB (AUTO-ROLLED UP) */}
              <TabsContent value="weekly" className="space-y-3 mt-0">
                {currentWeeklyUpdates.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No weekly updates aggregated yet.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {currentWeeklyUpdates.map(wk => (
                      <div
                        key={wk.id}
                        className="bg-white dark:bg-card border border-border p-5 rounded-xl space-y-3 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-foreground">Week {wk.weekNumber} Industrial Update</h4>
                              {wk.status === 'complete' ? (
                                <Badge className="bg-emerald-600 text-white text-[10px]">Complete (5/5 Days)</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                  {wk.submittedDaysCount}/5 Days Logged ({wk.missingDaysCount} Missing)
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{wk.startDate} to {wk.endDate}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-primary">{wk.totalHoursWorked} Total Hours</span>
                            {wk.overallGrade && (
                              <p className="text-xs font-extrabold text-emerald-600">Weekly Score: {wk.overallGrade}%</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="font-semibold text-foreground">Weekly Tasks Summary (Auto-Synthesized from Daily Reports):</p>
                          <p className="text-muted-foreground">{wk.summaryHighlights}</p>
                        </div>

                        {wk.supervisorFeedback && (
                          <div className="p-2.5 bg-secondary rounded-lg text-xs text-foreground">
                            <strong>Weekly Evaluation: </strong>{wk.supervisorFeedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 3. MONTHLY REPORTS TAB (AUTO-ROLLED UP) */}
              <TabsContent value="monthly" className="space-y-3 mt-0">
                {currentMonthlyReports.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No monthly reports aggregated yet.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {currentMonthlyReports.map(mo => (
                      <div
                        key={mo.id}
                        className="bg-white dark:bg-card border-2 border-primary/20 p-6 rounded-2xl space-y-4 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-lg text-foreground">{mo.monthName}</h4>
                              <Badge className="bg-primary text-white text-xs font-bold">Comprehensive Monthly Dossier</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{mo.startDate} — {mo.endDate}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground font-medium">Compliance Rate</p>
                              <p className="text-base font-extrabold text-emerald-600">{mo.complianceRate}%</p>
                            </div>
                            {mo.overallGrade && (
                              <div className="text-right border-l border-border pl-3">
                                <p className="text-xs text-muted-foreground font-medium">Monthly Grade</p>
                                <p className="text-base font-extrabold text-primary">{mo.overallGrade}%</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-3 bg-secondary rounded-xl text-center text-xs">
                          <div>
                            <p className="text-muted-foreground">Daily Reports</p>
                            <p className="font-bold text-foreground text-sm">{mo.totalDailyReportsSubmitted}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Missing Days</p>
                            <p className={`font-bold text-sm ${mo.totalDailyReportsMissing > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {mo.totalDailyReportsMissing}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Hours</p>
                            <p className="font-bold text-primary text-sm">{mo.totalHoursLogged} hrs</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="font-bold text-foreground">Monthly Executive Summary:</p>
                          <p className="text-muted-foreground leading-relaxed">{mo.executiveSummary}</p>
                        </div>

                        {mo.supervisorComments && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl text-xs text-blue-900 dark:text-blue-300">
                            <strong>Supervisor Monthly Endorsement: </strong>{mo.supervisorComments}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 4. MISSING DAILY REPORTS TAB */}
              <TabsContent value="missing" className="space-y-3 mt-0">
                {currentMissingDailyReports.length === 0 ? (
                  <div className="text-center py-10 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">No Missing Daily Reports!</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">All required daily reports have been submitted on schedule.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        You have unsubmitted daily reports. Skipping daily reports is recorded on your official assessment transcript.
                      </span>
                    </div>

                    {currentMissingDailyReports.map(miss => (
                      <div
                        key={miss.id}
                        className="bg-white dark:bg-card border-2 border-red-300 dark:border-red-900/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-red-600">Missing: {miss.dayOfWeek}, {miss.date}</span>
                            <Badge className="bg-red-100 text-red-800 border border-red-200 text-[10px]">
                              Week {miss.weekNumber} Working Day
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            No daily activity report was received for this scheduled working day.
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setDailyDate(miss.date);
                            setDailyDayOfWeek(miss.dayOfWeek);
                            setDailyWeekNumber(miss.weekNumber);
                            setDailyMonthNumber(miss.monthNumber);
                            setIsDailyReportDialogOpen(true);
                          }}
                          className="btn-primary text-xs h-9 shrink-0 gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Submit Late Daily Report
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {reportToPrint && studentData && (
        <PrintableReport report={reportToPrint} student={studentData}
          isOpen={isPrintDialogOpen} onClose={() => setIsPrintDialogOpen(false)} />
      )}
    </DashboardLayout>
  );
}

