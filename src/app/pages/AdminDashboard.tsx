import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Download, Users, UserCheck, FileText, TrendingUp, UserPlus, Trash2, Eye, FileSignature, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { downloadApiFile } from '../api';
import { Student, UserRole, AttachmentLetterSubmission } from '../types';
import { AssumptionSubmission } from '../types';

export function AdminDashboard() {
  const { students, supervisors, reports, assignSupervisor, addStudent, removeUser, assumptionSubmissions, updateAssumptionStatus, attachmentLetterSubmissions, updateAttachmentLetterStatus } = useData();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAssumption, setSelectedAssumption] = useState<AssumptionSubmission | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<AttachmentLetterSubmission | null>(null);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');

  const totalUsers = students.length + supervisors.length;
  const assignedStudents = students.filter(s => s.supervisorId).length;
  const unassignedStudents = students.filter(s => !s.supervisorId);
  const avgProgress = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)
    : 0;

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await downloadApiFile('/reports/export/csv', 'admin_reports.csv');
      toast.success('Reports exported successfully');
    } catch { toast.error('Failed to export'); } finally { setIsExporting(false); }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserRole === 'student') {
      addStudent({ email: newUserEmail, name: newUserName, role: 'student', department: newUserDepartment, company: newUserCompany || undefined });
    }
    toast.success(`${newUserRole === 'student' ? 'Student' : 'Supervisor'} added successfully!`);
    setIsAddUserDialogOpen(false);
    setNewUserName(''); setNewUserEmail(''); setNewUserRole('student');
    setNewUserDepartment(''); setNewUserCompany('');
  };

  const handleAssignSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSupervisorId) { toast.error('Please select a supervisor'); return; }
    assignSupervisor(selectedStudent.id, selectedSupervisorId);
    toast.success('Supervisor assigned!');
    setIsAssignDialogOpen(false); setSelectedStudent(null); setSelectedSupervisorId('');
  };

  const handleRemoveUser = (userId: string, userName: string) => {
    if (confirm(`Remove ${userName}?`)) { removeUser(userId); toast.success('User removed!'); }
  };

  const departments = [
    'Bachelor of Technology in Graphic Design',
    'Bachelor of Technology in Ceramics',
    'Bachelor of Technology in Textiles',
    'Bachelor of Technology in Fashion Design',
    'Bachelor of Technology in Sculpture and Industrial Production',
    'Bachelor of Technology in Painting',
  ];

  const pendingAssumptions = assumptionSubmissions.filter(a => a.status === 'pending').length;
  const pendingLetters = attachmentLetterSubmissions.filter(l => l.status === 'pending').length;

  const stats = [
    { label: 'Total Users', value: totalUsers, sub: `${students.length} students · ${supervisors.length} supervisors`, icon: Users, gradient: 'stat-card-blue' },
    { label: 'Total Reports', value: reports.length, sub: 'All submissions', icon: FileText, gradient: 'stat-card-violet' },
    { label: 'Assigned Students', value: assignedStudents, sub: `${unassignedStudents.length} unassigned`, icon: UserCheck, gradient: 'stat-card-green' },
    { label: 'Avg Progress', value: `${avgProgress}%`, sub: 'Across all students', icon: TrendingUp, gradient: 'stat-card-amber' },
    { label: 'Assumption Forms', value: assumptionSubmissions.length, sub: `${pendingAssumptions} pending review`, icon: FileSignature, gradient: 'stat-card-violet' },
    { label: 'Letter Requests', value: attachmentLetterSubmissions.length, sub: `${pendingLetters} pending review`, icon: Paperclip, gradient: 'stat-card-blue' },
  ];

  const statusBadge = (status: string) => {
    if (status === 'graded') return <span className="badge-green px-2 py-0.5 rounded-md text-xs font-medium">Graded</span>;
    if (status === 'reviewed') return <span className="badge-blue px-2 py-0.5 rounded-md text-xs font-medium">Reviewed</span>;
    return <span className="badge-amber px-2 py-0.5 rounded-md text-xs font-medium">Pending</span>;
  };

  const assumptionStatusBadge = (status: AssumptionSubmission['status']) => {
    if (status === 'approved') return <span className="badge-green px-2 py-0.5 rounded-md text-xs font-medium">Approved</span>;
    if (status === 'rejected') return <span className="badge-red px-2 py-0.5 rounded-md text-xs font-medium">Rejected</span>;
    return <span className="badge-amber px-2 py-0.5 rounded-md text-xs font-medium">Pending</span>;
  };

  const letterStatusBadge = (status: AttachmentLetterSubmission['status']) => {
    if (status === 'approved') return <span className="badge-green px-2 py-0.5 rounded-md text-xs font-medium">Approved</span>;
    if (status === 'rejected') return <span className="badge-red px-2 py-0.5 rounded-md text-xs font-medium">Rejected</span>;
    return <span className="badge-amber px-2 py-0.5 rounded-md text-xs font-medium">Pending</span>;
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        {unassignedStudents.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm text-amber-800 font-medium flex-1">
              {unassignedStudents.length} student{unassignedStudents.length > 1 ? 's' : ''} still need supervisor assignment
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary px-4 py-2 rounded-lg text-sm">
                <UserPlus className="w-4 h-4" /> Add New User
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new student or supervisor account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={newUserName} onChange={e => setNewUserName(e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@university.edu" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={v => setNewUserRole(v as UserRole)}>
                    <SelectTrigger id="role" className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dept">Department</Label>
                  <Select value={newUserDepartment} onValueChange={setNewUserDepartment} required>
                    <SelectTrigger id="dept" className="h-10"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {newUserRole === 'student' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input id="company" placeholder="Tech Corp Ltd" value={newUserCompany} onChange={e => setNewUserCompany(e.target.value)} className="h-10" />
                  </div>
                )}
                <button type="submit" className="btn-primary w-full h-10 rounded-lg">Add User</button>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={isExporting}>
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting…' : 'Export Data'}
          </Button>
        </div>

        {/* User Management */}
        <div className="card-clean rounded-xl">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">User Management</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage students and supervisors</p>
          </div>
          <div className="p-5">
            <Tabs defaultValue="students">
              <TabsList className="bg-secondary mb-4 h-9">
                <TabsTrigger value="students" className="text-xs">Students ({students.length})</TabsTrigger>
                <TabsTrigger value="supervisors" className="text-xs">Supervisors ({supervisors.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="mt-0">
                <div className="rounded-xl border border-border overflow-x-auto">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow className="bg-secondary hover:bg-secondary">
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Email</TableHead>
                        <TableHead className="text-xs font-semibold">Department</TableHead>
                        <TableHead className="text-xs font-semibold">Company</TableHead>
                        <TableHead className="text-xs font-semibold">Supervisor</TableHead>
                        <TableHead className="text-xs font-semibold">Progress</TableHead>
                        <TableHead className="text-xs font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No students found</TableCell>
                        </TableRow>
                      ) : students.map(student => {
                        const supervisor = supervisors.find(s => s.id === student.supervisorId);
                        return (
                          <TableRow key={student.id} className="hover:bg-secondary/50">
                            <TableCell className="font-medium text-sm">{student.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{student.department}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{student.company || '—'}</TableCell>
                            <TableCell>
                              {supervisor
                                ? <span className="badge-green px-2 py-0.5 rounded-md text-xs font-medium">{supervisor.name}</span>
                                : <span className="badge-red px-2 py-0.5 rounded-md text-xs font-medium">Unassigned</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={student.progress} className="w-16 h-1.5" />
                                <span className="text-xs font-medium text-foreground">{student.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="text-xs h-7 px-2"
                                  onClick={() => { setSelectedStudent(student); setIsAssignDialogOpen(true); }}>
                                  {supervisor ? 'Reassign' : 'Assign'}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                  onClick={() => handleRemoveUser(student.id, student.name)}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="supervisors" className="mt-0">
                <div className="rounded-xl border border-border overflow-x-auto">
                  <Table className="min-w-[580px]">
                    <TableHeader>
                      <TableRow className="bg-secondary hover:bg-secondary">
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Email</TableHead>
                        <TableHead className="text-xs font-semibold">Department</TableHead>
                        <TableHead className="text-xs font-semibold">Students</TableHead>
                        <TableHead className="text-xs font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supervisors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No supervisors found</TableCell>
                        </TableRow>
                      ) : supervisors.map(supervisor => (
                        <TableRow key={supervisor.id} className="hover:bg-secondary/50">
                          <TableCell className="font-medium text-sm">{supervisor.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{supervisor.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{supervisor.department}</TableCell>
                          <TableCell>
                            <span className="badge-blue px-2 py-0.5 rounded-md text-xs font-medium">
                              {supervisor.assignedStudents.length} students
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => handleRemoveUser(supervisor.id, supervisor.name)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-clean rounded-xl">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest report submissions</p>
          </div>
          <div className="p-5">
            {reports.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No reports submitted yet
              </div>
            ) : (
              <div className="space-y-2">
                {reports
                  .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
                  .slice(0, 10)
                  .map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground">{report.studentName} · {new Date(report.submittedDate).toLocaleDateString()}</p>
                      </div>
                      {statusBadge(report.status)}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Assumption Forms */}
        <div className="card-clean rounded-xl">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                Assumption of Duty Forms
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Submitted by students to the Industrial Liaison office</p>
            </div>
            {pendingAssumptions > 0 && (
              <span className="badge-amber px-2 py-0.5 rounded-md text-xs font-medium">
                {pendingAssumptions} pending
              </span>
            )}
          </div>
          <div className="p-5">
            {assumptionSubmissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No assumption forms submitted yet
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-x-auto">
                <Table className="min-w-[680px]">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead className="text-xs font-semibold">Student</TableHead>
                      <TableHead className="text-xs font-semibold">Company</TableHead>
                      <TableHead className="text-xs font-semibold">Zone</TableHead>
                      <TableHead className="text-xs font-semibold">Commencement</TableHead>
                      <TableHead className="text-xs font-semibold">Submitted</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assumptionSubmissions
                      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                      .map(sub => (
                        <TableRow key={sub.id} className="hover:bg-secondary/50">
                          <TableCell className="font-medium text-sm">{sub.studentName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{sub.companyName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{sub.companyZone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{sub.dateOfCommencement}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>{assumptionStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1"
                                onClick={() => setSelectedAssumption(sub)}>
                                <Eye className="w-3 h-3" /> View
                              </Button>
                              {sub.status === 'pending' && (
                                <>
                                  <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => updateAssumptionStatus(sub.id, 'approved')}>
                                    Approve
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => updateAssumptionStatus(sub.id, 'rejected')}>
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Attachment Letter Requests */}
        <div className="card-clean rounded-xl">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                Attachment Letter Requests
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Introductory letter requests submitted by students for approval</p>
            </div>
            {pendingLetters > 0 && (
              <span className="badge-amber px-2 py-0.5 rounded-md text-xs font-medium">
                {pendingLetters} pending
              </span>
            )}
          </div>
          <div className="p-5">
            {attachmentLetterSubmissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Paperclip className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No letter requests submitted yet
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-x-auto">
                <Table className="min-w-[680px]">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead className="text-xs font-semibold">Student</TableHead>
                      <TableHead className="text-xs font-semibold">Company Name</TableHead>
                      <TableHead className="text-xs font-semibold">Town / City</TableHead>
                      <TableHead className="text-xs font-semibold">Addressed To</TableHead>
                      <TableHead className="text-xs font-semibold">Submitted At</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attachmentLetterSubmissions
                      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                      .map(letter => (
                        <TableRow key={letter.id} className="hover:bg-secondary/50">
                          <TableCell className="font-medium text-sm">{letter.studentName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{letter.companyName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{letter.companyTown}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{letter.letterAddressedTo}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(letter.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>{letterStatusBadge(letter.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="text-xs h-7 px-2 gap-1"
                                onClick={() => setSelectedLetter(letter)}>
                                <Eye className="w-3 h-3" /> View & Print
                              </Button>
                              {letter.status === 'pending' && (
                                <>
                                  <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => { updateAttachmentLetterStatus(letter.id, 'approved'); toast.success('Introductory Letter Approved!'); }}>
                                    Approve
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => { updateAttachmentLetterStatus(letter.id, 'rejected'); toast.error('Request Rejected'); }}>
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assumption Detail Dialog */}
      <Dialog open={!!selectedAssumption} onOpenChange={open => { if (!open) setSelectedAssumption(null); }}>
        <DialogContent className="rounded-xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-primary" />
              Assumption of Duty Form
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedAssumption?.studentName} on{' '}
              {selectedAssumption && new Date(selectedAssumption.submittedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedAssumption && (
            <div className="space-y-4 pt-2">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm font-medium">Current Status</span>
                {assumptionStatusBadge(selectedAssumption.status)}
              </div>

              {/* Company Information */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Company Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Company Name', selectedAssumption.companyName],
                    ['Phone No', selectedAssumption.companyPhone],
                    ['Email', selectedAssumption.companyEmail || '—'],
                    ['Zone', selectedAssumption.companyZone],
                    ['Exact Location', selectedAssumption.companyLocation],
                    ['Address', selectedAssumption.companyAddress],
                    ['Supervisor', selectedAssumption.companySupervisor],
                    ['Letter Addressed To', selectedAssumption.letterAddressedTo],
                    ['Town / City', selectedAssumption.companyTown],
                    ['Date of Commencement', selectedAssumption.dateOfCommencement],
                    ['Supervisor Phone', selectedAssumption.supervisorPhone],
                  ].map(([label, value]) => (
                    <div key={label} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature */}
              <div className="p-3 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Student Signature</p>
                <p className="text-sm font-semibold italic text-foreground">{selectedAssumption.studentSignature}</p>
              </div>

              {/* Actions */}
              {selectedAssumption.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    className="flex-1 h-10 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    onClick={() => { updateAssumptionStatus(selectedAssumption.id, 'approved'); setSelectedAssumption(null); }}
                  >
                    ✓ Approve Form
                  </button>
                  <button
                    className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    onClick={() => { updateAssumptionStatus(selectedAssumption.id, 'rejected'); setSelectedAssumption(null); }}
                  >
                    ✗ Reject Form
                  </button>
                </div>
              )}
              {selectedAssumption.status !== 'pending' && (
                <button
                  className="w-full h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setSelectedAssumption(null)}
                >
                  Close
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attachment Letter Detail & Print Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={open => { if (!open) setSelectedLetter(null); }}>
        <DialogContent className="rounded-xl max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="p-5 border-b border-border bg-slate-50">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Paperclip className="w-5 h-5 text-primary" />
              Introductory Letter Request
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedLetter?.studentName} on{' '}
              {selectedLetter && new Date(selectedLetter.submittedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedLetter && (
            <div className="p-6 space-y-6 bg-white">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm font-medium">Request Status</span>
                {letterStatusBadge(selectedLetter.status)}
              </div>

              {/* Letter Preview Box */}
              <div className="p-6 border border-slate-200 rounded-lg shadow-inner bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Official Letter Preview</p>
                <div id="printable-letter-content" className="p-6 bg-white border border-slate-300 shadow-sm text-slate-800 text-sm leading-relaxed">
                  {/* TTU Letterhead */}
                  <div className="text-center border-b border-slate-900 pb-3 mb-4">
                    <h3 className="text-lg font-bold text-slate-900 uppercase">Takoradi Technical University</h3>
                    <p className="text-xs font-semibold text-slate-700 uppercase">Office of the Industrial Liaison Officer</p>
                    <p className="text-[10px] text-slate-500">P.O. Box 256, Takoradi, Ghana</p>
                  </div>

                  {/* Addressee & Ref */}
                  <div className="flex justify-between text-xs mb-4">
                    <div>
                      <p className="font-bold uppercase">{selectedLetter.letterAddressedTo}</p>
                      <p className="font-bold">{selectedLetter.companyName}</p>
                      <p className="font-bold uppercase">{selectedLetter.companyTown}</p>
                    </div>
                    <div className="text-right">
                      <p>Date: {new Date(selectedLetter.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p>Ref: TTU/IL/AL/{new Date(selectedLetter.submittedAt).getFullYear()}</p>
                    </div>
                  </div>

                  <p className="text-xs mb-3">Dear Sir/Madam,</p>

                  <p className="font-bold text-center underline uppercase text-xs mb-3">
                    Introductory Letter for Industrial Attachment - {selectedLetter.studentName}
                  </p>

                  <p className="text-xs text-justify mb-2">
                    We write to introduce the above-named student who is currently pursuing a{' '}
                    <span className="font-bold">{selectedLetter.department}</span> program at Takoradi Technical University.
                  </p>

                  <p className="text-xs text-justify mb-2">
                    As part of the academic curriculum for the award of a Bachelor of Technology degree, students are required to undergo a period of compulsory industrial training. This training aims to bridge the gap between academic theory and practical industrial application.
                  </p>

                  <p className="text-xs text-justify mb-3">
                    We would be most grateful if you could offer this student a placement in your organization for the attachment period. We are confident that they will prove to be diligent, respectful, and value-adding to your team.
                  </p>

                  <div className="pt-4 flex justify-between items-end text-xs">
                    <div>
                      <p>Yours faithfully,</p>
                      {selectedLetter.status === 'approved' ? (
                        <div className="py-2">
                          <p className="font-bold text-green-600 border border-green-600/30 rounded px-1.5 py-0.5 inline-block text-[10px] uppercase tracking-wider rotate-[-2deg]">APPROVED & SIGNED</p>
                        </div>
                      ) : (
                        <div className="h-8"></div>
                      )}
                      <p className="font-bold">Dr. Albert Ofori-Boateng</p>
                      <p className="text-[10px] text-slate-500">Head, Industrial Liaison Department</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 italic">Signature: {selectedLetter.studentSignature}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedLetter.status === 'pending' && (
                  <>
                    <button
                      className="flex-1 h-10 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                      onClick={() => { updateAttachmentLetterStatus(selectedLetter.id, 'approved'); setSelectedLetter(null); toast.success('Introductory Letter Approved!'); }}
                    >
                      ✓ Approve & Sign
                    </button>
                    <button
                      className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                      onClick={() => { updateAttachmentLetterStatus(selectedLetter.id, 'rejected'); setSelectedLetter(null); toast.error('Request Rejected'); }}
                    >
                      ✗ Reject Request
                    </button>
                  </>
                )}
                {selectedLetter.status === 'approved' && (
                  <button
                    className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition-colors flex items-center justify-center gap-1"
                    onClick={() => { window.print(); }}
                  >
                    <Download className="w-4 h-4" /> Print / Download PDF
                  </button>
                )}
                <button
                  className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setSelectedLetter(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Supervisor Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Assign Supervisor</DialogTitle>
            <DialogDescription>Select a supervisor for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSupervisor} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
                <SelectTrigger id="supervisor" className="h-10"><SelectValue placeholder="Select a supervisor" /></SelectTrigger>
                <SelectContent>
                  {supervisors.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.department} ({s.assignedStudents.length} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => { setIsAssignDialogOpen(false); setSelectedStudent(null); setSelectedSupervisorId(''); }}>
                Cancel
              </Button>
              <button type="submit" className="btn-primary flex-1 h-10 rounded-lg">Assign</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
