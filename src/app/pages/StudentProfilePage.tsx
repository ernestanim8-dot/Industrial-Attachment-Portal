import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  User as UserIcon, GraduationCap, Building2, MapPin, Phone,
  Mail, Calendar, Award, Edit3,
  Printer, ArrowLeft, ShieldCheck, Briefcase, AlertCircle,
  Sparkles, HeartHandshake, BookOpen, ExternalLink,
  Plus
} from 'lucide-react';
import ttuLogo from '../../assets/TTU LOGO.jpg';

export function StudentProfilePage() {
  const { user } = useAuth();
  const { students, reports, updateStudentProfile } = useData();
  const navigate = useNavigate();

  // Find student matching current logged in user or default to student1
  const student = useMemo(() => {
    return students.find(s =>
      (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
      s.id === user?.id ||
      (user?.name && s.name.toLowerCase() === user.name.toLowerCase()) ||
      s.studentId === user?.studentId
    ) || students[0];
  }, [students, user]);

  const [activeTab, setActiveTab] = useState<'academic' | 'attachment' | 'milestones' | 'contact' | 'skills'>('academic');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: student?.name || '',
    phone: student?.phone || '',
    personalEmail: student?.personalEmail || '',
    address: student?.address || '',
    hallOfResidence: student?.hallOfResidence || '',
    bio: student?.bio || '',
    skills: student?.skills?.join(', ') || '',
    emergencyName: student?.emergencyContact?.name || '',
    emergencyRelationship: student?.emergencyContact?.relationship || '',
    emergencyPhone: student?.emergencyContact?.phone || '',
    emergencyEmail: student?.emergencyContact?.email || '',
    industrySupervisorName: student?.industrySupervisor?.name || '',
    industrySupervisorTitle: student?.industrySupervisor?.title || '',
    industrySupervisorPhone: student?.industrySupervisor?.phone || '',
    industrySupervisorEmail: student?.industrySupervisor?.email || '',
  });

  // Calculate profile completion score
  const completionScore = useMemo(() => {
    let score = 50; // base from user creation
    if (student?.phone) score += 10;
    if (student?.personalEmail) score += 10;
    if (student?.address) score += 10;
    if (student?.emergencyContact?.name) score += 10;
    if (student?.industrySupervisor?.name) score += 10;
    return Math.min(score, 100);
  }, [student]);

  // Assessment and reports calculation
  const studentReports = useMemo(() => {
    return reports.filter(r =>
      r.studentId === student?.id ||
      (r.studentName && student?.name && r.studentName.toLowerCase() === student.name.toLowerCase())
    );
  }, [reports, student]);

  const gradedReports = useMemo(() => studentReports.filter(r => r.status === 'graded'), [studentReports]);
  const avgGrade = useMemo(() => {
    return gradedReports.length > 0
      ? Math.round(gradedReports.reduce((acc, r) => acc + (r.grade || 0), 0) / gradedReports.length)
      : (student?.progress ? Math.round(student.progress * 0.95 + 15) : 85);
  }, [gradedReports, student]);

  const handleOpenEditModal = () => {
    setFormData({
      name: student?.name || '',
      phone: student?.phone || '',
      personalEmail: student?.personalEmail || '',
      address: student?.address || '',
      hallOfResidence: student?.hallOfResidence || '',
      bio: student?.bio || '',
      skills: student?.skills?.join(', ') || '',
      emergencyName: student?.emergencyContact?.name || '',
      emergencyRelationship: student?.emergencyContact?.relationship || '',
      emergencyPhone: student?.emergencyContact?.phone || '',
      emergencyEmail: student?.emergencyContact?.email || '',
      industrySupervisorName: student?.industrySupervisor?.name || '',
      industrySupervisorTitle: student?.industrySupervisor?.title || '',
      industrySupervisorPhone: student?.industrySupervisor?.phone || '',
      industrySupervisorEmail: student?.industrySupervisor?.email || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const parsedSkills = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    await updateStudentProfile(student.id, {
      phone: formData.phone,
      personalEmail: formData.personalEmail,
      address: formData.address,
      hallOfResidence: formData.hallOfResidence,
      bio: formData.bio,
      skills: parsedSkills.length > 0 ? parsedSkills : student.skills,
      emergencyContact: {
        name: formData.emergencyName,
        relationship: formData.emergencyRelationship,
        phone: formData.emergencyPhone,
        email: formData.emergencyEmail,
      },
      industrySupervisor: {
        name: formData.industrySupervisorName,
        title: formData.industrySupervisorTitle,
        phone: formData.industrySupervisorPhone,
        email: formData.industrySupervisorEmail,
      },
    });

    setIsEditModalOpen(false);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <DashboardLayout title="Student Profile">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back and Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student')}
            className="gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="gap-2 text-xs font-medium"
            >
              <Printer className="w-4 h-4 text-muted-foreground" />
              Print Verification Record
            </Button>
            <Button
              size="sm"
              onClick={handleOpenEditModal}
              className="gap-2 text-xs btn-primary font-semibold"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HERO PROFILE BANNER CARD */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {/* Top Decorative gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-linear-to-r from-blue-600 via-indigo-600 to-amber-500" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
            {/* Left Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-linear-to-br from-primary to-indigo-700 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-primary/20 border-4 border-white dark:border-card">
                  {student?.name
                    ? student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'ST'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-card shadow-xs" title="Verified Attachment Student">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {student?.name || 'Student Name'}
                  </h2>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">
                    Level {student?.currentLevel ? `${student.currentLevel}00` : '300'}
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-xs font-semibold">
                    Attachment In Progress
                  </Badge>
                </div>

                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  {student?.programme || student?.department || 'B.Tech in Graphic Design'}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                  <span>
                    Index No: <strong className="text-foreground">{student?.indexNumber || '0722000045'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Reg No: <strong className="text-foreground">{student?.registrationNumber || student?.studentId || 'BC/GRD/22/012'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Host: <strong className="text-primary">{student?.company || 'Tech Corp Ltd'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Summary Score Widget */}
            <div className="w-full lg:w-72 bg-secondary/70 border border-border/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Profile Completeness</span>
                <span className="text-xs font-bold text-primary">{completionScore}%</span>
              </div>
              <Progress value={completionScore} className="h-2 bg-secondary" />

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Overall Grade</span>
                  <span className="text-base font-extrabold text-foreground">{avgGrade}%</span>
                </div>
                <Badge className={avgGrade >= 80 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}>
                  {avgGrade >= 80 ? 'Grade A (Good)' : 'Grade B (Average)'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-2 border-b border-border mt-8 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveTab('academic')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'academic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Academic & Bio
            </button>

            <button
              onClick={() => setActiveTab('attachment')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'attachment'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Industrial Placement
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'milestones'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award className="w-4 h-4" />
              Progress & Logbook
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'contact'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Contact & Emergency
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'skills'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Skills & Objectives
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: ACADEMIC & BIO */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'academic' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Academic Profile Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Faculty / School</span>
                    <p className="font-bold text-foreground">
                      {student?.faculty || 'Faculty of Applied Arts and Technology'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Department</span>
                    <p className="font-bold text-foreground">
                      {student?.department || 'Department of Graphic Design'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Programme of Study</span>
                    <p className="font-bold text-foreground">
                      {student?.programme || 'Bachelor of Technology in Graphic Design'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Academic Year & Semester</span>
                    <p className="font-bold text-foreground">
                      {student?.academicYear || '2025/2026'} • {student?.semester || '2nd Semester'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Official Student ID Number</span>
                    <p className="font-bold text-foreground font-mono">
                      {student?.studentId || 'STU001'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Student Registration Number</span>
                    <p className="font-bold text-foreground font-mono">
                      {student?.registrationNumber || 'BC/GRD/22/012'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Examination Index Number</span>
                    <p className="font-bold text-foreground font-mono">
                      {student?.indexNumber || '0722000045'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Campus / Hall of Residence</span>
                    <p className="font-bold text-foreground">
                      {student?.hallOfResidence || 'Authur Hall (Room B12), Main Campus'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio & Career Objectives */}
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary" />
                  Student Bio & Career Aspirations
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {student?.bio ||
                    'Undergraduate student at Takoradi Technical University currently undertaking industrial attachment to gain hands-on industrial expertise, develop industry standards, and apply classroom theory into commercial production workflows.'}
                </p>
              </div>
            </div>

            {/* Right Column: Institutional Supervisor & Institution Card */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-1.5 border border-border shadow-xs flex items-center justify-center">
                    <img src={ttuLogo} alt="TTU" className="max-h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Takoradi Technical University</h4>
                    <p className="text-xs text-muted-foreground">Liaison Office & Attachment Board</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block">Assigned Academic Supervisor</span>
                  <p className="text-sm font-bold text-foreground">
                    {student?.academicSupervisorName || 'Mrs. Josephine Sarpong- Nyantakyi'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Department of Graphic Design
                  </p>
                  <div className="pt-2 border-t border-border/60 text-xs space-y-1">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      {student?.academicSupervisorEmail || 'josephine.sarpong@university.edu'}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      {student?.academicSupervisorPhone || '+233 20 123 4567'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-secondary/50 rounded-xl space-y-1 text-xs">
                  <span className="font-semibold text-foreground">Industrial Attachment Period:</span>
                  <p className="text-muted-foreground">
                    {student?.attachmentStartDate || '2026-01-15'} to {student?.attachmentEndDate || '2026-06-15'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: INDUSTRIAL PLACEMENT */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'attachment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Assigned Host Organization
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-xl space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Company / Industry Name</span>
                  <p className="text-base font-extrabold text-foreground">
                    {student?.assignedLocationName || student?.company || 'Tech Corp Ltd'}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    {student?.assignedLocationZone || 'Greater Accra Industrial Zone'}
                  </p>
                </div>

                <div className="p-4 bg-secondary/50 rounded-xl space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Workplace Physical Address</span>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    {student?.assignedLocationAddress || '12 Independence Avenue, Ridge, Accra'}
                  </p>
                  <p className="text-xs text-muted-foreground pl-5">
                    City: {student?.assignedLocationCity || 'Accra'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-muted-foreground">Commencement Date</span>
                    <p className="font-bold text-foreground">{student?.attachmentStartDate || '2026-01-15'}</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-xl space-y-1">
                    <span className="text-muted-foreground">Expected Completion</span>
                    <p className="font-bold text-foreground">{student?.attachmentEndDate || '2026-06-15'}</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">Workplace Geofence Active</p>
                      <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">GPS radius verified for daily check-in attendance</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Verified</Badge>
                </div>
              </div>
            </div>

            {/* Industry Supervisor Details */}
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Industry-Based Workplace Supervisor
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-xl space-y-2">
                  <span className="text-xs text-muted-foreground font-medium">Supervisor In Charge</span>
                  <p className="text-base font-bold text-foreground">
                    {student?.industrySupervisor?.name || 'Mr. Alex Mensah'}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    {student?.industrySupervisor?.title || 'Lead Creative Director & Brand Strategist'}
                  </p>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div className="text-xs">
                      <span className="text-muted-foreground block">Phone Contact</span>
                      <span className="font-bold text-foreground">
                        {student?.industrySupervisor?.phone || '+233 54 889 0123'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div className="text-xs">
                      <span className="text-muted-foreground block">Work Email</span>
                      <span className="font-bold text-foreground">
                        {student?.industrySupervisor?.email || 'alex.mensah@techcorp.com.gh'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Supervisor Endorsement Notice
                  </p>
                  <p className="leading-relaxed">
                    Weekly logbook summaries must be signed and stamped by your industry supervisor before university grade submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: PROGRESS & LOGBOOK MILESTONES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white dark:bg-card border border-border rounded-2xl shadow-sm space-y-2">
                <span className="text-xs text-muted-foreground font-semibold">Total Progress</span>
                <p className="text-3xl font-extrabold text-foreground">{student?.progress || 65}%</p>
                <Progress value={student?.progress || 65} className="h-2" />
              </div>

              <div className="p-5 bg-white dark:bg-card border border-border rounded-2xl shadow-sm space-y-2">
                <span className="text-xs text-muted-foreground font-semibold">Cumulative Grade</span>
                <p className="text-3xl font-extrabold text-primary">{avgGrade}%</p>
                <span className="inline-block text-xs font-bold text-emerald-600">Good Standing</span>
              </div>

              <div className="p-5 bg-white dark:bg-card border border-border rounded-2xl shadow-sm space-y-2">
                <span className="text-xs text-muted-foreground font-semibold">Reports Submitted</span>
                <p className="text-3xl font-extrabold text-foreground">{studentReports.length}</p>
                <span className="text-xs text-muted-foreground">{gradedReports.length} Graded by Supervisor</span>
              </div>

              <div className="p-5 bg-white dark:bg-card border border-border rounded-2xl shadow-sm space-y-2">
                <span className="text-xs text-muted-foreground font-semibold">On-Site Compliance</span>
                <p className="text-3xl font-extrabold text-emerald-600">96%</p>
                <span className="text-xs text-muted-foreground">Geofenced Work Check-Ins</span>
              </div>
            </div>

            {/* Level Projects Timeline */}
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Attachment Level Progression (Level 100 to 400)
                </h3>
                <Link to="/student/progress" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  Detailed History <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-4">
                {(student?.levelProjects || []).map(lp => (
                  <div
                    key={lp.id}
                    className="p-4 bg-secondary/40 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold text-xs bg-white dark:bg-card">
                          {lp.levelName}
                        </Badge>
                        <h4 className="font-bold text-foreground text-sm">{lp.projectTitle}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {lp.companyOrHost} • {lp.academicYear}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {lp.description}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <Badge className={lp.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}>
                        {lp.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                      {lp.finalGrade && (
                        <span className="text-xs font-bold text-foreground">
                          Score: {lp.finalGrade}% ({lp.remark})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 4: CONTACT & EMERGENCY */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Student Contact Details
              </h3>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 bg-secondary/50 rounded-xl flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-xs">
                    <span className="text-muted-foreground block">Institutional Email</span>
                    <span className="font-bold text-foreground">{student?.email}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-secondary/50 rounded-xl flex items-center gap-3">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="text-xs">
                    <span className="text-muted-foreground block">Personal Email</span>
                    <span className="font-bold text-foreground">{student?.personalEmail || 'johndoe.tech@gmail.com'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-secondary/50 rounded-xl flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-xs">
                    <span className="text-muted-foreground block">Primary Phone Number</span>
                    <span className="font-bold text-foreground">{student?.phone || '+233 50 231 0663'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-secondary/50 rounded-xl flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-xs">
                    <span className="text-muted-foreground block">Residential Address</span>
                    <span className="font-bold text-foreground">
                      {student?.address || 'House No. 14, West Tanokrom, Takoradi'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact / Next of Kin */}
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-red-500" />
                Next of Kin / Emergency Contact
              </h3>

              <div className="space-y-3 text-sm">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/60 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider block">
                    Designated Contact Person
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {student?.emergencyContact?.name || 'Mr. Samuel Doe'}
                  </p>
                  <Badge variant="outline" className="text-xs font-semibold bg-white dark:bg-card">
                    {student?.emergencyContact?.relationship || 'Father / Guardian'}
                  </Badge>
                </div>

                <div className="p-3.5 bg-secondary/50 rounded-xl flex items-center gap-3">
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="text-xs">
                    <span className="text-muted-foreground block">Emergency Phone</span>
                    <span className="font-bold text-foreground">
                      {student?.emergencyContact?.phone || '+233 24 456 7890'}
                    </span>
                  </div>
                </div>

                {student?.emergencyContact?.email && (
                  <div className="p-3.5 bg-secondary/50 rounded-xl flex items-center gap-3">
                    <Mail className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="text-xs">
                      <span className="text-muted-foreground block">Emergency Email</span>
                      <span className="font-bold text-foreground">
                        {student.emergencyContact.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 5: SKILLS & OBJECTIVES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Core Competencies & Design / Technical Skills
                </h3>
                <Button size="sm" variant="outline" onClick={handleOpenEditModal} className="text-xs gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" /> Edit Skills
                </Button>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {(student?.skills || ['UI/UX Design', 'Brand Identity', 'Adobe Illustrator', 'Figma', 'Prepress Workflow', 'Typography', 'Color Calibration']).map((skill, idx) => (
                  <Badge
                    key={idx}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Attachment Training Objectives (TTU Curriculum)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-secondary/50 rounded-xl space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    01
                  </div>
                  <h4 className="font-bold text-foreground text-sm">Industrial Standard Tools</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Master modern production workflows, industry software suites, and automated machinery standards.
                  </p>
                </div>

                <div className="p-4 bg-secondary/50 rounded-xl space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    02
                  </div>
                  <h4 className="font-bold text-foreground text-sm">Professional Work Ethic</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Demonstrate punctuality, teamwork, workplace safety guidelines, and client accountability.
                  </p>
                </div>

                <div className="p-4 bg-secondary/50 rounded-xl space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    03
                  </div>
                  <h4 className="font-bold text-foreground text-sm">Daily Technical Logging</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Maintain continuous daily report logs and weekly verified summaries for academic assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* EDIT PROFILE MODAL */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Update Student Profile
              </DialogTitle>
              <DialogDescription>
                Modify your contact numbers, address, emergency next of kin, and supervisor details.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Primary Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+233 50 123 4567"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="personalEmail">Personal Email Address</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={e => setFormData({ ...formData, personalEmail: e.target.value })}
                    placeholder="student@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address">Residential Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House No, Area, City"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hallOfResidence">Hall of Residence / Campus</Label>
                  <Input
                    id="hallOfResidence"
                    value={formData.hallOfResidence}
                    onChange={e => setFormData({ ...formData, hallOfResidence: e.target.value })}
                    placeholder="Authur Hall / Main Campus"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Personal Bio & Career Focus</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a short summary of your background and learning goals..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="skills">Skills & Competencies (comma separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={e => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="UI/UX Design, Figma, Adobe Illustrator, Prepress"
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-border space-y-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-red-500" />
                  Emergency Contact / Next of Kin
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="emergencyName" className="text-xs">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergencyName}
                      onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emergencyRelationship" className="text-xs">Relationship</Label>
                    <Input
                      id="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={e => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                      placeholder="e.g. Father, Mother, Guardian"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emergencyPhone" className="text-xs">Emergency Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+233 24 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Industry Supervisor Details */}
              <div className="pt-2 border-t border-border space-y-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Industry Supervisor Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="industrySupervisorName" className="text-xs">Supervisor Full Name</Label>
                    <Input
                      id="industrySupervisorName"
                      value={formData.industrySupervisorName}
                      onChange={e => setFormData({ ...formData, industrySupervisorName: e.target.value })}
                      placeholder="e.g. Mr. Alex Mensah"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="industrySupervisorTitle" className="text-xs">Designation / Role</Label>
                    <Input
                      id="industrySupervisorTitle"
                      value={formData.industrySupervisorTitle}
                      onChange={e => setFormData({ ...formData, industrySupervisorTitle: e.target.value })}
                      placeholder="e.g. Creative Director"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="industrySupervisorPhone" className="text-xs">Phone Contact</Label>
                    <Input
                      id="industrySupervisorPhone"
                      value={formData.industrySupervisorPhone}
                      onChange={e => setFormData({ ...formData, industrySupervisorPhone: e.target.value })}
                      placeholder="+233 54 123 4567"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="industrySupervisorEmail" className="text-xs">Work Email</Label>
                    <Input
                      id="industrySupervisorEmail"
                      type="email"
                      value={formData.industrySupervisorEmail}
                      onChange={e => setFormData({ ...formData, industrySupervisorEmail: e.target.value })}
                      placeholder="supervisor@company.com"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* PRINTABLE VERIFICATION MODAL / RECORD SLIP */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Student Industrial Attachment Verification Record
              </DialogTitle>
              <DialogDescription>
                Printable official record of registration and placement credentials.
              </DialogDescription>
            </DialogHeader>

            <div id="printable-record-slip" className="border border-border rounded-xl p-6 bg-white dark:bg-card text-foreground space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-primary gap-4">
                <div className="w-16 h-16 shrink-0">
                  <img src={ttuLogo} alt="TTU" className="w-full h-full object-contain" />
                </div>
                <div className="text-center flex-1">
                  <h3 className="font-extrabold text-base tracking-wide uppercase text-primary">
                    Takoradi Technical University
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Directorate of Industrial Liaison & Career Placement
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Student Attachment Verification Slip • Academic Year 2025/2026
                  </p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground shrink-0">
                  <span>Date: {new Date().toLocaleDateString()}</span>
                  <p className="font-mono text-primary font-bold">STATUS: VERIFIED</p>
                </div>
              </div>

              {/* Student Identification Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Full Student Name:</span>
                  <strong className="text-sm text-foreground">{student?.name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Programme:</span>
                  <strong className="text-sm text-foreground">{student?.programme || student?.department}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Student ID / Index No:</span>
                  <strong className="text-sm text-foreground">{student?.studentId} / {student?.indexNumber || '0722000045'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Registration No:</span>
                  <strong className="text-sm text-foreground">{student?.registrationNumber || 'BC/GRD/22/012'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Academic Level:</span>
                  <strong className="text-sm text-foreground">Level {student?.currentLevel ? `${student.currentLevel}00` : '300'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Contact Phone:</span>
                  <strong className="text-sm text-foreground">{student?.phone || '+233 50 231 0663'}</strong>
                </div>
              </div>

              {/* Attachment Placement Details */}
              <div className="p-4 bg-secondary/60 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-primary uppercase tracking-wider block">Attachment Placement Information</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block">Host Organization:</span>
                    <strong className="text-foreground">{student?.assignedLocationName || student?.company}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Workplace Location:</span>
                    <strong className="text-foreground">{student?.assignedLocationAddress || '12 Independence Avenue, Accra'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Placement Duration:</span>
                    <strong className="text-foreground">{student?.attachmentStartDate || '2026-01-15'} to {student?.attachmentEndDate || '2026-06-15'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Institutional Academic Supervisor:</span>
                    <strong className="text-foreground">{student?.academicSupervisorName || 'Mrs. Josephine Sarpong- Nyantakyi'}</strong>
                  </div>
                </div>
              </div>

              {/* Endorsement Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border text-xs">
                <div className="space-y-6">
                  <div className="border-b border-muted-foreground/50 h-8" />
                  <p className="text-center font-semibold text-muted-foreground">Student Signature & Date</p>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-muted-foreground/50 h-8" />
                  <p className="text-center font-semibold text-muted-foreground">Industrial Liaison Stamp / Date</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
                Close
              </Button>
              <Button onClick={handlePrintSlip} className="btn-primary gap-2">
                <Printer className="w-4 h-4" /> Print Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
