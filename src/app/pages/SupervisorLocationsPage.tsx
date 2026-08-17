import { useState } from 'react';
import { Link } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  MapPin, Building2, Plus, Edit2, Trash2, Users, CheckCircle2,
  AlertTriangle, ArrowLeft, Clock, Search, MapPinCheck,
  Compass, ShieldCheck, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { AssignedLocation, Student } from '../types';

export function SupervisorLocationsPage() {
  const { user } = useAuth();
  const {
    students, supervisors, locations, dailyCheckIns,
    addLocation, updateLocation, deleteLocation, assignStudentLocation
  } = useData();

  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AssignedLocation | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStudentToAssign, setSelectedStudentToAssign] = useState<Student | null>(null);
  const [targetLocationId, setTargetLocationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Location form state
  const [locName, setLocName] = useState('');
  const [locZone, setLocZone] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locDescription, setLocDescription] = useState('');
  const [locContactPerson, setLocContactPerson] = useState('');
  const [locContactPhone, setLocContactPhone] = useState('');

  const supervisorData = supervisors.find(s => s.email === user?.email);
  const assignedStudents = students.filter(st => supervisorData?.assignedStudents.includes(st.id) || user?.role === 'admin' || true);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setLocName('');
    setLocZone('Greater Accra Industrial Zone');
    setLocCity('Accra');
    setLocAddress('');
    setLocDescription('');
    setLocContactPerson('');
    setLocContactPhone('');
    setIsAddLocationOpen(true);
  };

  const handleOpenEdit = (loc: AssignedLocation) => {
    setEditingLocation(loc);
    setLocName(loc.name);
    setLocZone(loc.zone);
    setLocCity(loc.city);
    setLocAddress(loc.address);
    setLocDescription(loc.description || '');
    setLocContactPerson(loc.contactPerson || '');
    setLocContactPhone(loc.contactPhone || '');
    setIsAddLocationOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !locAddress) {
      toast.error('Location name and address are required');
      return;
    }

    if (editingLocation) {
      updateLocation(editingLocation.id, {
        name: locName,
        zone: locZone,
        city: locCity,
        address: locAddress,
        description: locDescription,
        contactPerson: locContactPerson,
        contactPhone: locContactPhone,
      });
    } else {
      addLocation({
        name: locName,
        zone: locZone,
        city: locCity,
        address: locAddress,
        description: locDescription,
        contactPerson: locContactPerson,
        contactPhone: locContactPhone,
      });
    }

    setIsAddLocationOpen(false);
  };

  const handleOpenAssign = (student: Student) => {
    setSelectedStudentToAssign(student);
    setTargetLocationId(student.assignedLocationId || (locations[0]?.id ?? ''));
    setIsAssignDialogOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentToAssign || !targetLocationId) return;
    assignStudentLocation(selectedStudentToAssign.id, targetLocationId);
    setIsAssignDialogOpen(false);
    setSelectedStudentToAssign(null);
  };

  const filteredLocations = locations.filter(
    l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
         l.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Location Allocation & Monitoring">
      <div className="max-w-7xl mx-auto space-y-8 p-2 sm:p-4">

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Link to="/supervisor">
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back to Supervisor Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Attachment Location Allocation & Daily Monitoring
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-bold">
                {locations.length} Active Locations
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Allocate students to accredited company locations and verify daily submitted check-in coordinates against assigned workplace locations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleOpenAdd} className="btn-primary gap-2 h-11 px-5 rounded-xl shadow-sm">
              <Plus className="w-4 h-4" /> Add New Location
            </Button>
          </div>
        </div>

        {/* Location Tabs: Allocation vs Daily Monitoring */}
        <Tabs defaultValue="allocation" className="space-y-6">
          <TabsList className="bg-secondary p-1 h-auto min-h-11 rounded-xl w-full flex overflow-x-auto justify-start flex-nowrap scrollbar-none gap-1">
            <TabsTrigger value="allocation" className="gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg shrink-0">
              <Building2 className="w-4 h-4" /> Location Allocation
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg shrink-0">
              <MapPinCheck className="w-4 h-4" /> Daily Monitoring ({dailyCheckIns.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg shrink-0">
              <Users className="w-4 h-4" /> Students by Location
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: LOCATION ALLOCATION & MANAGEMENT */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="allocation" className="space-y-6 mt-0">
            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-white dark:bg-card border border-border p-3 rounded-xl">
              <Search className="w-4 h-4 text-muted-foreground ml-2" />
              <input
                type="text"
                placeholder="Search locations by company name, city, or industrial zone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredLocations.map(loc => {
                const studentsAtLoc = students.filter(s => s.assignedLocationId === loc.id);
                return (
                  <div
                    key={loc.id}
                    className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground">{loc.name}</h3>
                            <p className="text-xs font-medium text-primary">{loc.zone} • {loc.city}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(loc)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                            title="Edit Location"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLocation(loc.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Location"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground font-medium">{loc.address}</span>
                        </p>
                        {loc.contactPerson && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <span>Contact: {loc.contactPerson} ({loc.contactPhone || 'N/A'})</span>
                          </p>
                        )}
                        {loc.description && (
                          <p className="pt-1 text-xs text-muted-foreground line-clamp-2">
                            {loc.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Assigned Students to this Location */}
                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          Assigned Students ({studentsAtLoc.length})
                        </span>
                      </div>

                      {studentsAtLoc.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No students allocated to this location yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {studentsAtLoc.map(st => (
                            <span
                              key={st.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-medium border border-border"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {st.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: DAILY LOCATION MONITORING */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="monitoring" className="space-y-6 mt-0">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Daily Submitted Location Verification
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Compare student daily GPS check-ins against their officially allocated workplace address.
                  </p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-3 py-1">
                  Live Attendance Feed
                </Badge>
              </div>

              {/* Monitoring Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-secondary/30">
                      <th className="py-3 px-4 font-bold">Student</th>
                      <th className="py-3 px-4 font-bold">Assigned Location</th>
                      <th className="py-3 px-4 font-bold">Daily Submitted Location</th>
                      <th className="py-3 px-4 font-bold">Check-In Time</th>
                      <th className="py-3 px-4 font-bold">Status Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {assignedStudents.map(student => {
                      const checkIn = dailyCheckIns.find(c => c.studentId === student.id);
                      const isAssigned = !!student.assignedLocationName;

                      return (
                        <tr key={student.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-foreground">{student.name}</div>
                            <div className="text-[11px] text-muted-foreground">{student.studentId} • Level {student.currentLevel || 1}00</div>
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            {isAssigned ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-foreground flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">{student.assignedLocationName}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">{student.assignedLocationAddress}</div>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-medium italic">Not Allocated</span>
                            )}
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            {checkIn ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-foreground flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{checkIn.address}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  GPS: {checkIn.latitude.toFixed(4)}, {checkIn.longitude.toFixed(4)}
                                  {checkIn.distanceFromAssignedKm !== undefined && (
                                    <span> • Variance: {checkIn.distanceFromAssignedKm} km</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> No Check-In Today
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            {checkIn ? (
                              <span className="font-medium text-foreground">
                                {new Date(checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            {checkIn ? (
                              checkIn.status === 'verified_on_site' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified On-Site
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Flagged Off-Site
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                                Pending Check-In
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 3: STUDENTS BY LOCATION */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="students" className="space-y-6 mt-0">
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Student Location Allocations</h3>
                  <p className="text-xs text-muted-foreground">Manage and update individual student location assignments.</p>
                </div>
              </div>

              <div className="grid gap-3">
                {assignedStudents.map(student => (
                  <div
                    key={student.id}
                    className="bg-secondary/40 border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId} • {student.department}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-primary font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {student.assignedLocationName || 'No Location Assigned'}
                          </span>
                          {student.assignedLocationCity && (
                            <span className="text-[11px] text-muted-foreground">({student.assignedLocationCity})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssign(student)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        {student.assignedLocationId ? 'Change Location' : 'Allocate Location'}
                      </Button>

                      <Link to={`/student/progress?studentId=${student.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Progress
                        </Button>
                      </Link>

                      <Link to={`/student/uploaded-reports?studentId=${student.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Level Reports
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ADD/EDIT LOCATION DIALOG */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Edit Attachment Location' : 'Add New Attachment Location'}</DialogTitle>
              <DialogDescription>
                Define accredited industrial premises, company details, and location coordinates.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveLocation} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="locName">Company / Facility Name</Label>
                <Input
                  id="locName"
                  placeholder="e.g. Tech Corp Industrial Hub"
                  value={locName}
                  onChange={e => setLocName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="locCity">City / Town</Label>
                  <Input
                    id="locCity"
                    placeholder="e.g. Takoradi or Accra"
                    value={locCity}
                    onChange={e => setLocCity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locZone">Industrial Zone / Region</Label>
                  <Input
                    id="locZone"
                    placeholder="e.g. Western Industrial Zone"
                    value={locZone}
                    onChange={e => setLocZone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="locAddress">Physical Street Address</Label>
                <Input
                  id="locAddress"
                  placeholder="e.g. 12 Independence Avenue, Commercial Area"
                  value={locAddress}
                  onChange={e => setLocAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="locContact">Industry Supervisor Name</Label>
                  <Input
                    id="locContact"
                    placeholder="e.g. Mr. Kwame Mensah"
                    value={locContactPerson}
                    onChange={e => setLocContactPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="locPhone">Contact Phone</Label>
                  <Input
                    id="locPhone"
                    placeholder="e.g. +233 24 412 3456"
                    value={locContactPhone}
                    onChange={e => setLocContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="locDesc">Description / Scope of Work</Label>
                <Textarea
                  id="locDesc"
                  rows={2}
                  placeholder="Specialization, facilities, safety protocols..."
                  value={locDescription}
                  onChange={e => setLocDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddLocationOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary flex-1">
                  {editingLocation ? 'Save Changes' : 'Create Location'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ASSIGN STUDENT LOCATION DIALOG */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Allocate Student Location</DialogTitle>
              <DialogDescription>
                Assign {selectedStudentToAssign?.name} to an accredited industrial location.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveAssignment} className="space-y-4 pt-2">
              <div className="p-3 bg-secondary rounded-xl text-xs space-y-1">
                <p className="font-bold text-foreground">{selectedStudentToAssign?.name}</p>
                <p className="text-muted-foreground">{selectedStudentToAssign?.studentId} • {selectedStudentToAssign?.department}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assignLocSelect">Select Assigned Location</Label>
                <select
                  id="assignLocSelect"
                  value={targetLocationId}
                  onChange={e => setTargetLocationId(e.target.value)}
                  className="w-full h-11 px-3 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>Select an attachment location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.city} ({loc.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary flex-1">
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
