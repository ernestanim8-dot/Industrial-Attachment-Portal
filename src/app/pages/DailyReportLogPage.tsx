import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ArrowLeft, FileText, Calendar, CheckCircle2,
  Clock, XCircle, Upload, Plus, Trash2
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { ActivityItem } from '../types';

type ReportView = 'daily' | 'weekly' | 'monthly' | 'status';
type SubmissionStatus = 'submitted' | 'missing' | 'pending' | 'late';

const getStatusStyles = (status: SubmissionStatus) => {
  if (status === 'submitted') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'late') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'missing') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
};

const getWeekNumber = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export function DailyReportLogPage() {
  const { user } = useAuth();
  const {
    students,
    dailyReports,
    missingDailyReports,
    weeklyUpdates,
    monthlyReports,
    addDailyReport,
    addWeeklyReport,
    addMonthlyReport,
    addReport,
  } = useData();

  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ReportView>('daily');

  const [isDailyReportDialogOpen, setIsDailyReportDialogOpen] = useState(false);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyTasks, setDailyTasks] = useState('');
  const [dailySkills, setDailySkills] = useState('');
  const [dailyChallenges, setDailyChallenges] = useState('');
  const [dailyHours, setDailyHours] = useState('8');
  const [dailyTools, setDailyTools] = useState('');

  const [isPeriodicUploadOpen, setIsPeriodicUploadOpen] = useState(false);
  const [periodicKind, setPeriodicKind] = useState<'weekly' | 'monthly'>('weekly');
  const [periodicWeek, setPeriodicWeek] = useState(1);
  const [periodicActivities, setPeriodicActivities] = useState<ActivityItem[]>([{ title: '', description: '' }]);
  const [periodicSummary, setPeriodicSummary] = useState('');

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docWeekNumber, setDocWeekNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  const targetStudentId = searchParams.get('studentId');
  const studentData = targetStudentId
    ? students.find(student => student.id === targetStudentId)
    : students.find(student => student.email === user?.email || student.id === user?.id) || students[0];

  const studentDailyReports = dailyReports.filter(report => report.studentId === studentData?.id);
  const studentMissingReports = missingDailyReports.filter(report => report.studentId === studentData?.id);
  const studentWeeklyUpdates = weeklyUpdates.filter(report => report.studentId === studentData?.id);
  const studentMonthlyReports = monthlyReports.filter(report => report.studentId === studentData?.id);

  const statusRows = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pendingToday = studentDailyReports.some(report => report.date === today) || studentMissingReports.some(report => report.date === today)
      ? []
      : [{ id: `pending-${today}`, date: today, dayOfWeek: new Date().toLocaleDateString('default', { weekday: 'long' }) }];

    const submitted = studentDailyReports.map(report => ({
      id: report.id,
      date: report.date,
      dayOfWeek: report.dayOfWeek,
      title: report.title,
      status: report.status === 'late' ? 'late' as const : 'submitted' as const,
      weekNumber: report.weekNumber,
      monthNumber: report.monthNumber,
    }));
    const missing = studentMissingReports.map(report => ({
      id: report.id,
      date: report.date,
      dayOfWeek: report.dayOfWeek,
      title: 'Daily report not submitted',
      status: 'missing' as const,
      weekNumber: report.weekNumber,
      monthNumber: report.monthNumber,
    }));
    const pending = pendingToday.map(report => ({
      id: report.id,
      date: report.date,
      dayOfWeek: report.dayOfWeek,
      title: 'Daily report required today',
      status: 'pending' as const,
      weekNumber: getWeekNumber(report.date),
      monthNumber: new Date(`${report.date}T00:00:00`).getMonth() + 1,
    }));

    return [...submitted, ...missing, ...pending].sort((a, b) => b.date.localeCompare(a.date));
  }, [studentDailyReports, studentMissingReports]);

  const totalRequired = statusRows.length;
  const submittedCount = statusRows.filter(row => row.status === 'submitted' || row.status === 'late').length;
  const missingCount = statusRows.filter(row => row.status === 'missing').length;
  const pendingCount = statusRows.filter(row => row.status === 'pending').length;
  const lateCount = statusRows.filter(row => row.status === 'late').length;
  const dailyProgress = totalRequired > 0 ? Math.round((submittedCount / totalRequired) * 100) : 0;
  const weeklyProgress = studentWeeklyUpdates.length > 0
    ? Math.round(studentWeeklyUpdates.reduce((sum, week) => sum + (week.submittedDaysCount / Math.max(week.submittedDaysCount + week.missingDaysCount, 1)) * 100, 0) / studentWeeklyUpdates.length)
    : 0;
  const monthlyProgress = studentMonthlyReports.length > 0 ? studentMonthlyReports[0].complianceRate : 0;

  const handleDailySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentData) return;
    if (studentDailyReports.some(report => report.date === dailyDate)) {
      toast.error('A daily report already exists for this date.');
      return;
    }

    const date = new Date(`${dailyDate}T00:00:00`);
    const isLate = dailyDate < today || new Date().getHours() >= 17;

    addDailyReport({
      studentId: studentData.id,
      studentName: studentData.name,
      date: dailyDate,
      dayOfWeek: date.toLocaleDateString('default', { weekday: 'long' }),
      weekNumber: getWeekNumber(dailyDate),
      monthNumber: date.getMonth() + 1,
      monthName: date.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
      title: dailyTitle,
      tasksCompleted: dailyTasks,
      skillsAcquired: dailySkills,
      challengesFaced: dailyChallenges,
      hoursWorked: Number(dailyHours) || 0,
      equipmentOrTools: dailyTools,
      locationVerified: studentData.dailyLocationStatus === 'on_site',
      status: isLate ? 'late' : 'submitted',
    } as Parameters<typeof addDailyReport>[0]);

    toast.success('Daily report submitted successfully!');
    setIsDailyReportDialogOpen(false);
    setDailyTitle('');
    setDailyTasks('');
    setDailySkills('');
    setDailyChallenges('');
    setDailyHours('8');
    setDailyTools('');
  };

  const handlePeriodicSubmit = () => {
    const sId = studentData?.id || user?.id || 'student1';
    const validActivities = periodicActivities.filter(activity => activity.title.trim());

    if (validActivities.length === 0) {
      toast.error('Please add at least one activity title.');
      return;
    }

    const activitySummary = validActivities
      .map((activity, index) => `Activity ${index + 1}: ${activity.title}${activity.description ? ` - ${activity.description}` : ''}`)
      .join('\n');

    if (periodicKind === 'weekly') {
      const derivedMonth = Math.ceil(periodicWeek / 4);
      addWeeklyReport({
        studentId: sId,
        weekNumber: periodicWeek,
        monthNumber: derivedMonth,
        startDate: '',
        endDate: '',
        dailyReports: [],
        activities: validActivities,
        missingDaysCount: 0,
        submittedDaysCount: validActivities.length,
        totalHoursWorked: validActivities.reduce((sum, activity) => sum + (activity.hours || 0), 0),
        summaryHighlights: activitySummary,
        status: 'complete',
      });
    } else {
      const studentWeekly = weeklyUpdates.filter(week => week.studentId === sId);
      const allWeekActivities = studentWeekly.flatMap(week => week.activities || []);
      const monthSummary = allWeekActivities.length > 0
        ? allWeekActivities.map((activity, index) => `Activity ${index + 1}: ${activity.title}`).join('\n')
        : periodicSummary || activitySummary;
      const derivedMonth = Math.ceil(periodicWeek / 4);

      addMonthlyReport({
        studentId: sId,
        monthNumber: derivedMonth,
        monthName: `Month ${derivedMonth}`,
        startDate: '',
        endDate: '',
        weeks: studentWeekly,
        totalDailyReportsSubmitted: studentWeekly.reduce((sum, week) => sum + week.submittedDaysCount, 0),
        totalDailyReportsMissing: studentWeekly.reduce((sum, week) => sum + week.missingDaysCount, 0),
        totalHoursLogged: studentWeekly.reduce((sum, week) => sum + week.totalHoursWorked, 0),
        complianceRate: 100,
        executiveSummary: monthSummary,
        status: 'generated',
      });
    }

    toast.success(`${periodicKind === 'weekly' ? 'Weekly' : 'Monthly'} report submitted!`);
    setIsPeriodicUploadOpen(false);
    setPeriodicActivities([{ title: '', description: '' }]);
    setPeriodicSummary('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
      setFileName(event.target.files[0].name);
    }
  };

  const handleSubmitDocReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    setIsUploading(true);
    try {
      await addReport({
        studentId: user?.id || studentData?.id || '',
        studentName: user?.name || studentData?.name || '',
        title: docTitle,
        description: docDescription,
        weekNumber: docWeekNumber ? parseInt(docWeekNumber) : undefined,
        fileName,
        fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
      });
      toast.success('Report document uploaded successfully!');
      setIsUploadDialogOpen(false);
      setDocTitle('');
      setDocDescription('');
      setDocWeekNumber('');
      setFileName('');
      setSelectedFile(null);
    } catch {
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout title="Daily Report Log">
      <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
          <div>
            <Link to={user?.role === 'supervisor' ? '/supervisor' : '/student'} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-extrabold text-foreground">Daily Report Log</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                Daily • Weekly • Monthly
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Submit daily work logs. Weekly updates and monthly reports appear here when uploaded.
            </p>
          </div>

          {user?.role === 'student' && (
            <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Dialog open={isDailyReportDialogOpen} onOpenChange={setIsDailyReportDialogOpen}>
                  <Button onClick={() => setIsDailyReportDialogOpen(true)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white gap-2 h-10 px-5 rounded-full text-xs font-semibold shadow-xs transition-colors">
                    <Calendar className="w-4 h-4" /> Submit Daily Report
                  </Button>
                  <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Daily Work Report Submission</DialogTitle>
                      <DialogDescription>Submit your required daily attachment work log.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDailySubmit} className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label htmlFor="dailyDate">Working Date</Label><Input id="dailyDate" type="date" value={dailyDate} onChange={event => setDailyDate(event.target.value)} required /></div>
                        <div className="space-y-1.5"><Label htmlFor="dailyHours">Hours Worked</Label><Input id="dailyHours" type="number" min="1" max="24" value={dailyHours} onChange={event => setDailyHours(event.target.value)} required /></div>
                      </div>
                      <div className="space-y-1.5"><Label htmlFor="dailyTitle">Report Title</Label><Input id="dailyTitle" placeholder="e.g. System Integration and Testing" value={dailyTitle} onChange={event => setDailyTitle(event.target.value)} required /></div>
                      <div className="space-y-1.5"><Label htmlFor="dailyTasks">Tasks Completed</Label><Textarea id="dailyTasks" rows={4} placeholder="Describe specific tasks completed today..." value={dailyTasks} onChange={event => setDailyTasks(event.target.value)} required /></div>
                      <div className="space-y-1.5"><Label htmlFor="dailySkills">Skills Acquired</Label><Input id="dailySkills" placeholder="e.g. React hooks, TypeScript" value={dailySkills} onChange={event => setDailySkills(event.target.value)} /></div>
                      <div className="space-y-1.5"><Label htmlFor="dailyTools">Tools Used</Label><Input id="dailyTools" placeholder="e.g. VS Code, PostgreSQL" value={dailyTools} onChange={event => setDailyTools(event.target.value)} /></div>
                      <div className="space-y-1.5"><Label htmlFor="dailyChallenges">Challenges Faced</Label><Textarea id="dailyChallenges" rows={3} placeholder="Challenges encountered and how you solved them..." value={dailyChallenges} onChange={event => setDailyChallenges(event.target.value)} /></div>
                      <Button type="submit" className="w-full btn-primary rounded-xl h-11">Submit Daily Report</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isPeriodicUploadOpen} onOpenChange={setIsPeriodicUploadOpen}>
                  <Button onClick={() => setIsPeriodicUploadOpen(true)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white gap-2 h-10 px-5 rounded-full text-xs font-semibold shadow-xs transition-colors">
                    <Upload className="w-4 h-4" /> Upload Weekly/Monthly Report
                  </Button>
                  <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" />Upload Weekly / Monthly Report</DialogTitle>
                      <DialogDescription>Select the report type, pick a week, then list each activity performed.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <Button type="button" variant={periodicKind === 'weekly' ? 'default' : 'outline'} onClick={() => setPeriodicKind('weekly')} className="h-10 rounded-xl text-xs font-semibold">Weekly Report</Button>
                        <Button type="button" variant={periodicKind === 'monthly' ? 'default' : 'outline'} onClick={() => setPeriodicKind('monthly')} className="h-10 rounded-xl text-xs font-semibold">Monthly Summary</Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pWeek">{periodicKind === 'weekly' ? 'Week Number' : 'Reference Week (for month derivation)'}</Label>
                        <select id="pWeek" value={periodicWeek} onChange={event => setPeriodicWeek(Number(event.target.value))} className="w-full h-10 px-3 border border-input rounded-lg bg-background text-sm">
                          {Array.from({ length: 24 }, (_, index) => index + 1).map(week => <option key={week} value={week}>Week {week}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold">{periodicKind === 'weekly' ? 'Activities This Week' : 'Activities This Period'}</Label>
                          <button type="button" onClick={() => setPeriodicActivities(prev => [...prev, { title: '', description: '' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Add Activity</button>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {periodicActivities.map((activity, index) => (
                            <div key={index} className="p-3 bg-secondary rounded-xl space-y-2 relative">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-primary">Activity {index + 1}</span>
                                {periodicActivities.length > 1 && <button type="button" onClick={() => setPeriodicActivities(prev => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500 hover:text-red-700 transition-colors" title="Remove activity"><Trash2 className="w-3.5 h-3.5" /></button>}
                              </div>
                              <Input placeholder="Activity title" value={activity.title} onChange={event => setPeriodicActivities(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} className="h-9 text-sm" />
                              <Input placeholder="Brief description (optional)" value={activity.description || ''} onChange={event => setPeriodicActivities(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} className="h-9 text-sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button type="button" onClick={handlePeriodicSubmit} className="w-full btn-primary h-11 rounded-xl">Submit {periodicKind === 'weekly' ? 'Weekly' : 'Monthly'} Report</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)} className="border-border text-foreground hover:bg-secondary gap-2 h-9 px-4 rounded-xl text-xs font-medium">
                  <Upload className="w-4 h-4" /> Upload Document
                </Button>
                <DialogContent className="rounded-xl w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Attachment Report Document</DialogTitle>
                    <DialogDescription>Upload your PDF or DOCX report archive</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitDocReport} className="space-y-4 pt-2">
                    <div className="space-y-1.5"><Label htmlFor="docTitle">Report Title</Label><Input id="docTitle" placeholder="e.g. Comprehensive Attachment Documentation" value={docTitle} onChange={event => setDocTitle(event.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="docWeek">Week Number (optional)</Label><Input id="docWeek" type="number" placeholder="1" value={docWeekNumber} onChange={event => setDocWeekNumber(event.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="docDescription">Description</Label><Textarea id="docDescription" placeholder="Brief summary of activities..." rows={3} value={docDescription} onChange={event => setDocDescription(event.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="docFile">File (PDF or DOCX)</Label><Input id="docFile" type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} required />{fileName && <p className="text-xs text-muted-foreground">Selected: {fileName}</p>}</div>
                    <Button type="submit" disabled={isUploading} className="btn-primary w-full h-11 rounded-lg disabled:opacity-60">{isUploading ? 'Uploading...' : 'Submit Report Document'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Submitted', value: submittedCount, status: 'submitted' as const, icon: CheckCircle2 },
            { label: 'Missing', value: missingCount, status: 'missing' as const, icon: XCircle },
            { label: 'Pending', value: pendingCount, status: 'pending' as const, icon: Clock },
            { label: 'Late', value: lateCount, status: 'late' as const, icon: Calendar }
          ].map(item => {
            const Icon = item.icon;
            return <div key={item.label} className="bg-white dark:bg-card border border-border rounded-2xl p-4 shadow-sm"><Icon className="w-5 h-5 text-primary" /><p className="text-2xl font-extrabold text-foreground mt-2">{item.value}</p><p className="text-xs font-semibold text-muted-foreground">{item.label}</p></div>;
          })}
        </div>

        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: 'Daily Progress', value: dailyProgress }, { label: 'Weekly Progress', value: weeklyProgress }, { label: 'Monthly Progress', value: monthlyProgress }].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs font-bold"><span>{item.label}</span><span>{item.value}%</span></div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2"><div className="h-full bg-emerald-500" style={{ width: `${item.value}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['daily', 'weekly', 'monthly', 'status'] as ReportView[]).map(item => (
            <button key={item} type="button" onClick={() => setView(item)} className={`h-11 rounded-xl text-sm font-bold capitalize ${view === item ? 'bg-primary text-white' : 'bg-white dark:bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
              {item === 'status' ? 'Submission Status' : `${item} Reports`}
            </button>
          ))}
        </div>

        {view === 'daily' && <div className="grid gap-3">{studentDailyReports.length === 0 ? <Empty label="No daily reports submitted yet." /> : studentDailyReports.map(report => <ReportCard key={report.id} title={report.title} meta={`${report.dayOfWeek}, ${report.date} - Week ${report.weekNumber} - ${report.hoursWorked} hrs`} description={report.tasksCompleted} badge={report.status === 'late' ? 'Late' : 'Submitted'} status={report.status === 'late' ? 'late' : 'submitted'} />)}</div>}
        {view === 'weekly' && <div className="grid gap-3">{studentWeeklyUpdates.length === 0 ? <Empty label="No weekly updates generated yet." /> : studentWeeklyUpdates.map(report => <ReportCard key={report.id} title={`Week ${report.weekNumber} Update`} meta={`${report.startDate} to ${report.endDate}`} description={report.summaryHighlights} badge={`${report.submittedDaysCount}/5 Submitted - ${report.missingDaysCount} Missing`} status={report.missingDaysCount > 0 ? 'missing' : 'submitted'} />)}</div>}
        {view === 'monthly' && <div className="grid gap-3">{studentMonthlyReports.length === 0 ? <Empty label="No monthly reports generated yet." /> : studentMonthlyReports.map(report => <ReportCard key={report.id} title={report.monthName} meta={`${report.complianceRate}% progress - ${report.totalHoursLogged} hours`} description={report.executiveSummary} badge={`${report.totalDailyReportsSubmitted} Submitted - ${report.totalDailyReportsMissing} Missing`} status={report.totalDailyReportsMissing > 0 ? 'missing' : 'submitted'} />)}</div>}
        {view === 'status' && <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-sm overflow-hidden">{statusRows.map(row => <div key={row.id} className="p-4 border-b border-border last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><p className="text-sm font-bold text-foreground">{row.dayOfWeek}, {row.date}</p><p className="text-xs text-muted-foreground">{row.title} - Week {row.weekNumber} - Month {row.monthNumber}</p></div><Badge variant="outline" className={getStatusStyles(row.status)}>{row.status}</Badge></div>)}</div>}
      </div>
    </DashboardLayout>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="bg-white dark:bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function ReportCard({ title, meta, description, badge, status }: { title: string; meta: string; description: string; badge: string; status: SubmissionStatus }) {
  return (
    <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-base font-extrabold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{meta}</p>
          <p className="text-sm text-muted-foreground mt-3">{description}</p>
        </div>
        <Badge variant="outline" className={getStatusStyles(status)}>{badge}</Badge>
      </div>
    </div>
  );
}
