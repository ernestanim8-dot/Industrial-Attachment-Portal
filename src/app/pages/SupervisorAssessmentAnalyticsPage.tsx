import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, FileText, Award, TrendingUp, AlertTriangle,
  CheckCircle, Star, ChevronDown, ChevronUp, Download,
  BarChart2, Activity, Target, Calendar, ArrowLeft
} from 'lucide-react';
import { Assessment, Student } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const gradeColor = (g: number) => {
  if (g >= 80) return 'text-emerald-600';
  if (g >= 60) return 'text-amber-600';
  return 'text-red-600';
};

const gradeBg = (g: number) => {
  if (g >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (g >= 60) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

const gradeLabel = (g: number) => {
  if (g >= 80) return 'Distinction';
  if (g >= 70) return 'Merit';
  if (g >= 60) return 'Pass';
  return 'Fail';
};



// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, gradient,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; gradient: string;
}) {
  return (
    <div className={`${gradient} rounded-2xl p-4 text-white shadow-sm flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-xs font-medium">{label}</span>
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-white/70 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Per-student expandable breakdown ────────────────────────────────────────

function StudentBreakdownCard({ student, assessments, reports, dailyReports, missingReports }: {
  student: Student;
  assessments: Assessment[];
  reports: ReturnType<typeof useData>['reports'];
  dailyReports: ReturnType<typeof useData>['dailyReports'];
  missingReports: ReturnType<typeof useData>['missingDailyReports'];
}) {
  const [expanded, setExpanded] = useState(false);

  const sReports = reports.filter(r => r.studentId === student.id);
  const sGraded  = sReports.filter(r => r.grade !== undefined);
  const avgGrade = sGraded.length > 0
    ? Math.round(sGraded.reduce((s, r) => s + (r.grade ?? 0), 0) / sGraded.length)
    : null;

  const sDailies   = dailyReports.filter(d => d.studentId === student.id);
  const sMissing   = missingReports.filter(m => m.studentId === student.id);
  const expected   = sDailies.length + sMissing.length || 1;
  const compliance = Math.round((sDailies.length / expected) * 100);

  // Assessment criteria radar data
  const sAssessments = assessments.filter(a => a.studentId === student.id);
  const criteria = sAssessments.length > 0
    ? {
        attendance:     Math.round(sAssessments.reduce((s, a) => s + a.attendance, 0) / sAssessments.length),
        performance:    Math.round(sAssessments.reduce((s, a) => s + a.performance, 0) / sAssessments.length),
        reportQuality:  Math.round(sAssessments.reduce((s, a) => s + a.reportQuality, 0) / sAssessments.length),
        professionalism:Math.round(sAssessments.reduce((s, a) => s + a.professionalism, 0) / sAssessments.length),
      }
    : null;

  const radarData = criteria ? [
    { subject: 'Attendance',      A: criteria.attendance },
    { subject: 'Performance',     A: criteria.performance },
    { subject: 'Report Quality',  A: criteria.reportQuality },
    { subject: 'Professionalism', A: criteria.professionalism },
  ] : [];

  // Grade trend per week
  const gradeTrend = sGraded.map(r => ({
    name: r.weekNumber ? `W${r.weekNumber}` : r.submittedDate.slice(5),
    grade: r.grade ?? 0,
  })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="card-clean rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-2xl stat-card-blue flex items-center justify-center text-white font-bold text-lg shrink-0">
          {student.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-foreground">{student.name}</p>
            {avgGrade !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${gradeBg(avgGrade)}`}>
                Avg {avgGrade}/100 · {gradeLabel(avgGrade)}
              </span>
            )}
            {sMissing.length > 0
              ? <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]">{sMissing.length} Missing</Badge>
              : <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">Up to Date</Badge>
            }
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {student.company || 'No company'} · Level {(student.currentLevel ?? 1) * 100} · {sReports.length} reports
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-lg font-bold ${gradeColor(compliance)}`}>{compliance}%</span>
          <span className="text-[10px] text-muted-foreground">Compliance</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Grade Trend */}
            <div className="bg-secondary/40 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Grade Trend by Week
              </p>
              {gradeTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={gradeTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="grade" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No graded reports yet</p>
              )}
            </div>

            {/* Criteria Radar */}
            <div className="bg-secondary/40 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" /> Assessment Criteria
              </p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">No assessment data yet</p>
              )}
            </div>
          </div>

          {/* Compliance gauge */}
          <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Daily Reporting Compliance</span>
              <span className="font-bold text-foreground">{sDailies.length} submitted · {sMissing.length} missing · {compliance}%</span>
            </div>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${compliance >= 80 ? 'bg-emerald-500' : compliance >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${compliance}%` }}
              />
            </div>
          </div>

          {/* Criteria breakdown bars */}
          {criteria && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Attendance',      value: criteria.attendance },
                { label: 'Performance',     value: criteria.performance },
                { label: 'Report Quality',  value: criteria.reportQuality },
                { label: 'Professionalism', value: criteria.professionalism },
              ].map(c => (
                <div key={c.label} className="bg-secondary/40 rounded-lg p-2.5 space-y-1">
                  <div className="flex justify-between font-medium text-muted-foreground">
                    <span>{c.label}</span>
                    <span className={`font-bold ${gradeColor(c.value)}`}>{c.value}/100</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.value >= 80 ? 'bg-emerald-500' : c.value >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${c.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function SupervisorAssessmentAnalyticsPage() {
  const { user } = useAuth();
  const {
    reports, assessments, students, supervisors,
    dailyReports, missingDailyReports,
  } = useData();

  const supervisorData = supervisors.find(s => s.email === user?.email);
  const assignedStudents = useMemo(
    () => students.filter(st => supervisorData?.assignedStudents.includes(st.id)),
    [students, supervisorData]
  );

  const supervisorReports  = useMemo(
    () => reports.filter(r => assignedStudents.some(st => st.id === r.studentId)),
    [reports, assignedStudents]
  );
  const supervisorAssessments = useMemo(
    () => assessments.filter(a => assignedStudents.some(st => st.id === a.studentId)),
    [assessments, assignedStudents]
  );
  const supervisorDailies   = useMemo(
    () => dailyReports.filter(d => assignedStudents.some(st => st.id === d.studentId)),
    [dailyReports, assignedStudents]
  );
  const supervisorMissing   = useMemo(
    () => missingDailyReports.filter(m => assignedStudents.some(st => st.id === m.studentId)),
    [missingDailyReports, assignedStudents]
  );

  // KPIs
  const gradedReports = supervisorReports.filter(r => r.grade !== undefined);
  const avgGrade      = gradedReports.length > 0
    ? Math.round(gradedReports.reduce((s, r) => s + (r.grade ?? 0), 0) / gradedReports.length)
    : 0;
  const totalExpected  = supervisorDailies.length + supervisorMissing.length || 1;
  const complianceRate = Math.round((supervisorDailies.length / totalExpected) * 100);

  // ── Chart data ──

  // 1. Cohort grade bar chart
  const cohortGradeData = assignedStudents.map(st => {
    const stGraded = supervisorReports.filter(r => r.studentId === st.id && r.grade !== undefined);
    const avg = stGraded.length > 0
      ? Math.round(stGraded.reduce((s, r) => s + (r.grade ?? 0), 0) / stGraded.length)
      : 0;
    return { name: st.name.split(' ')[0], grade: avg };
  });

  // 2. Weekly compliance stacked bar (across all assigned students)
  const weekCompliance = useMemo(() => {
    const map = new Map<number, { submitted: number; missing: number }>();
    supervisorDailies.forEach(d => {
      const w = d.weekNumber;
      const cur = map.get(w) ?? { submitted: 0, missing: 0 };
      cur.submitted++;
      map.set(w, cur);
    });
    supervisorMissing.forEach(m => {
      const w = m.weekNumber;
      const cur = map.get(w) ?? { submitted: 0, missing: 0 };
      cur.missing++;
      map.set(w, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, { submitted, missing }]) => ({ name: `Wk ${week}`, submitted, missing }));
  }, [supervisorDailies, supervisorMissing]);

  // 3. Report status pie
  const statusPie = [
    { name: 'Pending',  value: supervisorReports.filter(r => r.status === 'pending').length,  color: '#f59e0b' },
    { name: 'Reviewed', value: supervisorReports.filter(r => r.status === 'reviewed').length, color: '#6366f1' },
    { name: 'Graded',   value: supervisorReports.filter(r => r.status === 'graded').length,   color: '#10b981' },
  ].filter(d => d.value > 0);

  // 4. Criteria radar (cohort average)
  const criteriaRadar = supervisorAssessments.length > 0 ? [
    { subject: 'Attendance',      A: Math.round(supervisorAssessments.reduce((s, a) => s + a.attendance, 0)      / supervisorAssessments.length) },
    { subject: 'Performance',     A: Math.round(supervisorAssessments.reduce((s, a) => s + a.performance, 0)     / supervisorAssessments.length) },
    { subject: 'Report Quality',  A: Math.round(supervisorAssessments.reduce((s, a) => s + a.reportQuality, 0)   / supervisorAssessments.length) },
    { subject: 'Professionalism', A: Math.round(supervisorAssessments.reduce((s, a) => s + a.professionalism, 0) / supervisorAssessments.length) },
  ] : [];

  // ── CSV Export ──
  const handleExportCSV = () => {
    const headers = ['Student', 'Report', 'Date', 'Attendance', 'Performance', 'Report Quality', 'Professionalism', 'Overall', 'Feedback'];
    const rows = supervisorAssessments.map(a => {
      const st = assignedStudents.find(s => s.id === a.studentId);
      const rp = supervisorReports.find(r => r.id === a.reportId);
      return [
        st?.name ?? '',
        rp?.title ?? '',
        a.assessedDate,
        a.attendance,
        a.performance,
        a.reportQuality,
        a.professionalism,
        a.overallGrade,
        `"${a.feedback.replace(/"/g, "'")}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'supervisor_assessments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Assessment & Analytics">
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/supervisor" className="text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Assessment &amp; Analytics
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Cohort performance insights for your {assignedStudents.length} assigned student{assignedStudents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export Assessments CSV
          </Button>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Assigned Students"   value={assignedStudents.length}                  sub="Under supervision"          icon={Users}         gradient="stat-card-blue"   />
          <KpiCard label="Total Reports"        value={supervisorReports.length}                 sub="All submitted"              icon={FileText}       gradient="stat-card-violet" />
          <KpiCard label="Overall Avg. Grade"   value={avgGrade > 0 ? `${avgGrade}%` : '—'}      sub={avgGrade > 0 ? gradeLabel(avgGrade) : 'No grades yet'} icon={Award} gradient="stat-card-green" />
          <KpiCard label="Daily Compliance"     value={`${complianceRate}%`}                     sub={`${supervisorDailies.length} days logged`}  icon={Calendar}   gradient="stat-card-amber"  />
          <KpiCard label="Graded Reports"       value={gradedReports.length}                     sub={`of ${supervisorReports.length} total`}     icon={CheckCircle} gradient="stat-card-blue"  />
          <KpiCard label="Missing Daily Reports" value={supervisorMissing.length}                sub="Unsubmitted days"           icon={AlertTriangle} gradient={supervisorMissing.length > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'stat-card-green'} />
        </div>

        {/* ── Charts Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 1. Cohort Grade Bar */}
          <div className="card-clean rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Student Average Grades
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Avg grade across all graded level reports per student</p>
            </div>
            {cohortGradeData.some(d => d.grade > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cohortGradeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="grade" name="Avg Grade" radius={[6, 6, 0, 0]}>
                    {cohortGradeData.map((entry, i) => (
                      <Cell key={i} fill={entry.grade >= 80 ? '#10b981' : entry.grade >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No graded data yet</div>
            )}
          </div>

          {/* 2. Weekly Compliance Stacked Bar */}
          <div className="card-clean rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Weekly Daily Report Compliance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Submitted vs missing days per week across all students</p>
            </div>
            {weekCompliance.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekCompliance} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="submitted" name="Submitted" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="missing"   name="Missing"   stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No daily report data</div>
            )}
          </div>

          {/* 3. Report Status Pie */}
          <div className="card-clean rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" /> Report Status Distribution
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Overview of pending, reviewed &amp; graded level reports</p>
            </div>
            {statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusPie} cx="50%" cy="50%"
                    outerRadius={85} innerRadius={45}
                    dataKey="value" paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No reports available</div>
            )}
          </div>

          {/* 4. Criteria Radar */}
          <div className="card-clean rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Cohort Assessment Criteria
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Average scores across all formal assessment criteria</p>
            </div>
            {criteriaRadar.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={criteriaRadar} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Cohort Avg" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No formal assessments yet</div>
            )}
          </div>
        </div>

        {/* ── Tabs: Per-student / Assessments Table ── */}
        <div className="card-clean rounded-2xl">
          <Tabs defaultValue="students">
            <div className="px-5 pt-5 border-b border-border pb-0">
              <TabsList className="bg-secondary p-1 h-auto rounded-xl gap-1">
                <TabsTrigger value="students"    className="text-xs font-semibold px-4 py-1.5 rounded-lg">
                  Per-Student Breakdown ({assignedStudents.length})
                </TabsTrigger>
                <TabsTrigger value="assessments" className="text-xs font-semibold px-4 py-1.5 rounded-lg">
                  Assessments Table ({supervisorAssessments.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Per-student breakdown */}
            <TabsContent value="students" className="p-4 sm:p-5 space-y-3 mt-0">
              {assignedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-25" />
                  No students assigned yet
                </div>
              ) : (
                assignedStudents.map(st => (
                  <StudentBreakdownCard
                    key={st.id}
                    student={st}
                    assessments={supervisorAssessments}
                    reports={supervisorReports}
                    dailyReports={supervisorDailies}
                    missingReports={supervisorMissing}
                  />
                ))
              )}
            </TabsContent>

            {/* Assessments table */}
            <TabsContent value="assessments" className="mt-0">
              {supervisorAssessments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm px-5">
                  <Award className="w-10 h-10 mx-auto mb-3 opacity-25" />
                  No formal assessments submitted yet. Grade a report from the dashboard to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        {['Student', 'Report', 'Date', 'Attend.', 'Perf.', 'Rpt Qual.', 'Prof.', 'Overall', 'Feedback'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap first:pl-5 last:pr-5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {supervisorAssessments.map(a => {
                        const st = assignedStudents.find(s => s.id === a.studentId);
                        const rp = supervisorReports.find(r => r.id === a.reportId);
                        return (
                          <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3 pl-5 font-semibold text-foreground whitespace-nowrap">
                              {st?.name ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">
                              {rp?.title ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(a.assessedDate).toLocaleDateString()}
                            </td>
                            {[a.attendance, a.performance, a.reportQuality, a.professionalism].map((v, i) => (
                              <td key={i} className={`px-4 py-3 font-semibold whitespace-nowrap ${gradeColor(v)}`}>
                                {v}
                              </td>
                            ))}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-bold border ${gradeBg(a.overallGrade)}`}>
                                {a.overallGrade}/100
                              </span>
                            </td>
                            <td className="px-4 py-3 pr-5 text-muted-foreground max-w-[200px] truncate" title={a.feedback}>
                              {a.feedback || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </DashboardLayout>
  );
}
