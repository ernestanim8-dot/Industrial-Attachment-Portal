import React, { useState } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  FileText, Activity,
  CheckCircle, Clock, Star,
  ClipboardCheck, FileOutput,
  CreditCard, MapPin, ShieldCheck, AlertTriangle,
  Navigation, CheckCircle2, ShieldAlert,
  FolderKanban
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintableReport } from '../components/PrintableReport';
import { Report } from '../types';

export function StudentDashboard() {
  const { user } = useAuth();
  const {
    reports, students, submitDailyLocationCheckIn
  } = useData();

  const [reportToPrint] = useState<Report | null>(null);
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

  const isUserReport = React.useCallback((sId?: string, sName?: string) => {
    if (!sId && !sName) return true;
    if (sId === user?.id || sId === studentData?.id) return true;
    if (sName && user?.name && sName.toLowerCase() === user.name.toLowerCase()) return true;
    if (sName && studentData?.name && sName.toLowerCase() === studentData.name.toLowerCase()) return true;
    if (sId === 'student1' || sId === 'u-stu-1') return true;
    return false;
  }, [user, studentData]);

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

  // Level Requirements calculation
  const levelRequirementsStats = React.useMemo(() => {
    const studentCurrentLevel = studentData?.currentLevel || 1;
    const reachedLevels: number[] = [];
    for (let lvl = 1; lvl <= studentCurrentLevel && lvl <= 4; lvl++) {
      reachedLevels.push(lvl);
    }

    let requiredMax = 0;
    let completed = 0;

    reachedLevels.forEach(lvl => {
      if (lvl === 1) requiredMax += 1; // Level 100: Attachment
      if (lvl === 2) requiredMax += 1; // Level 200: Attachment
      if (lvl === 3) requiredMax += 2; // Level 300: Semester Out + Attachment
      if (lvl === 4) requiredMax += 1; // Level 400: Final Project

      const proj = studentData?.levelProjects?.find(p => p.level === lvl);
      if (proj && proj.reports && proj.reports.length > 0) {
        if (lvl === 3) {
          completed += Math.min(proj.reports.length, 2);
        } else {
          completed += 1;
        }
      } else {
        const globalForLevel = reports.filter(r => isUserReport(r.studentId, r.studentName) && (r.level === lvl || (lvl === studentCurrentLevel && !r.level)));
        if (lvl === 3) {
          completed += Math.min(globalForLevel.length, 2);
        } else if (globalForLevel.length > 0) {
          completed += 1;
        }
      }
    });

    return {
      completed,
      requiredMax,
      display: `${completed} / ${requiredMax}`,
    };
  }, [studentData, reports, isUserReport]);

  const dashboardCards = [
    { label: 'Daily report log', description: 'View and submit your daily work logs, weekly updates, and monthly reports.', icon: FolderKanban, href: '/student/daily-report-log' },
    { label: 'Log Book Payment', description: 'Pay for your industrial attachment log book and check payment status.', icon: CreditCard, href: '/student/services/fee-payments' },
    { label: 'Attachment Letter', description: 'Generate and print your industrial attachment request letters.', icon: FileOutput, href: '/student/services/attachment-letter' },
    { label: 'Assumption Form', description: 'Submit your assumption of duty forms for attachment.', icon: ClipboardCheck, href: '/student/services/assumption-form' },
  ];

  const stats = [
    { label: 'Progress', value: `${studentData?.progress || 0}%`, icon: Activity, gradient: 'bg-[#6374f6]', extra: <div className="mt-4"><Progress value={studentData?.progress || 0} className="h-1.5 bg-white/30 [&>*]:bg-white" /></div> },
    { label: 'No.of Reports Uploaded', value: levelRequirementsStats.completed, icon: FileText, gradient: 'bg-[#9851f5]', extra: <div className="text-[11px] text-white/80 mt-1 font-medium">{levelRequirementsStats.completed} of {levelRequirementsStats.requiredMax} required uploaded</div> },
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
              <div className={`${s.gradient} rounded-2xl p-5 text-white flex flex-col justify-between min-h-[130px] transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}>
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
            if (s.label === 'Progress') {
              return (
                <Link key={s.label} to="/student/progress" className="block hover:opacity-95 transition-opacity">
                  {cardContent}
                </Link>
              );
            }
            if (s.label === 'No.of Reports Uploaded') {
              const targetPath = user?.role === 'supervisor' ? '/supervisor/your-reports-uploaded' : '/student/your-reports-uploaded';
              return (
                <Link key={s.label} to={targetPath} className="block hover:opacity-95 transition-opacity">
                  {cardContent}
                </Link>
              );
            }
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

        {/* ----------------------------------------------------------- */}
        {/* WORK-ONLY DAILY LOCATION CHECK-IN DIALOG */}
        {/* ----------------------------------------------------------- */}
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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SERVICE CARDS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary transition-colors flex flex-col justify-start min-h-[140px]"
              >
                <Icon className="w-7 h-7 text-muted-foreground mb-3" />
                <h3 className="text-primary font-semibold text-sm mb-1.5">{item.label}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {reportToPrint && studentData && (
        <PrintableReport report={reportToPrint} student={studentData}
          isOpen={isPrintDialogOpen} onClose={() => setIsPrintDialogOpen(false)} />
      )}
    </DashboardLayout>
  );
}





