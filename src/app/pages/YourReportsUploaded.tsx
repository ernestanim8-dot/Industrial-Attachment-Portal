import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ArrowLeft, FileText, Upload, Calendar, CheckCircle2,
  Clock, Award, BookOpen, AlertTriangle,
  FileCheck, Search,
  Download, Eye
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
  DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { Student, Report } from '../types';

export interface LevelRequirementSlot {
  slotKey: string;
  level: number; // 1, 2, 3, 4
  levelCode: number; // 100, 200, 300, 400
  levelLabel: string; // "Level 100", "Level 200", "Level 300", "Level 400"
  slotName: string; // e.g. "Level 100 – Attachment", "Level 300 – Semester Out"
  shortName: string; // "Attachment", "Semester Out", "Final Project"
  category: 'attachment' | 'semester_out' | 'final_project';
  description: string;
  maxRequired: number; // 1
}

export interface SlotReportData {
  slot: LevelRequirementSlot;
  isUploaded: boolean;
  report?: {
    id: string;
    title: string;
    submittedDate: string;
    status: 'submitted' | 'reviewed' | 'graded' | 'pending' | 'late';
    grade?: number;
    feedback?: string;
    fileName?: string;
    fileSize?: string;
    weekNumber?: number;
    description?: string;
  };
}

// Formal academic level requirements
export const ACADEMIC_LEVEL_REQUIREMENTS: Record<number, LevelRequirementSlot[]> = {
  1: [
    {
      slotKey: 'l100_attachment',
      level: 1,
      levelCode: 100,
      levelLabel: 'Level 100',
      slotName: 'Level 100 – Attachment',
      shortName: 'Attachment',
      category: 'attachment',
      description: 'First-year foundational industrial/workshop attachment documentation.',
      maxRequired: 1,
    },
  ],
  2: [
    {
      slotKey: 'l200_attachment',
      level: 2,
      levelCode: 200,
      levelLabel: 'Level 200',
      slotName: 'Level 200 – Attachment',
      shortName: 'Attachment',
      category: 'attachment',
      description: 'Second-year industrial attachment practical work log and summary report.',
      maxRequired: 1,
    },
  ],
  3: [
    {
      slotKey: 'l300_semester_out',
      level: 3,
      levelCode: 300,
      levelLabel: 'Level 300',
      slotName: 'Level 300 – Semester Out',
      shortName: 'Semester Out',
      category: 'semester_out',
      description: 'Required academic semester out practical industry placement report.',
      maxRequired: 1,
    },
    {
      slotKey: 'l300_attachment',
      level: 3,
      levelCode: 300,
      levelLabel: 'Level 300',
      slotName: 'Level 300 – Attachment',
      shortName: 'Attachment',
      category: 'attachment',
      description: 'Required Level 300 comprehensive industrial attachment report.',
      maxRequired: 1,
    },
  ],
  4: [
    {
      slotKey: 'l400_final_project',
      level: 4,
      levelCode: 400,
      levelLabel: 'Level 400',
      slotName: 'Level 400 – Final Project',
      shortName: 'Final Project',
      category: 'final_project',
      description: 'Final attachment capstone project and comprehensive defense report.',
      maxRequired: 1,
    },
  ],
};

export function YourReportsUploaded() {
  const { user } = useAuth();
  const { students, reports, addReport } = useData();
  const [searchParams] = useSearchParams();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedReportForView, setSelectedReportForView] = useState<SlotReportData | null>(null);

  // Upload Modal state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [targetSlotKey, setTargetSlotKey] = useState<string>('l300_attachment');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Target Student (for student or supervisor inspecting)
  const targetStudentId = searchParams.get('studentId');
  const studentData = useMemo(() => {
    const match = (s: Student) =>
      (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
      s.id === user?.id ||
      (user?.name && s.name.toLowerCase() === user.name.toLowerCase());
    return targetStudentId
      ? students.find(s => s.id === targetStudentId)
      : students.find(s => match(s)) || students[0];
  }, [students, user, targetStudentId]);

  const studentCurrentLevel = studentData?.currentLevel || 1;

  // Active academic levels reached by student (e.g. [1, 2, 3] for level 3)
  const reachedLevels = useMemo(() => {
    const levels: number[] = [];
    for (let lvl = 1; lvl <= studentCurrentLevel && lvl <= 4; lvl++) {
      levels.push(lvl);
    }
    return levels;
  }, [studentCurrentLevel]);

  // Map uploaded reports to level requirement slots
  const {
    slotsByLevel,
    totalRequiredCount,
    totalCompletedCount,
    missingSlotsCount,
    allSlotsList,
  } = useMemo(() => {
    const studentId = studentData?.id;
    const studentName = studentData?.name?.toLowerCase();

    // Match global reports
    const matchedGlobalReports = reports.filter((r: Report) => {
      if (!studentId && !studentName) return true;
      if (r.studentId && r.studentId === studentId) return true;
      if (r.studentName && studentName && r.studentName.toLowerCase() === studentName) return true;
      return false;
    });

    const levelSlotsMap: Record<number, SlotReportData[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    let requiredTotal = 0;
    let completedTotal = 0;
    const allSlotsFlattened: SlotReportData[] = [];

    reachedLevels.forEach(lvl => {
      const requiredSlotsForLvl = ACADEMIC_LEVEL_REQUIREMENTS[lvl] || [];
      const projData = studentData?.levelProjects?.find(p => p.level === lvl);

      requiredSlotsForLvl.forEach(slot => {
        requiredTotal += slot.maxRequired;

        // Try finding matching uploaded report
        let matchedReport: SlotReportData['report'] | undefined;

        // 1. Check global reports by title / description / level matching
        const globalMatch = matchedGlobalReports.find(r => {
          const t = r.title.toLowerCase();
          const rLvl = r.level || studentCurrentLevel;

          if (slot.slotKey === 'l100_attachment') {
            return (rLvl === 1 && (t.includes('attachment') || t.includes('level 100') || t.includes('progress'))) || (projData && projData.reports && projData.reports.length > 0);
          }
          if (slot.slotKey === 'l200_attachment') {
            return (rLvl === 2 && (t.includes('attachment') || t.includes('level 200') || t.includes('progress'))) || (projData && projData.reports && projData.reports.length > 0);
          }
          if (slot.slotKey === 'l300_semester_out') {
            return t.includes('semester out') || (rLvl === 3 && r.weekNumber === 1) || t.includes('week 1');
          }
          if (slot.slotKey === 'l300_attachment') {
            return (t.includes('attachment') && rLvl === 3) || (rLvl === 3 && r.weekNumber === 2) || t.includes('week 2');
          }
          if (slot.slotKey === 'l400_final_project') {
            return r.isFinalReport || t.includes('final project') || (rLvl === 4);
          }
          return false;
        });

        if (globalMatch) {
          matchedReport = {
            id: globalMatch.id,
            title: globalMatch.title.startsWith(slot.slotName) ? globalMatch.title : `${slot.slotName}: ${globalMatch.title}`,
            submittedDate: globalMatch.submittedDate || '2026-01-22',
            status: (globalMatch.status as NonNullable<SlotReportData['report']>['status']) || 'submitted',
            grade: globalMatch.grade,
            feedback: globalMatch.feedback,
            fileName: globalMatch.fileName || `${slot.slotKey}.pdf`,
            fileSize: globalMatch.fileSize || '350 KB',
            weekNumber: globalMatch.weekNumber,
            description: globalMatch.description || slot.description,
          };
        } else if (projData && projData.reports && projData.reports.length > 0) {
          // Fallback to project report data from levelProjects
          const firstRep = projData.reports[0];
          matchedReport = {
            id: firstRep.id,
            title: `${slot.slotName}: ${firstRep.title}`,
            submittedDate: firstRep.submittedDate || '2024-05-10',
            status: (firstRep.status as NonNullable<SlotReportData['report']>['status']) || 'graded',
            grade: firstRep.grade || projData.finalGrade || 85,
            feedback: firstRep.feedback || `Attachment completed with remark: ${projData.remark || 'Good'}`,
            fileName: `${slot.slotKey}.pdf`,
            fileSize: '320 KB',
            weekNumber: firstRep.weekNumber,
            description: projData.description || slot.description,
          };
        }

        const isUploaded = !!matchedReport;
        if (isUploaded) {
          completedTotal += 1;
        }

        const slotData: SlotReportData = {
          slot,
          isUploaded,
          report: matchedReport,
        };

        levelSlotsMap[lvl].push(slotData);
        allSlotsFlattened.push(slotData);
      });
    });

    return {
      slotsByLevel: levelSlotsMap,
      totalRequiredCount: requiredTotal,
      totalCompletedCount: completedTotal,
      missingSlotsCount: Math.max(0, requiredTotal - completedTotal),
      allSlotsList: allSlotsFlattened,
    };
  }, [studentData, reports, studentCurrentLevel, reachedLevels]);

  // Open upload modal targeting specific requirement slot
  const handleOpenUploadForSlot = (slotKey: string) => {
    setTargetSlotKey(slotKey);
    const targetSlot = allSlotsList.find(s => s.slot.slotKey === slotKey)?.slot;
    if (targetSlot) {
      setUploadTitle(`${targetSlot.slotName} Report`);
      setUploadDescription(targetSlot.description);
    }
    setIsUploadDialogOpen(true);
  };

  // Submit report upload for the slot
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      toast.error('Please enter a report title.');
      return;
    }

    const targetSlot = allSlotsList.find(s => s.slot.slotKey === targetSlotKey)?.slot;
    const slotLevel = targetSlot ? targetSlot.level : studentCurrentLevel;

    setIsUploading(true);
    try {
      const generatedFileName = uploadFile ? uploadFile.name : `${targetSlotKey}.pdf`;
      const generatedFileSize = uploadFile ? `${Math.round(uploadFile.size / 1024)} KB` : '420 KB';

      await addReport({
        studentId: studentData?.id || user?.id || 'student1',
        studentName: studentData?.name || user?.name || 'Student',
        title: uploadTitle,
        description: uploadDescription || (targetSlot ? targetSlot.description : 'Attachment Report Upload'),
        fileName: generatedFileName,
        fileSize: generatedFileSize,
        level: slotLevel,
        isFinalReport: targetSlotKey === 'l400_final_project',
        reportType: 'level',
      });

      toast.success(`${targetSlot ? targetSlot.slotName : 'Report'} uploaded successfully!`);
      setIsUploadDialogOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter slots according to search query
  const filterSlots = (slots: SlotReportData[]) => {
    if (!searchQuery.trim()) return slots;
    const query = searchQuery.toLowerCase();
    return slots.filter(item =>
      item.slot.slotName.toLowerCase().includes(query) ||
      item.slot.shortName.toLowerCase().includes(query) ||
      (item.report && item.report.title.toLowerCase().includes(query)) ||
      (item.report && item.report.status.toLowerCase().includes(query)) ||
      (item.isUploaded ? 'uploaded' : 'missing').includes(query)
    );
  };

  const backPath = user?.role === 'supervisor' ? '/supervisor' : '/student';

  return (
    <DashboardLayout title="Your Reports Uploaded">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <Link
                to={backPath}
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Your Reports Uploaded
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold">
                  Level {studentCurrentLevel}00 (Year {studentCurrentLevel})
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-3xl">
                Track your required industrial attachment and academic level uploads. Levels you have not reached are automatically hidden from the requirement matrix.
              </p>
            </div>

            {/* Student Info & Quick Upload Action */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <div className="bg-secondary/60 border border-border/80 rounded-xl p-3.5 flex items-center gap-3 min-w-[240px]">
                <div className="w-10 h-10 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {studentData?.name ? studentData.name.charAt(0) : 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{studentData?.name || 'Student'}</p>
                  <p className="text-xs text-muted-foreground truncate">{studentData?.studentId || 'STU001'} • Level {studentCurrentLevel}00</p>
                  <p className="text-xs text-primary font-medium truncate mt-0.5">{studentData?.company || 'Host Organization'}</p>
                </div>
              </div>

              {user?.role === 'student' && missingSlotsCount > 0 && (
                <Button
                  onClick={() => {
                    const firstMissing = allSlotsList.find(s => !s.isUploaded);
                    if (firstMissing) handleOpenUploadForSlot(firstMissing.slot.slotKey);
                    else setIsUploadDialogOpen(true);
                  }}
                  className="btn-primary gap-2 h-11 px-5 rounded-xl font-semibold shadow-xs"
                >
                  <Upload className="w-4 h-4" /> Upload Missing Document
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar with Level Requirements Count */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-border/70">
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">Required Uploads Completed</span>
              <p className="text-2xl font-black text-foreground mt-1">
                {totalCompletedCount} <span className="text-sm font-semibold text-muted-foreground">/ {totalRequiredCount}</span>
              </p>
            </div>
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">Academic Standing</span>
              <p className="text-2xl font-black text-primary mt-1">Level {studentCurrentLevel}00</p>
            </div>
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">Missing Documents</span>
              <p className={`text-2xl font-black mt-1 ${missingSlotsCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {missingSlotsCount === 0 ? '0 (All Complete)' : `${missingSlotsCount} Missing`}
              </p>
            </div>
            <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
              <span className="text-xs font-semibold text-muted-foreground">Overall Compliance</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {totalRequiredCount > 0 ? `${Math.round((totalCompletedCount / totalRequiredCount) * 100)}%` : '100%'}
              </p>
            </div>
          </div>
        </div>

        {/* Level Requirements Summary Reference Table */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Required Uploads by Academic Level
              </h3>
              <p className="text-xs text-muted-foreground">
                Official institutional requirements for industrial attachment and milestone defense.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold self-start sm:self-auto bg-primary/5 text-primary border-primary/20">
              Active Scope: Levels 100 – {studentCurrentLevel}00
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Required Uploads</th>
                  <th className="py-2.5 px-3 text-center">Max Count</th>
                  <th className="py-2.5 px-3 text-right">Student Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {([1, 2, 3, 4] as const).map(lvl => {
                  const isReached = lvl <= studentCurrentLevel;
                  const slots = ACADEMIC_LEVEL_REQUIREMENTS[lvl];
                  const slotsData = slotsByLevel[lvl] || [];
                  const completedForLvl = slotsData.filter(s => s.isUploaded).length;
                  const totalForLvl = slots.length;

                  if (!isReached) {
                    return (
                      <tr key={lvl} className="opacity-40 bg-secondary/10">
                        <td className="py-2.5 px-3 font-bold text-muted-foreground">Level {lvl}00</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {lvl === 3 ? 'Semester Out + Attachment' : lvl === 4 ? 'Final Project' : 'Attachment'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{totalForLvl}</td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground italic">Level not reached</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={lvl} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        Level {lvl}00 {lvl === studentCurrentLevel && <span className="ml-1 text-[10px] text-primary">(Current)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-medium">
                        {lvl === 1 && 'Attachment'}
                        {lvl === 2 && 'Attachment'}
                        {lvl === 3 && 'Semester Out + Attachment'}
                        {lvl === 4 && 'Final Project'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">{totalForLvl}</td>
                      <td className="py-2.5 px-3 text-right">
                        {completedForLvl === totalForLvl ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-semibold gap-1 px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Complete ({completedForLvl}/{totalForLvl})
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-semibold gap-1 px-2 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> {totalForLvl - completedForLvl} Missing ({completedForLvl}/{totalForLvl})
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search required documents or uploaded reports..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white dark:bg-card rounded-xl text-sm"
            />
          </div>

          {/* Quick Level Tab Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedLevelFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevelFilter('all')}
              className="rounded-xl text-xs font-medium shrink-0 h-9"
            >
              All Reached Levels ({reachedLevels.length})
            </Button>
            {reachedLevels.map(lvl => (
              <Button
                key={lvl}
                variant={selectedLevelFilter === `level-${lvl}` ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLevelFilter(`level-${lvl}`)}
                className="rounded-xl text-xs font-medium shrink-0 h-9"
              >
                Level {lvl}00
              </Button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LEVEL REPORT SECTIONS (Strictly only reached levels: Level 100, 200, 300, 400) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {reachedLevels.map(levelNum => {
            if (selectedLevelFilter !== 'all' && selectedLevelFilter !== `level-${levelNum}`) {
              return null;
            }

            const slotsData = slotsByLevel[levelNum] || [];
            const filteredSlots = filterSlots(slotsData);
            const totalRequiredForLevel = slotsData.length;
            const totalUploadedForLevel = slotsData.filter(s => s.isUploaded).length;

            return (
              <section
                key={`level-${levelNum}`}
                id={`level-${levelNum}-reports`}
                className="bg-white dark:bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Level Header with Required Uploads Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                      {levelNum}00
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-foreground">
                          Level {levelNum}00 Reports
                        </h2>
                        <Badge variant="outline" className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-0.5">
                          {levelNum === 3 ? '2 Required Uploads' : '1 Required Upload'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {levelNum === 1 && 'Level 100 Requirement: 1 Attachment (Level 100 – Attachment)'}
                        {levelNum === 2 && 'Level 200 Requirement: 1 Attachment (Level 200 – Attachment)'}
                        {levelNum === 3 && 'Level 300 Requirement: 2 Uploads (1. Semester Out, 2. Attachment)'}
                        {levelNum === 4 && 'Level 400 Requirement: 1 Final Project (Level 400 – Final Project)'}
                      </p>
                    </div>
                  </div>

                  {/* Reports Uploaded Count */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Reports Uploaded:
                    </span>
                    <Badge className={`text-xs font-bold px-3 py-1 rounded-full ${totalUploadedForLevel === totalRequiredForLevel ? 'bg-emerald-600 text-white' : 'bg-primary text-white'}`}>
                      {totalUploadedForLevel} of {totalRequiredForLevel} Uploaded
                    </Badge>
                  </div>
                </div>

                {/* List of Specific Requirement Slots for this Level */}
                <div className="grid gap-3.5">
                  {filteredSlots.map(item => {
                    const { slot, isUploaded, report } = item;

                    return (
                      <div
                        key={slot.slotKey}
                        className={`border rounded-xl p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isUploaded
                            ? 'bg-secondary/20 hover:bg-secondary/40 border-border/80'
                            : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/70 dark:border-amber-900/40'
                        }`}
                      >
                        {/* Slot and Report Info */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                            isUploaded
                              ? 'bg-primary/10 text-primary'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                          }`}>
                            {slot.category === 'final_project' ? (
                              <Award className="w-5 h-5" />
                            ) : slot.category === 'semester_out' ? (
                              <BookOpen className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Displayed as requested: e.g. "Level 100 – Attachment" */}
                              <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                                {slot.slotName}
                              </h3>
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-background font-semibold">
                                Required Upload
                              </Badge>
                              {isUploaded ? (
                                <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Uploaded
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-[10px] font-bold gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Missing Document
                                </Badge>
                              )}
                            </div>

                            {isUploaded && report ? (
                              <div className="space-y-1 pt-0.5">
                                <p className="text-xs font-semibold text-foreground">
                                  {report.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                    Date Uploaded: <strong className="text-foreground">{report.submittedDate}</strong>
                                  </span>
                                  {report.fileName && (
                                    <span>• {report.fileName} ({report.fileSize || '320 KB'})</span>
                                  )}
                                  {report.grade !== undefined && (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      • Score: {report.grade}%
                                    </span>
                                  )}
                                </div>
                                {report.feedback && (
                                  <p className="text-xs text-muted-foreground italic bg-background/80 rounded-md p-2 mt-1.5 border border-border/60">
                                    💬 Feedback: "{report.feedback}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                                {slot.description} <span className="font-semibold text-amber-700 dark:text-amber-400">Please upload your document to fulfill this level requirement.</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badges & Actions */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                          {isUploaded && report ? (
                            <>
                              <Badge className={`text-xs font-semibold gap-1 px-2.5 py-0.5 ${
                                report.status === 'graded'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {report.status === 'graded' ? `Graded (${report.grade || 85}%)` : 'Reviewed'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReportForView(item)}
                                className="h-8 px-3 text-xs gap-1 rounded-lg border-border"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Details
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-xs font-semibold gap-1 px-2.5 py-0.5">
                                <Clock className="w-3 h-3" />
                                Pending Upload
                              </Badge>
                              {user?.role === 'student' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenUploadForSlot(slot.slotKey)}
                                  className="btn-primary text-xs h-8 px-3.5 rounded-lg font-semibold gap-1.5"
                                >
                                  <Upload className="w-3.5 h-3.5" /> Upload Now
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* REPORT DETAILS MODAL                                                      */}
        {/* ========================================================================= */}
        <Dialog open={!!selectedReportForView} onOpenChange={open => !open && setSelectedReportForView(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                <FileCheck className="w-4 h-4" /> Requirement Verification
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {selectedReportForView?.slot.slotName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedReportForView?.slot.description}
              </DialogDescription>
            </DialogHeader>

            {selectedReportForView?.report && (
              <div className="space-y-4 pt-3 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-secondary/50 rounded-xl">
                  <div>
                    <span className="text-xs text-muted-foreground">Requirement Slot</span>
                    <p className="text-xs font-bold text-foreground mt-0.5">{selectedReportForView.slot.slotName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Date Uploaded</span>
                    <p className="text-xs font-bold text-foreground mt-0.5">{selectedReportForView.report.submittedDate}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Attached Document</span>
                    <p className="text-xs font-medium text-foreground truncate mt-0.5">{selectedReportForView.report.fileName || 'report.pdf'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Assessment Grade</span>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedReportForView.report.grade ? `${selectedReportForView.report.grade}% (Good)` : 'Submitted for Grading'}
                    </p>
                  </div>
                </div>

                {selectedReportForView.report.description && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Document Summary</span>
                    <p className="text-xs text-foreground bg-background border border-border/80 rounded-xl p-3 leading-relaxed">
                      {selectedReportForView.report.description}
                    </p>
                  </div>
                )}

                {selectedReportForView.report.feedback && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Supervisor Evaluation</span>
                    <p className="text-xs text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 leading-relaxed">
                      {selectedReportForView.report.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.success(`Downloading ${selectedReportForView?.report?.fileName || 'document'}...`);
                }}
                className="gap-1.5 text-xs rounded-xl h-10"
              >
                <Download className="w-3.5 h-3.5" /> Download Document
              </Button>
              <Button
                onClick={() => setSelectedReportForView(null)}
                className="btn-primary text-xs rounded-xl h-10"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* UPLOAD REPORT DIALOG (Targeted for specific Level Requirement Slot)       */}
        {/* ========================================================================= */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Upload className="w-5 h-5 text-primary" /> Upload Level Requirement Document
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Select the requirement slot to fulfill with your PDF or DOCX file.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-3">
              {/* Slot Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="slotChoice" className="text-xs font-semibold">Target Requirement Slot *</Label>
                <select
                  id="slotChoice"
                  value={targetSlotKey}
                  onChange={e => {
                    const val = e.target.value;
                    setTargetSlotKey(val);
                    const sel = allSlotsList.find(s => s.slot.slotKey === val)?.slot;
                    if (sel) {
                      setUploadTitle(`${sel.slotName} Report`);
                      setUploadDescription(sel.description);
                    }
                  }}
                  className="w-full h-10 px-3 border border-input rounded-xl bg-background text-xs font-semibold"
                >
                  {allSlotsList.map(item => (
                    <option key={item.slot.slotKey} value={item.slot.slotKey}>
                      {item.slot.slotName} {item.isUploaded ? '✓ (Replace Upload)' : '⚠️ (Missing - Upload Required)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="repTitle" className="text-xs font-semibold">Document Title *</Label>
                <Input
                  id="repTitle"
                  placeholder="e.g. Level 300 – Attachment: Comprehensive Industrial Report"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="repDesc" className="text-xs font-semibold">Brief Summary / Remarks</Label>
                <Textarea
                  id="repDesc"
                  rows={3}
                  placeholder="Summarize key tasks, company background, and learning outcomes..."
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  className="text-xs rounded-xl resize-none"
                />
              </div>

              {/* File Attachment */}
              <div className="space-y-1.5">
                <Label htmlFor="repFile" className="text-xs font-semibold">Document File (PDF, DOCX) *</Label>
                <Input
                  id="repFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => {
                    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                  }}
                  className="h-10 text-xs rounded-xl"
                />
                {uploadFile && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Selected file: <strong className="text-foreground">{uploadFile.name}</strong> ({Math.round(uploadFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  className="text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="btn-primary text-xs rounded-xl h-10 font-semibold"
                >
                  {isUploading ? 'Uploading...' : 'Submit Document'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
