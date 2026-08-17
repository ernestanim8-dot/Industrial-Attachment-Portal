import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Activity, ArrowLeft, Building2, CheckCircle2, ChevronDown,
  ChevronUp, FileText, FolderKanban, GraduationCap,
  Layers, Star, User, AlertCircle, Sparkles
} from 'lucide-react';
import { LevelProject } from '../types';

export function StudentProgressPage() {
  const { user } = useAuth();
  const { students, reports } = useData();
  const [searchParams] = useSearchParams();
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});

  // Determine active student (either from query param for supervisor or logged in student)
  const targetStudentId = searchParams.get('studentId');
  const studentData = targetStudentId
    ? students.find(s => s.id === targetStudentId)
    : students.find(s => s.email === user?.email || s.id === user?.id) || students[0];

  const currentLevelNum = studentData?.currentLevel || 1;
  const allLevelProjects: LevelProject[] = studentData?.levelProjects || [
    {
      id: 'default-l1',
      level: 1,
      levelName: 'Level 100',
      projectTitle: studentData?.currentProjectTitle || 'Industrial Attachment Project',
      description: studentData?.currentProjectDescription || 'Practical industry training and weekly documentation.',
      companyOrHost: studentData?.company || 'Host Organization',
      academicYear: '2025/2026',
      status: 'in_progress',
      progressPercentage: studentData?.progress || 50,
      reportsCount: reports.filter(r => r.studentId === studentData?.id).length,
      startDate: studentData?.attachmentStartDate,
      endDate: studentData?.attachmentEndDate,
    }
  ];

  // Filter: ONLY show levels and projects that the student has reached or completed
  const visibleProjects = allLevelProjects
    .filter(p => p.level <= currentLevelNum)
    .sort((a, b) => b.level - a.level); // Current level at top, previous levels below

  // Current Project: the active/highest reached level project
  const currentProject = visibleProjects.find(p => p.level === currentLevelNum) || visibleProjects[0];

  // Previous Projects: all completed projects from earlier levels (level < currentLevelNum)
  const previousProjects = visibleProjects.filter(p => p.level < currentLevelNum);

  // Student reports for current project
  const currentStudentReports = reports.filter(r => r.studentId === studentData?.id);
  const gradedCurrentReports = currentStudentReports.filter(r => r.status === 'graded');
  const avgCurrentGrade = gradedCurrentReports.length > 0
    ? Math.round(gradedCurrentReports.reduce((acc, r) => acc + (r.grade || 0), 0) / gradedCurrentReports.length)
    : 0;

  const toggleLevelExpand = (projectId: string) => {
    setExpandedLevels(prev => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const getRemarkBadge = (remark?: string, grade?: number) => {
    const val = remark || (grade && grade >= 80 ? 'Good' : grade && grade >= 50 ? 'Average' : 'Pending');
    if (val === 'Good' || (grade && grade >= 80)) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />Good</span>;
    }
    if (val === 'Average' || (grade && grade >= 50)) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Star className="w-3 h-3 fill-amber-600 text-amber-600" />Average</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><AlertCircle className="w-3 h-3 text-red-600" />Needs Improvement</span>;
  };

  return (
    <DashboardLayout title="Academic Progress & Project History">
      <div className="max-w-7xl mx-auto space-y-8 p-2 sm:p-4">
        
        {/* Navigation & Header */}
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
                Student Progress Tracking
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                Level {currentLevelNum}00 (Year {currentLevelNum})
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Comprehensive overview of current project milestones, completed levels, and uploaded reports.
            </p>
          </div>

          {/* Student Info Card */}
          <div className="flex items-center gap-3.5 bg-secondary/80 border border-border/80 rounded-xl p-3.5 sm:min-w-[260px]">
            <div className="w-11 h-11 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
              {studentData?.name ? studentData.name.charAt(0) : 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{studentData?.name || 'Student'}</p>
              <p className="text-xs text-muted-foreground truncate">{studentData?.studentId || 'STU001'} • {studentData?.department || 'Department'}</p>
              <p className="text-xs text-primary font-medium truncate mt-0.5">{studentData?.company || 'Attachment Host'}</p>
            </div>
          </div>
        </div>

        {/* Global Progress Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#6374f6] to-[#4856df] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-white/90 text-sm font-medium">Overall Progress</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{studentData?.progress || 0}%</p>
              <div className="mt-3">
                <Progress value={studentData?.progress || 0} className="h-1.5 bg-white/30 [&>*]:bg-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#9851f5] to-[#7f39db] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-white/90 text-sm font-medium">Current Level</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">Level {currentLevelNum}00</p>
              <p className="text-xs text-white/80 mt-1">Year {currentLevelNum} of 4</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#00a86b] to-[#008f5b] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-white/90 text-sm font-medium">Completed Projects</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{previousProjects.length}</p>
              <p className="text-xs text-white/80 mt-1">Levels 1 to {Math.max(1, currentLevelNum - 1)} finalized</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#f48c06] to-[#d47200] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-white/90 text-sm font-medium">Current Remark</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{avgCurrentGrade > 0 ? `${avgCurrentGrade}%` : 'Good'}</p>
              <p className="text-xs text-white/80 mt-1">Based on submitted assessments</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 1: CURRENT PROJECT */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">1. Current Project & Active Level</h2>
              <p className="text-xs text-muted-foreground">The project and industrial attachment you are currently working on.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    Level {currentLevelNum}00 • Current Project
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    In Progress ({studentData?.progress || currentProject?.progressPercentage || 65}%)
                  </span>
                  {currentProject?.academicYear && (
                    <span className="text-xs text-muted-foreground font-medium">
                      Academic Year: {currentProject.academicYear}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                    {currentProject?.projectTitle || studentData?.currentProjectTitle || 'Industrial Attachment Project'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    {currentProject?.description || studentData?.currentProjectDescription || 'Conducting hands-on industrial attachment, fulfilling scheduled weekly task milestones, and submitting analytical progress reports for academic and industrial evaluation.'}
                  </p>
                </div>

                {/* Key metadata badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-secondary/60 rounded-xl border border-border/60">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium">Host Organization / Company</p>
                      <p className="text-xs font-semibold text-foreground truncate">{studentData?.company || currentProject?.companyOrHost || 'Not Assigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/60 rounded-xl border border-border/60">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium">Attachment Duration</p>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {studentData?.attachmentStartDate ? `${new Date(studentData.attachmentStartDate).toLocaleDateString()} - ${studentData.attachmentEndDate ? new Date(studentData.attachmentEndDate).toLocaleDateString() : 'Ongoing'}` : 'Jan 2026 - Jun 2026'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/60 rounded-xl border border-border/60">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium">Reports Uploaded</p>
                      <p className="text-xs font-semibold text-foreground">
                        {currentStudentReports.length} Reports ({gradedCurrentReports.length} Graded)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Dial Card */}
              <div className="bg-secondary/70 border border-border p-5 rounded-xl flex flex-col justify-between sm:min-w-[240px] space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-foreground">Current Level Completion</span>
                    <span className="text-sm font-extrabold text-primary">{studentData?.progress || currentProject?.progressPercentage || 65}%</span>
                  </div>
                  <Progress value={studentData?.progress || currentProject?.progressPercentage || 65} className="h-2.5" />
                </div>

                <div className="space-y-2 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Level Status:</span>
                    <span className="font-semibold text-foreground">Active (Level {currentLevelNum})</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Uploaded Reports:</span>
                    <span className="font-semibold text-foreground">{currentStudentReports.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Average Grade:</span>
                    <span className="font-semibold text-emerald-600">{avgCurrentGrade > 0 ? `${avgCurrentGrade}/100` : 'Pending'}</span>
                  </div>
                </div>

                <Link to="/student" className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> View Uploaded Reports
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: PREVIOUS PROJECTS (LINKED TO REPORTS) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">2. Previous Projects & Completed Levels</h2>
                <p className="text-xs text-muted-foreground">
                  Projects completed in previous levels, linked to the number of reports uploaded for each specific level.
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
              Showing {previousProjects.length} completed level{previousProjects.length === 1 ? '' : 's'}
            </span>
          </div>

          {previousProjects.length === 0 ? (
            <div className="bg-white dark:bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">No Previous Levels Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                You are currently in Level {currentLevelNum}00 (Year 1). As you progress and complete subsequent academic levels, your completed projects and their uploaded reports will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {previousProjects.map((project) => {
                const isExpanded = !!expandedLevels[project.id];
                const reportsCount = project.reportsCount || project.reports?.length || 0;
                
                return (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-primary/40"
                  >
                    {/* Level Card Header */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-secondary text-foreground border border-border">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {project.levelName} (Year {project.level})
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Completed (100%)
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              Academic Year: {project.academicYear}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-foreground">
                            {project.projectTitle}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {project.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                              <strong className="text-foreground">Host:</strong> {project.companyOrHost}
                            </span>
                            {project.startDate && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <strong className="text-foreground">Period:</strong> {project.startDate} - {project.endDate || 'Completed'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Level Summary Stats & Reports Count Pill */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                          <div className="text-left md:text-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold text-sm">
                              <FileText className="w-4 h-4" />
                              <span>{reportsCount} Reports Uploaded</span>
                            </div>
                            <div className="mt-1.5 flex items-center md:justify-end gap-1.5">
                              <span className="text-xs text-muted-foreground font-medium">Final Grade:</span>
                              <span className="text-xs font-bold text-foreground">{project.finalGrade ? `${project.finalGrade}%` : 'Completed'}</span>
                              {getRemarkBadge(project.remark, project.finalGrade)}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleLevelExpand(project.id)}
                            className="gap-1.5 text-xs font-medium"
                          >
                            {isExpanded ? (
                              <>
                                Hide Reports <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                View {reportsCount} Reports <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Accordion: Uploaded Reports for this specific level */}
                    {isExpanded && (
                      <div className="bg-secondary/40 border-t border-border p-5 sm:p-6 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Uploaded Reports for {project.levelName} ({reportsCount})
                          </h4>
                          <span className="text-xs text-muted-foreground">All verified & graded</span>
                        </div>

                        {project.reports && project.reports.length > 0 ? (
                          <div className="grid gap-2.5">
                            {project.reports.map((rep, idx) => (
                              <div
                                key={rep.id || idx}
                                className="bg-white dark:bg-card border border-border p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">
                                      {rep.weekNumber ? `Week ${rep.weekNumber}: ` : ''}{rep.title}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" /> Graded
                                    </span>
                                    {rep.grade && (
                                      <span className="text-xs font-bold text-primary">
                                        Score: {rep.grade}/100
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                                    <span>Submitted: {new Date(rep.submittedDate).toLocaleDateString()}</span>
                                    {rep.feedback && <span>• Feedback: "{rep.feedback}"</span>}
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  <Badge variant="outline" className="text-[11px] bg-secondary">
                                    Level {project.level} Archive
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-xs text-muted-foreground bg-white dark:bg-card border border-border rounded-xl">
                            {reportsCount} reports archived for this level.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
