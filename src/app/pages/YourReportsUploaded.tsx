import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  FileText, Calendar, CheckCircle2, Clock, Eye, Upload,
  ArrowLeft, FolderKanban, Award, Layers,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintableReport } from '../components/PrintableReport';
import { Report, LevelProjectReport } from '../types';

export function YourReportsUploaded() {
  const { user } = useAuth();
  const { reports, students, addReport } = useData();
  const [searchParams] = useSearchParams();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [reportLevel, setReportLevel] = useState('3');
  const [isFinalReport, setIsFinalReport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [reportToPrint, setReportToPrint] = useState<Report | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true
  });

  // Identify target student
  const targetStudentId = searchParams.get('studentId');
  const studentData = targetStudentId
    ? students.find(s => s.id === targetStudentId)
    : students.find(s => s.email === user?.email || s.id === user?.id) || students[0];

  const currentLevel = studentData?.currentLevel || 1;

  // Real-time student uploaded reports from active session
  const studentUploadedReports = reports.filter(
    r => r.studentId === studentData?.id || r.studentId === user?.id
  );

  // Group reports by Level (1 to 4)
  const getReportsForLevel = (lvl: number): (Report | LevelProjectReport)[] => {
    // 1. Live reports tagged with this level or current level
    const liveLevelReports = studentUploadedReports.filter(r => {
      if (r.level) return r.level === lvl;
      // Default live untagged reports to the student's current level
      return lvl === currentLevel;
    });

    // 2. Archived level project reports from level history if previous level
    const levelHistoryProject = studentData?.levelProjects?.find(p => p.level === lvl);
    const archivedReports = levelHistoryProject?.reports || [];

    // Combine or prioritize live reports
    if (liveLevelReports.length > 0) {
      // Merge unique
      const existingIds = new Set(liveLevelReports.map(r => r.id));
      const additional = archivedReports.filter(ar => !existingIds.has(ar.id));
      return [...liveLevelReports, ...additional];
    }

    return archivedReports;
  };

  const levelsConfig = [
    {
      level: 1,
      title: 'Level 1 Reports',
      subtitle: 'First Year / Level 100 Foundation Attachment Reports',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      level: 2,
      title: 'Level 2 Reports',
      subtitle: 'Second Year / Level 200 Intermediate Industrial Reports',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      level: 3,
      title: 'Level 3 Reports',
      subtitle: 'Third Year / Level 300 Advanced Industrial Internship Reports',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      level: 4,
      title: 'Level 4 Reports',
      subtitle: 'Final Year / Level 400 Capstone Project & Final Internship Reports',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      hasSubsections: true,
    },
  ];

  // ONLY display levels that the student has reached or completed
  const visibleLevels = levelsConfig.filter(cfg => cfg.level <= currentLevel);

  const toggleLevel = (lvl: number) => {
    setExpandedLevels(prev => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      await addReport({
        studentId: studentData?.id || user?.id || '',
        studentName: studentData?.name || user?.name || '',
        title: reportTitle,
        description: reportDescription,
        weekNumber: weekNumber ? parseInt(weekNumber) : undefined,
        fileName: selectedFile.name,
        fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
        level: parseInt(reportLevel),
        isFinalReport: isFinalReport,
      });

      toast.success(`Report submitted successfully for Level ${reportLevel}00!`);
      setIsUploadOpen(false);
      setReportTitle('');
      setReportDescription('');
      setWeekNumber('');
      setSelectedFile(null);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Graded
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
        );
    }
  };

  return (
    <DashboardLayout title="Your Reports Uploaded">
      <div className="max-w-7xl mx-auto space-y-8 p-2 sm:p-4">

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Link to={user?.role === 'supervisor' ? '/supervisor' : '/student'}>
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Your Reports Uploaded
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-bold">
                Level {currentLevel}00 Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Categorized view of your submitted attachment and project reports from Level 1 to Level {currentLevel}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'student' && (
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary gap-2 h-11 px-5 rounded-xl shadow-sm">
                    <Upload className="w-4 h-4" /> Upload New Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Attachment Report</DialogTitle>
                    <DialogDescription>
                      Submit a new weekly or final report stamped with your academic level.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="academicLevel">Target Academic Level</Label>
                      <select
                        id="academicLevel"
                        value={reportLevel}
                        onChange={e => setReportLevel(e.target.value)}
                        className="w-full h-10 px-3 border border-input rounded-lg bg-background text-sm font-medium focus:ring-2 focus:ring-primary"
                      >
                        {levelsConfig
                          .filter(l => l.level <= currentLevel)
                          .map(l => (
                            <option key={l.level} value={l.level}>
                              Level {l.level}00 (Year {l.level})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="repTitle">Report Title</Label>
                      <Input
                        id="repTitle"
                        placeholder="e.g. Week 4 Industrial Progress Report"
                        value={reportTitle}
                        onChange={e => setReportTitle(e.target.value)}
                        required
                      />
                    </div>

                    {reportLevel === '4' && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl space-y-2">
                        <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">Level 4 Report Type</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="lvl4Type"
                              checked={!isFinalReport}
                              onChange={() => setIsFinalReport(false)}
                            />
                            Project Milestone Report
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="lvl4Type"
                              checked={isFinalReport}
                              onChange={() => setIsFinalReport(true)}
                            />
                            Final Comprehensive Report
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="weekNum">Week Number (Optional)</Label>
                      <Input
                        id="weekNum"
                        type="number"
                        min="1"
                        max="24"
                        placeholder="e.g. 3"
                        value={weekNumber}
                        onChange={e => setWeekNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="repDesc">Description & Highlights</Label>
                      <Textarea
                        id="repDesc"
                        rows={3}
                        placeholder="Key activities carried out, tools used, and challenges encountered..."
                        value={reportDescription}
                        onChange={e => setReportDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="fileInput">Document (PDF or DOCX)</Label>
                      <Input
                        id="fileInput"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isUploading} className="w-full h-11 btn-primary rounded-xl">
                      {isUploading ? 'Uploading & Stamping...' : 'Submit Report'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {/* Student metadata snippet */}
            <div className="flex items-center gap-3 bg-secondary/80 border border-border/80 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-sm shrink-0">
                {studentData?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{studentData?.name}</p>
                <p className="text-[11px] text-muted-foreground">{studentData?.studentId} • Level {currentLevel}00</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* LEVEL REPORT SECTIONS (ONLY DISPLAY REACHED/COMPLETED) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {visibleLevels.map(cfg => {
            const levelReports = getReportsForLevel(cfg.level);
            const isExpanded = expandedLevels[cfg.level] !== false;
            const count = levelReports.length;

            // For Level 4: Split into Project Reports vs Final Report
            const projectReports = levelReports.filter(r => !(r as Report).isFinalReport);
            const finalReports = levelReports.filter(r => (r as Report).isFinalReport);

            return (
              <div
                key={cfg.level}
                className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-primary/40"
              >
                {/* Level Card Header */}
                <div
                  onClick={() => toggleLevel(cfg.level)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-secondary/50 to-transparent hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-bold text-foreground">{cfg.title}</h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.badgeColor}`}>
                          {cfg.level === currentLevel ? 'Active Level' : 'Completed Level'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cfg.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{count} Reports Uploaded</span>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                      aria-label="Toggle level"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Level Reports List (Accordion Body) */}
                {isExpanded && (
                  <div className="border-t border-border p-5 sm:p-6 space-y-4">
                    {count === 0 ? (
                      <div className="text-center py-10 text-muted-foreground space-y-2">
                        <FileText className="w-10 h-10 mx-auto opacity-30" />
                        <p className="text-sm font-medium">No reports uploaded for {cfg.title} yet.</p>
                        {user?.role === 'student' && cfg.level === currentLevel && (
                          <p className="text-xs text-primary">Click "Upload New Report" to submit your first report for this level.</p>
                        )}
                      </div>
                    ) : cfg.hasSubsections ? (
                      /* Level 4 Subsections: Project + Final Report */
                      <div className="space-y-6">
                        {/* 1. Project Reports */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Layers className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                              Level 4 • Project Reports ({projectReports.length})
                            </h3>
                          </div>
                          {projectReports.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2">No project milestone reports submitted yet.</p>
                          ) : (
                            <div className="grid gap-3">
                              {projectReports.map(rep => renderReportRow(rep))}
                            </div>
                          )}
                        </div>

                        {/* 2. Final Report */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Award className="w-4 h-4 text-amber-600" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                              Level 4 • Final Report ({finalReports.length})
                            </h3>
                          </div>
                          {finalReports.length === 0 ? (
                            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                              Final Capstone & Attachment Report pending submission upon completion of industrial tenure.
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {finalReports.map(rep => renderReportRow(rep, true))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Standard Level 1, 2, 3 Reports List */
                      <div className="grid gap-3">
                        {levelReports.map(rep => renderReportRow(rep))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Printable Report Modal */}
      {reportToPrint && studentData && (
        <PrintableReport
          report={reportToPrint}
          student={studentData}
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
        />
      )}
    </DashboardLayout>
  );

  function renderReportRow(rep: Report | LevelProjectReport, isFinal = false) {
    const asFullReport: Report = {
      id: rep.id,
      studentId: studentData?.id || '',
      studentName: studentData?.name || '',
      title: rep.title,
      description: (rep as Report).description || 'Weekly industrial attachment report documentation.',
      submittedDate: rep.submittedDate,
      weekNumber: rep.weekNumber,
      fileName: (rep as Report).fileName || `${rep.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: (rep as Report).fileSize || '240 KB',
      status: rep.status,
      feedback: rep.feedback,
      grade: rep.grade,
      level: (rep as Report).level,
      isFinalReport: isFinal,
    };

    return (
      <div
        key={rep.id}
        className="bg-secondary/40 border border-border/80 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-secondary/70 shadow-2xs"
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-bold text-foreground truncate">
              {rep.weekNumber ? `Week ${rep.weekNumber}: ` : ''}{rep.title}
            </span>
            {getStatusBadge(rep.status)}
            {rep.grade !== undefined && (
              <span className="text-xs font-extrabold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                Grade: {rep.grade}/100
              </span>
            )}
            {isFinal && (
              <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                Final Report
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Uploaded: {new Date(rep.submittedDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {(rep as Report).fileName || 'Document.pdf'}
            </span>
          </div>

          {rep.feedback && (
            <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg text-xs text-blue-900 dark:text-blue-300">
              <span className="font-bold">Supervisor Feedback: </span>"{rep.feedback}"
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs rounded-lg"
            onClick={() => {
              setReportToPrint(asFullReport);
              setIsPrintDialogOpen(true);
            }}
          >
            <Eye className="w-3.5 h-3.5" /> View Report
          </Button>
        </div>
      </div>
    );
  }
}
