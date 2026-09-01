import { useState } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { PrintableReport } from '../components/PrintableReport';
import { Eye, Users, Clock, FileText, CheckCircle, Download, Calendar, Star, TrendingUp, MapPin, Building2, MapPinCheck, CheckCircle2, FolderKanban } from 'lucide-react';
import { Report, Student, DailyReport } from '../types';
import { downloadApiFile } from '../api';
import { Badge } from '../components/ui/badge';

export function SupervisorDashboard() {
  const { user } = useAuth();
  const {
    reports, students, supervisors, updateReport,
    dailyReports, weeklyUpdates, monthlyReports, missingDailyReports, reviewDailyReport
  } = useData();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Inspector modal states for Student Daily/Weekly/Monthly Reports
  const [selectedStudentForReports, setSelectedStudentForReports] = useState<Student | null>(null);
  const [isStudentReportsModalOpen, setIsStudentReportsModalOpen] = useState(false);
  const [selectedDailyForReview, setSelectedDailyForReview] = useState<DailyReport | null>(null);
  const [isDailyReviewModalOpen, setIsDailyReviewModalOpen] = useState(false);
  const [dailyReviewFeedback, setDailyReviewFeedback] = useState('');
  const [dailyReviewGrade, setDailyReviewGrade] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportDateFilter, setReportDateFilter] = useState('');
  const [reportWeekFilter, setReportWeekFilter] = useState('');
  const [reportMonthFilter, setReportMonthFilter] = useState('');

  const [attendance, setAttendance] = useState('');
  const [performance, setPerformance] = useState('');
  const [reportQuality, setReportQuality] = useState('');
  const [professionalism, setProfessionalism] = useState('');
  const [feedback, setFeedback] = useState('');

  const [reportToPrint, setReportToPrint] = useState<Report | null>(null);
  const [studentOfReport, setStudentOfReport] = useState<Student | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  const supervisorData = supervisors.find(s => s.email === user?.email);
  const assignedStudents = students.filter(st => supervisorData?.assignedStudents.includes(st.id));
  const supervisorReports = reports.filter(r => assignedStudents.some(st => st.id === r.studentId));

  const pendingReports = supervisorReports.filter(r => r.status === 'pending');
  const reviewedReports = supervisorReports.filter(r => r.status === 'reviewed');
  const gradedReports = supervisorReports.filter(r => r.status === 'graded');


  const getFilteredSubmissionRows = (student: Student) => {
    const rows = [
      ...dailyReports
        .filter(report => report.studentId === student.id)
        .map(report => ({
          id: report.id,
          date: report.date,
          dayOfWeek: report.dayOfWeek,
          title: report.title,
          weekNumber: report.weekNumber,
          monthNumber: report.monthNumber,
          status: report.status === 'late' ? 'late' : 'submitted',
        })),
      ...missingDailyReports
        .filter(report => report.studentId === student.id)
        .map(report => ({
          id: report.id,
          date: report.date,
          dayOfWeek: report.dayOfWeek,
          title: report.status === 'late_submitted' ? 'Late report submitted after missing mark' : 'Daily report not submitted',
          weekNumber: report.weekNumber,
          monthNumber: report.monthNumber,
          status: report.status === 'late_submitted' ? 'late' : 'missing',
        })),
    ];

    const today = new Date().toISOString().split('T')[0];
    if (!rows.some(row => row.date === today)) {
      const date = new Date(`${today}T00:00:00`);
      rows.push({
        id: `pending-${student.id}-${today}`,
        date: today,
        dayOfWeek: date.toLocaleDateString('default', { weekday: 'long' }),
        title: 'Daily report required today',
        weekNumber: Math.ceil((((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7),
        monthNumber: date.getMonth() + 1,
        status: 'pending',
      });
    }

    return rows
      .filter(row => reportStatusFilter === 'all' || row.status === reportStatusFilter)
      .filter(row => !reportDateFilter || row.date === reportDateFilter)
      .filter(row => !reportWeekFilter || row.weekNumber === Number(reportWeekFilter))
      .filter(row => !reportMonthFilter || row.monthNumber === Number(reportMonthFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  };
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await downloadApiFile('/reports/export/csv', 'supervisor_reports.csv');
      toast.success('Reports exported successfully');
    } catch {
      toast.error('Failed to export reports');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenGrading = (report: Report) => {
    setSelectedReport(report);
    setAttendance(report.grade ? '90' : '');
    setPerformance(report.grade ? '85' : '');
    setReportQuality(report.grade ? '80' : '');
    setProfessionalism(report.grade ? '90' : '');
    setFeedback(report.feedback || '');
    setIsGradingDialogOpen(true);
  };

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    const overallGrade = Math.round(
      (parseFloat(attendance) + parseFloat(performance) + parseFloat(reportQuality) + parseFloat(professionalism)) / 4
    );
    updateReport(selectedReport.id, { status: 'graded', grade: overallGrade, feedback });
    toast.success('Report graded successfully!');
    setIsGradingDialogOpen(false);
    setAttendance(''); setPerformance(''); setReportQuality('');
    setProfessionalism(''); setFeedback(''); setSelectedReport(null);
  };

  const handleProvideFeedback = (report: Report, feedbackText: string) => {
    updateReport(report.id, { status: 'reviewed', feedback: feedbackText });
    toast.success('Feedback submitted!');
  };

  const statusBadge = (status: string) => {
    if (status === 'graded') return <span className="badge-green inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"><CheckCircle className="w-3 h-3" />Graded</span>;
    if (status === 'reviewed') return <span className="badge-blue inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"><Clock className="w-3 h-3" />Reviewed</span>;
    return <span className="badge-amber inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"><Clock className="w-3 h-3" />Pending</span>;
  };

  const ReportCard = ({ report }: { report: Report }) => (
    <div className="card-clean rounded-xl p-4 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm">{report.title}</span>
            {statusBadge(report.status)}
            {report.grade !== undefined && <span className="text-primary font-bold text-sm">{report.grade}/100</span>}
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-1">Student: <span className="text-foreground">{report.studentName}</span></p>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{report.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.submittedDate).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{report.fileName}</span>
          </div>
          {report.feedback && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800"><span className="font-semibold">Feedback: </span>{report.feedback}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={() => handleOpenGrading(report)}
            className="btn-primary px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">
            {report.status === 'graded' ? 'Update Grade' : 'Grade Report'}
          </button>
          {report.status === 'graded' && (
            <Button variant="outline" size="sm" className="gap-1 text-xs"
              onClick={() => {
                const st = assignedStudents.find(s => s.id === report.studentId);
                if (st) { setReportToPrint(report); setStudentOfReport(st); setIsPrintDialogOpen(true); }
              }}>
              <Eye className="w-3 h-3" /> View
            </Button>
          )}
          {report.status === 'pending' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">Quick Feedback</Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl">
                <DialogHeader>
                  <DialogTitle>Provide Feedback</DialogTitle>
                  <DialogDescription>Add feedback without grading</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleProvideFeedback(report, fd.get('feedback') as string);
                  }}
                  className="space-y-4 pt-2"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="fb">Feedback</Label>
                    <Textarea id="fb" name="feedback" placeholder="Enter your feedback..." rows={4} required />
                  </div>
                  <button type="submit" className="btn-primary w-full h-10 rounded-lg">Submit Feedback</button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );

  const stats = [
    { label: 'Assigned Students', value: assignedStudents.length, icon: Users, gradient: 'stat-card-blue' },
    { label: 'Pending Reports', value: pendingReports.length, icon: Clock, gradient: 'stat-card-amber' },
    { label: 'Reviewed', value: reviewedReports.length, icon: FileText, gradient: 'stat-card-violet' },
    { label: 'Graded', value: gradedReports.length, icon: CheckCircle, gradient: 'stat-card-green' },
  ];

  return (
    <DashboardLayout title="Supervisor Dashboard">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`${s.gradient} rounded-xl p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-xs font-medium">{s.label}</span>
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Location Allocation & Attendance Quick Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <MapPinCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Attachment Location Allocation & Daily Monitoring</h3>
              <p className="text-xs text-muted-foreground">
                Manage company locations, allocate students, and verify daily submitted GPS attendance coordinates.
              </p>
            </div>
          </div>

          <Link to="/supervisor/locations" className="shrink-0">
            <Button className="btn-primary gap-2 h-10 px-4 rounded-xl text-xs font-semibold shadow-xs">
              <Building2 className="w-4 h-4" /> Manage Locations & Attendance
            </Button>
          </Link>
        </div>

        {/* Assigned Students */}
        <div className="card-clean rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">Assigned Students</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Students under your supervision</p>
            </div>
          </div>
          <div className="p-5">
            {assignedStudents.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No students assigned yet
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {assignedStudents.map(student => {
                  const sReports = supervisorReports.filter(r => r.studentId === student.id);
                  const graded = sReports.filter(r => r.status === 'graded').length;
                  const avg = graded > 0 ? Math.round(sReports.filter(r => r.grade).reduce((a, r) => a + (r.grade || 0), 0) / graded) : null;

                  const sDailies = dailyReports.filter(d => d.studentId === student.id);
                  const sMissing = missingDailyReports.filter(m => m.studentId === student.id);
                  const expected = sDailies.length + sMissing.length || 10;
                  const compliance = Math.round((sDailies.length / Math.max(expected, 1)) * 100);

                  return (
                    <div key={student.id} className="p-5 bg-secondary/40 rounded-2xl border border-border flex flex-col justify-between gap-3.5 shadow-2xs hover:border-primary/40 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl stat-card-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-foreground truncate">{student.name}</p>
                              {sMissing.length > 0 ? (
                                <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-bold">
                                  {sMissing.length} Missing
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                  Up to Date
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{student.company || 'No company'} • Level {student.currentLevel || 1}00</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-foreground">{sReports.length} reports</p>
                            {avg !== null && (
                              <p className="text-xs text-primary font-semibold flex items-center gap-0.5 justify-end">
                                <Star className="w-3 h-3" />{avg}%
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Daily Reporting Compliance Gauge */}
                        <div className="p-3 bg-white dark:bg-card border border-border rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="font-medium">Daily Reporting Progress:</span>
                            <span className="font-bold text-foreground">{sDailies.length} Days Logged • {compliance}% Rate</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${sMissing.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${compliance}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{student.assignedLocationName || 'Location Not Allocated'}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStudentForReports(student);
                              setIsStudentReportsModalOpen(true);
                            }}
                            className="btn-primary text-xs h-8 px-3 rounded-lg gap-1.5 font-semibold"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Daily & Weekly Logs
                          </Button>

                          <Link
                            to={`/student/your-reports-uploaded?studentId=${student.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary/10 text-foreground hover:text-primary font-semibold transition-colors border border-border text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> Level Reports
                          </Link>

                          <Link
                            to={`/student/progress?studentId=${student.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary/10 text-foreground hover:text-primary font-semibold transition-colors border border-border text-xs"
                          >
                            <TrendingUp className="w-3.5 h-3.5" /> Progress
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Reports */}
        <div className="card-clean rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">Student Reports</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Review and grade submitted reports</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV} disabled={isExporting}>
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
          <div className="p-4 sm:p-5">
            <Tabs defaultValue="pending">
              <TabsList className="bg-secondary mb-4 h-auto min-h-9 p-1 rounded-xl w-full flex overflow-x-auto justify-start flex-nowrap scrollbar-none gap-1">
                <TabsTrigger value="pending" className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">Pending ({pendingReports.length})</TabsTrigger>
                <TabsTrigger value="reviewed" className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">Reviewed ({reviewedReports.length})</TabsTrigger>
                <TabsTrigger value="graded" className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">Graded ({gradedReports.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="space-y-3 mt-0">
                {pendingReports.length === 0
                  ? <div className="text-center py-10 text-muted-foreground text-sm">No pending reports</div>
                  : pendingReports.map(r => <ReportCard key={r.id} report={r} />)}
              </TabsContent>
              <TabsContent value="reviewed" className="space-y-3 mt-0">
                {reviewedReports.length === 0
                  ? <div className="text-center py-10 text-muted-foreground text-sm">No reviewed reports</div>
                  : reviewedReports.map(r => <ReportCard key={r.id} report={r} />)}
              </TabsContent>
              <TabsContent value="graded" className="space-y-3 mt-0">
                {gradedReports.length === 0
                  ? <div className="text-center py-10 text-muted-foreground text-sm">No graded reports yet</div>
                  : gradedReports.map(r => <ReportCard key={r.id} report={r} />)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Grade Dialog */}
      <Dialog open={isGradingDialogOpen} onOpenChange={setIsGradingDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Grade Report: {selectedReport?.title}</DialogTitle>
            <DialogDescription>Assess student performance on multiple criteria</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { id: 'attendance', label: 'Attendance (0-100)', val: attendance, set: setAttendance },
                { id: 'performance', label: 'Performance (0-100)', val: performance, set: setPerformance },
                { id: 'reportQuality', label: 'Report Quality (0-100)', val: reportQuality, set: setReportQuality },
                { id: 'professionalism', label: 'Professionalism (0-100)', val: professionalism, set: setProfessionalism },
              ].map(f => (
                <div key={f.id} className="space-y-1.5">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input id={f.id} type="number" min="0" max="100" placeholder="0–100"
                    value={f.val} onChange={e => f.set(e.target.value)} required />
                </div>
              ))}
            </div>

            {attendance && performance && reportQuality && professionalism && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Calculated Overall Grade</span>
                <span className="text-2xl font-bold text-primary">
                  {Math.round((parseFloat(attendance) + parseFloat(performance) + parseFloat(reportQuality) + parseFloat(professionalism)) / 4)}/100
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="gradeFeedback">Feedback & Comments</Label>
              <Textarea id="gradeFeedback" placeholder="Provide detailed feedback on the student's performance..."
                rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} required />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => setIsGradingDialogOpen(false)}>Cancel</Button>
              <button type="submit" className="btn-primary flex-1 h-10 rounded-lg">Submit Grade</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SUPERVISOR STUDENT REPORTS INSPECTOR MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={isStudentReportsModalOpen} onOpenChange={setIsStudentReportsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  {selectedStudentForReports?.name}'s Attendance & Work Reports
                </DialogTitle>
                <DialogDescription>
                  Inspect daily submissions, weekly synthesized updates, monthly dossiers, and track missing reports.
                </DialogDescription>
              </div>

              {selectedStudentForReports && (() => {
                const sDailies = dailyReports.filter(d => d.studentId === selectedStudentForReports.id);
                const sMiss = missingDailyReports.filter(m => m.studentId === selectedStudentForReports.id);
                const expected = sDailies.length + sMiss.length || 10;
                const rate = Math.round((sDailies.length / Math.max(expected, 1)) * 100);

                return (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {sDailies.length} Days Logged
                    </Badge>
                    <Badge className={sMiss.length > 0 ? 'bg-red-600 text-white text-xs' : 'bg-emerald-600 text-white text-xs'}>
                      {rate}% Compliance ({sMiss.length} Missing)
                    </Badge>
                  </div>
                );
              })()}
            </div>
          </DialogHeader>

          {selectedStudentForReports && (
            <Tabs defaultValue="daily" className="space-y-4 pt-2">
              <TabsList className="bg-secondary p-1 h-10 rounded-xl">
                <TabsTrigger value="daily" className="text-xs font-semibold px-3.5 rounded-lg">
                  Daily Reports ({dailyReports.filter(d => d.studentId === selectedStudentForReports.id).length})
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs font-semibold px-3.5 rounded-lg">
                  Weekly Updates ({weeklyUpdates.filter(w => w.studentId === selectedStudentForReports.id).length})
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs font-semibold px-3.5 rounded-lg">
                  Monthly Reports ({monthlyReports.filter(m => m.studentId === selectedStudentForReports.id).length})
                </TabsTrigger>
                <TabsTrigger value="missing" className="text-xs font-semibold px-3.5 rounded-lg text-red-600 data-[state=active]:text-red-600">
                  Missing Reports ({missingDailyReports.filter(m => m.studentId === selectedStudentForReports.id).length})
                </TabsTrigger>
              </TabsList>

              {/* 1. DAILY REPORTS INSPECTION */}
              <TabsContent value="daily" className="space-y-3 mt-0">
                {dailyReports.filter(d => d.studentId === selectedStudentForReports.id).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No daily reports submitted yet by this student.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {dailyReports
                      .filter(d => d.studentId === selectedStudentForReports.id)
                      .map(dr => (
                        <div
                          key={dr.id}
                          className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/70 transition-colors"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
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
                                  <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-foreground">{dr.title}</p>
                            <p className="text-xs text-muted-foreground">{dr.tasksCompleted}</p>

                            {dr.skillsAcquired && (
                              <p className="text-[11px] text-primary font-medium">
                                Skills: {dr.skillsAcquired} {dr.equipmentOrTools ? `• Tools: ${dr.equipmentOrTools}` : ''}
                              </p>
                            )}

                            {dr.feedback && (
                              <p className="text-xs text-blue-900 dark:text-blue-300 italic bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md">
                                Remark: "{dr.feedback}"
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDailyForReview(dr);
                                setDailyReviewFeedback(dr.feedback || '');
                                setDailyReviewGrade(dr.grade ? String(dr.grade) : '85');
                                setIsDailyReviewModalOpen(true);
                              }}
                              className="gap-1 text-xs"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              {dr.grade !== undefined ? 'Edit Grade' : 'Review & Grade'}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* 2. WEEKLY UPDATES INSPECTION */}
              <TabsContent value="weekly" className="space-y-3 mt-0">
                <div className="grid gap-3">
                  {weeklyUpdates
                    .filter(w => w.studentId === selectedStudentForReports.id)
                    .map(wk => (
                      <div key={wk.id} className="bg-white dark:bg-card border border-border p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">Week {wk.weekNumber} Summary</h4>
                            <Badge className={wk.status === 'complete' ? 'bg-emerald-600 text-white text-[10px]' : 'bg-amber-100 text-amber-800 text-[10px]'}>
                              {wk.submittedDaysCount}/5 Days Logged ({wk.missingDaysCount} Missing)
                            </Badge>
                          </div>
                          <span className="text-xs font-bold text-primary">{wk.totalHoursWorked} Logged Hours</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{wk.summaryHighlights}</p>
                      </div>
                    ))}
                </div>
              </TabsContent>

              {/* 3. MONTHLY REPORTS INSPECTION */}
              <TabsContent value="monthly" className="space-y-3 mt-0">
                <div className="grid gap-3">
                  {monthlyReports
                    .filter(m => m.studentId === selectedStudentForReports.id)
                    .map(mo => (
                      <div key={mo.id} className="bg-white dark:bg-card border-2 border-primary/20 p-5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base text-foreground">{mo.monthName}</h4>
                          <span className="text-sm font-bold text-emerald-600">{mo.complianceRate}% Compliance</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{mo.executiveSummary}</p>
                        <div className="flex gap-4 text-xs font-semibold text-foreground pt-1 border-t border-border">
                          <span>Submitted: {mo.totalDailyReportsSubmitted} Days</span>
                          <span className="text-red-600">Missing: {mo.totalDailyReportsMissing} Days</span>
                          <span className="text-primary">Total Hours: {mo.totalHoursLogged} hrs</span>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              {/* 4. MISSING DAILY REPORTS INSPECTION */}
              <TabsContent value="missing" className="space-y-3 mt-0">
                {missingDailyReports.filter(m => m.studentId === selectedStudentForReports.id).length === 0 ? (
                  <div className="text-center py-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Perfect Record!</p>
                    <p className="text-xs text-muted-foreground">Student has submitted all daily reports without missing any work days.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {missingDailyReports
                      .filter(m => m.studentId === selectedStudentForReports.id)
                      .map(miss => (
                        <div key={miss.id} className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-red-700 dark:text-red-400">Missing: {miss.dayOfWeek}, {miss.date}</p>
                            <p className="text-muted-foreground">Week {miss.weekNumber} scheduled industrial working day</p>
                          </div>
                          <Badge className="bg-red-600 text-white text-[10px]">Unsubmitted Log</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DAILY REPORT REVIEW / GRADING MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={isDailyReviewModalOpen} onOpenChange={setIsDailyReviewModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Grade Daily Report</DialogTitle>
            <DialogDescription>
              {selectedDailyForReview?.dayOfWeek}, {selectedDailyForReview?.date} • {selectedDailyForReview?.title}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedDailyForReview) return;
              reviewDailyReport(
                selectedDailyForReview.id,
                dailyReviewFeedback,
                dailyReviewGrade ? Number(dailyReviewGrade) : undefined
              );
              setIsDailyReviewModalOpen(false);
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="dGrade">Grade Score (0–100)</Label>
              <Input
                id="dGrade"
                type="number"
                min="0"
                max="100"
                value={dailyReviewGrade}
                onChange={e => setDailyReviewGrade(e.target.value)}
                placeholder="e.g. 90"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dFeed">Supervisor Feedback / Remarks</Label>
              <Textarea
                id="dFeed"
                rows={3}
                value={dailyReviewFeedback}
                onChange={e => setDailyReviewFeedback(e.target.value)}
                placeholder="Provide constructive evaluation for this day's tasks..."
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDailyReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary flex-1">
                Save Daily Grade
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {reportToPrint && studentOfReport && (
        <PrintableReport report={reportToPrint} student={studentOfReport}
          isOpen={isPrintDialogOpen} onClose={() => setIsPrintDialogOpen(false)} />
      )}
    </DashboardLayout>
  );
}

