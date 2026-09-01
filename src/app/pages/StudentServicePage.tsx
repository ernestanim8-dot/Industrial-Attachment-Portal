import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AttachmentLetterDocument } from '../components/AttachmentLetterDocument';
import {
  ArrowLeft, CheckCircle,
  FileSignature, Paperclip, Send, Settings, CreditCard,
  Clock, ShieldCheck, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { AttachmentLetterSubmission } from '../types';

type StudentServiceKey =
  | 'fee-payments'
  | 'attachment-letter'
  | 'assumption-form';

const serviceMeta: Record<StudentServiceKey, {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  'fee-payments': {
    title: 'Log Book Payment',
    description: 'Pay for your industrial attachment log book and check payment status.',
    icon: CreditCard,
  },
  'attachment-letter': {
    title: 'Attachment Letter',
    description: 'Request an official industrial attachment letter.',
    icon: Paperclip,
  },
  'assumption-form': {
    title: 'Assumption Form',
    description: 'Submit details confirming your assumption of attachment duty.',
    icon: FileSignature,
  },
};

// ── Assumption form field types ──────────────────────────────────────────────
interface AssumptionFields {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyZone: string;
  companyLocation: string;
  companyAddress: string;
  companySupervisor: string;
  letterAddressedTo: string;
  companyTown: string;
  dateOfCommencement: string;
  supervisorPhone: string;
  // Terms of Agreement step
  agreedToTerms: boolean;
  studentSignature: string;
}

interface AssumptionErrors {
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLocation?: string;
  companyAddress?: string;
  companySupervisor?: string;
  companyTown?: string;
  dateOfCommencement?: string;
  supervisorPhone?: string;
  studentSignature?: string;
}

const ZONES = [
  'Western Region(Takoradi Township)',
  'Greater Accra Region',
  'Ashanti Region',
  'Eastern Region',
  'Central Region',
  'Northern Region',
  'Upper East Region',
  'Upper West Region',
  'Volta Region',
  'Brong-Ahafo Region',
];

export function StudentServicePage() {
  const { serviceKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students, submitAssumptionForm, submitAttachmentLetter, attachmentLetterSubmissions } = useData();

  // ── Assumption form state ──────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<AssumptionFields>({
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyZone: ZONES[0],
    companyLocation: '',
    companyAddress: '',
    companySupervisor: '',
    letterAddressedTo: 'THE MANAGER',
    companyTown: '',
    dateOfCommencement: '',
    supervisorPhone: '',
    agreedToTerms: false,
    studentSignature: '',
  });
  const [errors, setErrors] = useState<AssumptionErrors>({});

  // ── Attachment Letter state ────────────────────────────────────────────────
  const [letterStep, setLetterStep] = useState<1 | 2>(1);
  const [letterFields, setLetterFields] = useState({
    companyName: '',
    companyTown: '',
    companyAddress: '',
    startDate: '',
    endDate: '',
    letterAddressedTo: 'THE MANAGER',
    agreedToTerms: false,
    studentSignature: '',
  });
  const [letterErrors, setLetterErrors] = useState<{
    companyName?: string;
    companyTown?: string;
    studentSignature?: string;
  }>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLetterSubmitting, setIsLetterSubmitting] = useState(false);
  const [submittedLetter, setSubmittedLetter] = useState<AttachmentLetterSubmission | null>(null);
  const [viewExistingLetter, setViewExistingLetter] = useState<AttachmentLetterSubmission | null>(null);
  const [logBookReceiptNo, setLogBookReceiptNo] = useState('');
  const [logBookPaymentSubmitted, setLogBookPaymentSubmitted] = useState(false);

  if (!serviceKey || !(serviceKey in serviceMeta)) {
    return <Navigate to="/student" replace />;
  }

  const key = serviceKey as StudentServiceKey;
  const service = serviceMeta[key];
  const Icon = service.icon;
  const studentData = students.find(s =>
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    s.id === user?.id ||
    (user?.name && s.name.toLowerCase() === user.name.toLowerCase())
  ) || students[0];

  // ── Find this student's existing attachment letter submission ──────────────
  const existingLetter = attachmentLetterSubmissions.find(l =>
    l.studentId === (studentData?.id || user?.id) ||
    l.studentName.toLowerCase() === (studentData?.name || user?.name || '').toLowerCase()
  );

  const validateLetterStep1 = (): boolean => {
    const errs: typeof letterErrors = {};
    if (!letterFields.companyName.trim()) errs.companyName = 'Please provide company name';
    if (!letterFields.companyTown.trim()) errs.companyTown = 'Company city/town is required';
    setLetterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLetterStep2 = (): boolean => {
    const errs: typeof letterErrors = {};
    if (!letterFields.studentSignature.trim()) errs.studentSignature = 'Signature is required to confirm request';
    setLetterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLetterNext = () => {
    if (validateLetterStep1()) setLetterStep(2);
  };

  const handleLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLetterStep2()) return;
    setIsLetterSubmitting(true);
    try {
      const payload = {
        studentId: studentData?.id || user?.id || '',
        studentName: studentData?.name || user?.name || 'Unknown',
        studentRegNo: studentData?.studentId || '',
        studentPhone: '',
        department: studentData?.department || user?.department || 'Unknown Department',
        academicLevel: studentData?.currentLevel || 1,
        companyName: letterFields.companyName,
        companyTown: letterFields.companyTown,
        companyAddress: letterFields.companyAddress,
        letterAddressedTo: letterFields.letterAddressedTo,
        startDate: letterFields.startDate,
        endDate: letterFields.endDate,
        studentSignature: letterFields.studentSignature,
      };
      await submitAttachmentLetter(payload);
      const newLetterRecord: AttachmentLetterSubmission = {
        ...payload,
        id: `letter${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        pdfGeneratedAt: new Date().toISOString(),
        refNumber: `TTU/IL/AL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`,
      };
      setSubmittedLetter(newLetterRecord);
      toast.success('Attachment Letter submitted electronically to the Industrial Liaison Office! Your PDF is ready.');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsLetterSubmitting(false);
    }
  };

  // Status badge helper
  const letterStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'pdf_generated':
        return (
          <Badge className="bg-blue-600 text-white gap-1 font-semibold text-xs">
            <ShieldCheck className="w-3 h-3" /> Submitted – PDF Ready
          </Badge>
        );
      case 'verified':
      case 'approved':
        return (
          <Badge className="bg-emerald-600 text-white gap-1 font-semibold text-xs">
            <CheckCircle className="w-3 h-3" /> Verified by Liaison Office
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-600 text-white gap-1 font-semibold text-xs">
            Revision Requested
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500 text-white gap-1 font-semibold text-xs">
            <Clock className="w-3 h-3" /> Pending Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Not Submitted
          </Badge>
        );
    }
  };

  const renderAttachmentLetterForm = () => {
    // ── Case 1: Just submitted — show the PDF letter view ────────────────────
    if (submittedLetter) {
      return (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Attachment Letter Submitted Successfully
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Submitted electronically to the Industrial Liaison Office. Your PDF is ready to download and print.
                </p>
                <p className="text-[11px] font-mono text-emerald-600 mt-1">
                  Ref: {submittedLetter.refNumber}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSubmittedLetter(null);
                setLetterStep(1);
                setLetterFields({
                  companyName: '', companyTown: '', companyAddress: '',
                  startDate: '', endDate: '', letterAddressedTo: 'THE MANAGER',
                  agreedToTerms: false, studentSignature: '',
                });
              }}
              className="text-xs shrink-0"
            >
              Submit Another Letter
            </Button>
          </div>
          <AttachmentLetterDocument submission={submittedLetter} showActions={true} />
        </div>
      );
    }

    // ── Case 2: Student has an existing submission — show status card + view PDF ─
    if (existingLetter && !submittedLetter) {
      return (
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white dark:bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Attachment Letter Submission</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track your submission status and download your official PDF copy.
                </p>
              </div>
              {letterStatusBadge(existingLetter.status)}
            </div>

            {/* Status Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'not_submitted', label: 'Not Submitted', icon: '○' },
                { key: 'submitted',     label: 'Submitted',     icon: '⬤' },
                { key: 'pdf_generated', label: 'PDF Generated', icon: '⬤' },
                { key: 'verified',      label: 'Verified',      icon: '✓' },
              ].map((s, i) => {
                const statuses = ['not_submitted', 'submitted', 'pdf_generated', 'verified', 'approved'];
                const currentIdx = statuses.indexOf(existingLetter.status);
                const stepIdx = statuses.indexOf(s.key);
                const isActive = currentIdx >= stepIdx;
                const isCurrent = s.key === existingLetter.status || (s.key === 'pdf_generated' && existingLetter.status === 'submitted' && existingLetter.pdfGeneratedAt);

                return (
                  <div
                    key={s.key}
                    className={`flex flex-col items-center text-center p-2.5 rounded-lg border text-xs gap-1.5 ${
                      isActive
                        ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                        : 'bg-secondary/30 border-border text-muted-foreground'
                    }`}
                  >
                    <span className="text-base leading-none">{s.icon}</span>
                    <span className="leading-tight">{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-secondary/40 rounded-lg p-3">
                <span className="text-muted-foreground font-medium block">Company</span>
                <span className="font-bold text-foreground">{existingLetter.companyName}</span>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <span className="text-muted-foreground font-medium block">Town / City</span>
                <span className="font-bold text-foreground">{existingLetter.companyTown}</span>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3">
                <span className="text-muted-foreground font-medium block">Submitted On</span>
                <span className="font-bold text-foreground">{new Date(existingLetter.submittedAt).toLocaleDateString()}</span>
              </div>
              {existingLetter.refNumber && (
                <div className="bg-secondary/40 rounded-lg p-3 col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground font-medium block">Reference No.</span>
                  <span className="font-bold font-mono text-primary">{existingLetter.refNumber}</span>
                </div>
              )}
              {existingLetter.verifiedAt && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium block">Verified On</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">{new Date(existingLetter.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                onClick={() => setViewExistingLetter(existingLetter)}
                className="btn-primary gap-2 text-xs h-9 rounded-lg font-semibold"
              >
                <Eye className="w-3.5 h-3.5" /> View & Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setLetterFields({
                    companyName: existingLetter.companyName || '',
                    companyTown: existingLetter.companyTown || '',
                    companyAddress: existingLetter.companyAddress || '',
                    startDate: existingLetter.startDate || '',
                    endDate: existingLetter.endDate || '',
                    letterAddressedTo: existingLetter.letterAddressedTo || 'THE MANAGER',
                    agreedToTerms: false,
                    studentSignature: '',
                  });
                  // Clear existing to show form for re-submission
                  setSubmittedLetter(null);
                }}
                className="gap-2 text-xs h-9 rounded-lg"
              >
                <Send className="w-3.5 h-3.5" /> Submit New Letter
              </Button>
            </div>
          </div>

          {/* Full Letter PDF View Modal */}
          <Dialog open={!!viewExistingLetter} onOpenChange={open => { if (!open) setViewExistingLetter(null); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-bold">
                  <Paperclip className="w-5 h-5 text-primary" /> Official Attachment Letter
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Ref: {viewExistingLetter?.refNumber} • Submitted {viewExistingLetter && new Date(viewExistingLetter.submittedAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              {viewExistingLetter && (
                <AttachmentLetterDocument submission={viewExistingLetter} showActions={true} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    // ── Case 3: No existing submission — show the multi-step form ────────────
    return (
    <div className="card-clean rounded-xl overflow-hidden shadow-sm border border-border">
      {/* Title & Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Industrial Liaison Attachment</h2>
        <button
          type="button"
          onClick={() => {
            if (validateLetterStep1()) {
              setIsPreviewOpen(true);
            } else {
              toast.error('Please fill out Company Name and Town/City in Step 1 first.');
            }
          }}
          className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
        >
          <Eye className="w-4 h-4" /> Preview Letter
        </button>
      </div>

      {/* Step Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch relative border-b border-border overflow-x-auto">
        {/* Step 1 tab */}
        <button
          type="button"
          onClick={() => setLetterStep(1)}
          className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors ${letterStep === 1
            ? 'bg-red-600 text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${letterStep === 1 ? 'border-white text-white' : 'border-muted-foreground text-muted-foreground'
            }`}>1</span>
          Company Information
        </button>

        {/* Step 2 tab */}
        <button
          type="button"
          onClick={() => { if (validateLetterStep1()) setLetterStep(2); }}
          className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors ${letterStep === 2
            ? 'bg-blue-500 text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${letterStep === 2 ? 'border-white text-white' : 'border-muted-foreground text-muted-foreground'
            }`}>2</span>
          Terms of Agreement
        </button>

        <div className="flex-1 bg-muted flex items-center justify-end px-3 sm:px-4">
          <button
            type="button"
            title="Settings"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {letterStep === 1 ? (
        <div>
          {/* Step 1 Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              {/* Company Name */}
              <div className="space-y-1">
                <Label htmlFor="al-companyName" className="text-sm font-medium text-muted-foreground">Company Name :</Label>
                <Input
                  id="al-companyName"
                  value={letterFields.companyName}
                  onChange={e => {
                    setLetterFields(prev => ({ ...prev, companyName: e.target.value }));
                    setLetterErrors(prev => ({ ...prev, companyName: undefined }));
                  }}
                  className={`h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base ${letterErrors.companyName ? 'border-red-500' : ''
                    }`}
                  placeholder="Enter Company Name"
                />
                {letterErrors.companyName && (
                  <p className="text-xs text-red-500">{letterErrors.companyName}</p>
                )}
              </div>

              {/* Town/City */}
              <div className="space-y-1">
                <Label htmlFor="al-companyTown" className="text-sm font-medium text-muted-foreground">Town/City :</Label>
                <Input
                  id="al-companyTown"
                  value={letterFields.companyTown}
                  onChange={e => {
                    setLetterFields(prev => ({ ...prev, companyTown: e.target.value }));
                    setLetterErrors(prev => ({ ...prev, companyTown: undefined }));
                  }}
                  className={`h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base ${letterErrors.companyTown ? 'border-red-500' : ''
                    }`}
                  placeholder="Enter Town/City"
                />
                {letterErrors.companyTown && (
                  <p className="text-xs text-red-500">{letterErrors.companyTown}</p>
                )}
              </div>

              {/* Company Address */}
              <div className="space-y-1">
                <Label htmlFor="al-companyAddress" className="text-sm font-medium text-muted-foreground">Company Address :</Label>
                <Input
                  id="al-companyAddress"
                  value={letterFields.companyAddress}
                  onChange={e => setLetterFields(prev => ({ ...prev, companyAddress: e.target.value }))}
                  className="h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base"
                  placeholder="Enter company full address (optional)"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Letter Addressed To */}
              <div className="space-y-1">
                <Label htmlFor="al-letterAddressedTo" className="text-sm font-medium text-muted-foreground">Letter Addressed To :</Label>
                <select
                  id="al-letterAddressedTo"
                  title="Letter Addressed To"
                  aria-label="Letter Addressed To"
                  value={letterFields.letterAddressedTo}
                  onChange={e => setLetterFields(prev => ({ ...prev, letterAddressedTo: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="THE MANAGER">THE MANAGER</option>
                  <option value="THE GENERAL MANAGER">THE GENERAL MANAGER</option>
                  <option value="THE HUMAN RESOURCE MANAGER">THE HUMAN RESOURCE MANAGER</option>
                  <option value="THE MANAGING DIRECTOR">THE MANAGING DIRECTOR</option>
                  <option value="THE ADMINISTRATOR">THE ADMINISTRATOR</option>
                  <option value="THE HEAD OF RECRUITMENT">THE HEAD OF RECRUITMENT</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <Label htmlFor="al-startDate" className="text-sm font-medium text-muted-foreground">Attachment Start Date :</Label>
                <Input
                  id="al-startDate"
                  type="date"
                  value={letterFields.startDate}
                  onChange={e => setLetterFields(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <Label htmlFor="al-endDate" className="text-sm font-medium text-muted-foreground">Attachment End Date :</Label>
                <Input
                  id="al-endDate"
                  type="date"
                  value={letterFields.endDate}
                  onChange={e => setLetterFields(prev => ({ ...prev, endDate: e.target.value }))}
                  className="h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base"
                />
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="bg-[#f0f0f0] p-4 flex justify-end">
            <button
              type="button"
              onClick={handleLetterNext}
              className="bg-transparent hover:bg-muted text-foreground font-semibold py-2 px-4 rounded flex items-center gap-1 text-sm border border-transparent transition-colors uppercase tracking-wider"
            >
              Next <span className="font-bold">&gt;</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLetterSubmit} className="p-6 space-y-5">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3 leading-relaxed max-h-64 overflow-y-auto">
            <p className="font-semibold text-foreground text-base">Industrial Liaison – Request for Attachment Letter</p>
            <p>
              I, the undersigned student, hereby request an official introductory letter for industrial attachment
              addressed to the organization specified in Step 1.
            </p>
            <p>
              I understand that this letter is a formal university document intended solely for securing an industrial attachment
              placement. I promise to represent Takoradi Technical University with integrity, professionalism, and high academic standards
              at the host organization.
            </p>
            <p>
              I agree to update the Industrial Liaison Office immediately upon acceptance/placement, or should there be any change in my attachment details.
            </p>
          </div>

          {/* Agree checkbox */}
          <div className="flex items-start gap-3">
            <input
              id="al-agreedToTerms"
              type="checkbox"
              title="I agree to terms and conditions"
              aria-label="I agree to terms and conditions"
              checked={letterFields.agreedToTerms}
              onChange={e => setLetterFields(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--primary)] cursor-pointer"
            />
            <Label htmlFor="al-agreedToTerms" className="leading-snug cursor-pointer select-none">
              I have read, understood, and agree to the conditions of requesting an Introductory Attachment Letter.
            </Label>
          </div>

          {/* Student signature */}
          <div className="space-y-1.5">
            <Label htmlFor="al-studentSignature">Student Signature (type full name) :</Label>
            <Input
              id="al-studentSignature"
              placeholder="Enter your full name as signature"
              value={letterFields.studentSignature}
              onChange={e => {
                setLetterFields(prev => ({ ...prev, studentSignature: e.target.value }));
                setLetterErrors(prev => ({ ...prev, studentSignature: undefined }));
              }}
              className={letterErrors.studentSignature ? 'border-red-500' : ''}
            />
            {letterErrors.studentSignature && (
              <p className="text-xs text-red-500">{letterErrors.studentSignature}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLetterStep(1)}
              className="h-10 rounded-lg px-5 border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={!letterFields.agreedToTerms || isLetterSubmitting}
              className="btn-primary h-10 rounded-lg px-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {isLetterSubmitting ? 'Submitting...' : 'Submit to Liaison Office'}
            </button>
          </div>
        </form>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white border border-border shadow-lg rounded-xl overflow-hidden p-0">
          <DialogHeader className="p-5 border-b border-border bg-slate-50">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />
              Introductory Letter Preview
            </DialogTitle>
            <DialogDescription>
              This is a draft of the official introductory letter that will be generated upon approval.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 max-h-[60vh] overflow-y-auto bg-white select-none">
            {/* TTU Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-wide uppercase">Takoradi Technical University</h2>
              <p className="text-sm font-semibold text-slate-700 tracking-wider uppercase">Office of the Industrial Liaison Officer</p>
              <p className="text-xs text-slate-500 mt-1">P.O. Box 256, Takoradi, Ghana | Tel: +233 (0) 312 022 983</p>
            </div>

            {/* Date and Address */}
            <div className="space-y-4 text-sm text-slate-800">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold uppercase">{letterFields.letterAddressedTo}</p>
                  <p className="font-semibold">{letterFields.companyName}</p>
                  <p className="font-semibold uppercase">{letterFields.companyTown}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="font-medium">Our Ref: TTU/IL/AL/{new Date().getFullYear()}</p>
                </div>
              </div>

              <p className="pt-4">Dear Sir/Madam,</p>

              {/* Title */}
              <p className="font-bold text-center underline uppercase tracking-wide py-2">
                Introductory Letter for Industrial Attachment - {user?.name || studentData?.name || 'STUDENT'}
              </p>

              {/* Body */}
              <p className="leading-relaxed text-justify text-slate-700">
                We write to introduce the above-named student who is currently pursuing a{' '}
                <span className="font-bold text-slate-900">{user?.department || studentData?.department || 'your department'}</span>{' '}
                program at Takoradi Technical University.
              </p>

              <p className="leading-relaxed text-justify text-slate-700">
                As part of the academic curriculum for the award of a Bachelor of Technology degree, students are required to undergo a period of compulsory industrial training. This training aims to bridge the gap between academic theory and practical industrial application.
              </p>

              <p className="leading-relaxed text-justify text-slate-700">
                We would be most grateful if you could offer this student a placement in your organization for the attachment period. We are confident that they will prove to be diligent, respectful, and value-adding to your team.
              </p>

              <p className="leading-relaxed text-justify text-slate-700">
                Thank you for your partnership in training the next generation of industry leaders.
              </p>

              {/* Sign-off */}
              <div className="pt-8 space-y-1">
                <p>Yours faithfully,</p>
                <div className="h-10 flex items-end">
                  <p className="font-bold text-slate-400 italic">Signature & Stamp</p>
                </div>
                <p className="font-bold text-slate-900">Dr. Albert Ofori-Boateng</p>
                <p className="text-xs text-slate-500 uppercase">Head, Industrial Liaison Department</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    );
  };


    setFields(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validatePhone = (phone: string) =>
    /^\d{10}$/.test(phone.replace(/\s/g, ''));

  const validateStep1 = (): boolean => {
    const errs: AssumptionErrors = {};
    if (!fields.companyName.trim()) errs.companyName = 'Please provide company name';
    if (!validatePhone(fields.companyPhone)) errs.companyPhone = 'Please enter a valid phone number of 10 digits';
    if (!fields.companyLocation.trim()) errs.companyLocation = 'Location is required';
    if (!fields.companyAddress.trim()) errs.companyAddress = 'Home Address is required';
    if (!fields.companySupervisor.trim()) errs.companySupervisor = 'Company supervisor is required';
    if (!fields.companyTown.trim()) errs.companyTown = 'Company city is required';
    if (!fields.dateOfCommencement) errs.dateOfCommencement = 'Date commencement is required';
    if (!validatePhone(fields.supervisorPhone)) errs.supervisorPhone = 'Please enter a valid phone number of 10 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: AssumptionErrors = {};
    if (!fields.studentSignature.trim()) errs.studentSignature = 'Signature is required to confirm agreement';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      submitAssumptionForm({
        studentId: user?.id || studentData?.id || '',
        studentName: user?.name || studentData?.name || 'Unknown',
        companyName: fields.companyName,
        companyPhone: fields.companyPhone,
        companyEmail: fields.companyEmail,
        companyZone: fields.companyZone,

const serviceMeta: Record<StudentServiceKey, {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  'fee-payments': {
    title: 'Log Book Payment',
    description: 'Pay for your industrial attachment log book and check payment status.',
    icon: CreditCard,
  },
  'attachment-letter': {
    title: 'Attachment Letter',
    description: 'Request an official industrial attachment letter.',
    icon: Paperclip,
  },
  'assumption-form': {
    title: 'Assumption Form',
    description: 'Submit details confirming your assumption of attachment duty.',
    icon: FileSignature,
  },
};

// â”€â”€ Assumption form field types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AssumptionFields {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyZone: string;
  companyLocation: string;
  companyAddress: string;
  companySupervisor: string;
  letterAddressedTo: string;
  companyTown: string;
  dateOfCommencement: string;
  supervisorPhone: string;
  // Terms of Agreement step
  agreedToTerms: boolean;
  studentSignature: string;
}

interface AssumptionErrors {
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLocation?: string;
  companyAddress?: string;
  companySupervisor?: string;
  companyTown?: string;
  dateOfCommencement?: string;
  supervisorPhone?: string;
  studentSignature?: string;
}

const ZONES = [
  'Western Region(Takoradi Township)',
  'Greater Accra Region',
  'Ashanti Region',
  'Eastern Region',
  'Central Region',
  'Northern Region',
  'Upper East Region',
  'Upper West Region',
  'Volta Region',
  'Brong-Ahafo Region',
];

export function StudentServicePage() {
  const { serviceKey } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students, submitAssumptionForm, submitAttachmentLetter } = useData();

  // â”€â”€ Assumption form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<AssumptionFields>({
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyZone: ZONES[0],
    companyLocation: '',
    companyAddress: '',
    companySupervisor: '',
    letterAddressedTo: 'THE MANAGER',
    companyTown: '',
    dateOfCommencement: '',
    supervisorPhone: '',
    agreedToTerms: false,
    studentSignature: '',
  });
  const [errors, setErrors] = useState<AssumptionErrors>({});

  // â”€â”€ Attachment Letter state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [letterStep, setLetterStep] = useState<1 | 2>(1);
  const [letterFields, setLetterFields] = useState({
    companyName: '',
    companyTown: '',
    letterAddressedTo: 'THE MANAGER',
    agreedToTerms: false,
    studentSignature: '',
  });
  const [letterErrors, setLetterErrors] = useState<{
    companyName?: string;
    companyTown?: string;
    studentSignature?: string;
  }>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [logBookReceiptNo, setLogBookReceiptNo] = useState('');

  const [logBookPaymentSubmitted, setLogBookPaymentSubmitted] = useState(false);

  if (!serviceKey || !(serviceKey in serviceMeta)) {
    return <Navigate to="/student" replace />;
  }

  const key = serviceKey as StudentServiceKey;
  const service = serviceMeta[key];
  const Icon = service.icon;
  const studentData = students.find(s =>
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    s.id === user?.id ||
    (user?.name && s.name.toLowerCase() === user.name.toLowerCase())
  ) || students[0];

  const validateLetterStep1 = (): boolean => {
    const errs: typeof letterErrors = {};
    if (!letterFields.companyName.trim()) errs.companyName = 'Please provide company name';
    if (!letterFields.companyTown.trim()) errs.companyTown = 'Company city/town is required';
    setLetterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLetterStep2 = (): boolean => {
    const errs: typeof letterErrors = {};
    if (!letterFields.studentSignature.trim()) errs.studentSignature = 'Signature is required to confirm request';
    setLetterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLetterNext = () => {
    if (validateLetterStep1()) setLetterStep(2);
  };

  const handleLetterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLetterStep2()) {
      submitAttachmentLetter({
        studentId: user?.id || studentData?.id || '',
        studentName: user?.name || studentData?.name || 'Unknown',
        department: user?.department || studentData?.department || 'Unknown Department',
        companyName: letterFields.companyName,
        companyTown: letterFields.companyTown,
        letterAddressedTo: letterFields.letterAddressedTo,
        studentSignature: letterFields.studentSignature,
      });
      toast.success('Introductory letter request submitted successfully!');
      navigate('/student');
    }
  };

  const renderAttachmentLetterForm = () => (
    <div className="card-clean rounded-xl overflow-hidden shadow-sm border border-border">
      {/* Title & Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Industrial Liaison Attachment</h2>
        <button
          type="button"
          onClick={() => {
            if (validateLetterStep1()) {
              setIsPreviewOpen(true);
            } else {
              toast.error('Please fill out Company Name and Town/City in Step 1 first.');
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2 rounded shadow-sm transition-colors"
        >
          Are you done? Click to Preview Form
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch relative border-b border-border overflow-x-auto">
        {/* Step 1 tab */}
        <button
          type="button"
          onClick={() => setLetterStep(1)}
          className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors ${letterStep === 1
            ? 'bg-red-600 text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${letterStep === 1 ? 'border-white text-white' : 'border-muted-foreground text-muted-foreground'
            }`}>1</span>
          Company Information
        </button>

        {/* Step 2 tab */}
        <button
          type="button"
          onClick={() => { if (validateLetterStep1()) setLetterStep(2); }}
          className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors ${letterStep === 2
            ? 'bg-blue-500 text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${letterStep === 2 ? 'border-white text-white' : 'border-muted-foreground text-muted-foreground'
            }`}>2</span>
          Terms of Agreement
        </button>

        <div className="flex-1 bg-muted flex items-center justify-end px-3 sm:px-4">
          <button
            type="button"
            title="Settings"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {letterStep === 1 ? (
        <div>
          {/* Step 1 Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              {/* Company Name */}
              <div className="space-y-1">
                <Label htmlFor="al-companyName" className="text-sm font-medium text-muted-foreground">Company Name :</Label>
                <Input
                  id="al-companyName"
                  value={letterFields.companyName}
                  onChange={e => {
                    setLetterFields(prev => ({ ...prev, companyName: e.target.value }));
                    setLetterErrors(prev => ({ ...prev, companyName: undefined }));
                  }}
                  className={`h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base ${letterErrors.companyName ? 'border-red-500' : ''
                    }`}
                  placeholder="Enter Company Name"
                />
                {letterErrors.companyName && (
                  <p className="text-xs text-red-500">{letterErrors.companyName}</p>
                )}
              </div>

              {/* Town/City */}
              <div className="space-y-1">
                <Label htmlFor="al-companyTown" className="text-sm font-medium text-muted-foreground">Town/City :</Label>
                <Input
                  id="al-companyTown"
                  value={letterFields.companyTown}
                  onChange={e => {
                    setLetterFields(prev => ({ ...prev, companyTown: e.target.value }));
                    setLetterErrors(prev => ({ ...prev, companyTown: undefined }));
                  }}
                  className={`h-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-base ${letterErrors.companyTown ? 'border-red-500' : ''
                    }`}
                  placeholder="Enter Town/City"
                />
                {letterErrors.companyTown && (
                  <p className="text-xs text-red-500">{letterErrors.companyTown}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {/* Letter Addressed To */}
              <div className="space-y-1">
                <Label htmlFor="al-letterAddressedTo" className="text-sm font-medium text-muted-foreground">Letter Addressed To :</Label>
                <select
                  id="al-letterAddressedTo"
                  title="Letter Addressed To"
                  aria-label="Letter Addressed To"
                  value={letterFields.letterAddressedTo}
                  onChange={e => setLetterFields(prev => ({ ...prev, letterAddressedTo: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="THE MANAGER">THE MANAGER</option>
                  <option value="THE GENERAL MANAGER">THE GENERAL MANAGER</option>
                  <option value="THE HUMAN RESOURCE MANAGER">THE HUMAN RESOURCE MANAGER</option>
                  <option value="THE MANAGING DIRECTOR">THE MANAGING DIRECTOR</option>
                  <option value="THE ADMINISTRATOR">THE ADMINISTRATOR</option>
                  <option value="THE HEAD OF RECRUITMENT">THE HEAD OF RECRUITMENT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Next Button in a gray bar */}
          <div className="bg-[#f0f0f0] p-4 flex justify-end">
            <button
              type="button"
              onClick={handleLetterNext}
              className="bg-transparent hover:bg-muted text-foreground font-semibold py-2 px-4 rounded flex items-center gap-1 text-sm border border-transparent transition-colors uppercase tracking-wider"
            >
              Next <span className="font-bold">&gt;</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLetterSubmit} className="p-6 space-y-5">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3 leading-relaxed max-h-64 overflow-y-auto">
            <p className="font-semibold text-foreground text-base">Industrial Liaison â€” Request for Attachment Letter</p>
            <p>
              I, the undersigned student, hereby request an official introductory letter for industrial attachment
              addressed to the organization specified in Step 1.
            </p>
            <p>
              I understand that this letter is a formal university document intended solely for securing an industrial attachment
              placement. I promise to represent Takoradi Technical University with integrity, professionalism, and high academic standards
              at the host organization.
            </p>
            <p>
              I agree to update the Industrial Liaison Office immediately upon acceptance/placement, or should there be any change in my attachment details.
            </p>
          </div>

          {/* Agree checkbox */}
          <div className="flex items-start gap-3">
            <input
              id="al-agreedToTerms"
              type="checkbox"
              title="I agree to terms and conditions"
              aria-label="I agree to terms and conditions"
              checked={letterFields.agreedToTerms}
              onChange={e => setLetterFields(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--primary)] cursor-pointer"
            />
            <Label htmlFor="al-agreedToTerms" className="leading-snug cursor-pointer select-none">
              I have read, understood, and agree to the conditions of requesting an Introductory Attachment Letter.
            </Label>
          </div>

          {/* Student signature */}
          <div className="space-y-1.5">
            <Label htmlFor="al-studentSignature">Student Signature (type full name) :</Label>
            <Input
              id="al-studentSignature"
              placeholder="Enter your full name as signature"
              value={letterFields.studentSignature}
              onChange={e => {
                setLetterFields(prev => ({ ...prev, studentSignature: e.target.value }));
                setLetterErrors(prev => ({ ...prev, studentSignature: undefined }));
              }}
              className={letterErrors.studentSignature ? 'border-red-500' : ''}
            />
            {letterErrors.studentSignature && (
              <p className="text-xs text-red-500">{letterErrors.studentSignature}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLetterStep(1)}
              className="h-10 rounded-lg px-5 border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              â† Back
            </button>
            <button
              type="submit"
              disabled={!letterFields.agreedToTerms}
              className="btn-primary h-10 rounded-lg px-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Request
            </button>
          </div>
        </form>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white border border-border shadow-lg rounded-xl overflow-hidden p-0">
          <DialogHeader className="p-5 border-b border-border bg-slate-50">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />
              Introductory Letter Preview
            </DialogTitle>
            <DialogDescription>
              This is a draft of the official introductory letter that will be generated upon approval.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 max-h-[60vh] overflow-y-auto bg-white select-none">
            {/* TTU Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-wide uppercase">Takoradi Technical University</h2>
              <p className="text-sm font-semibold text-slate-700 tracking-wider uppercase">Office of the Industrial Liaison Officer</p>
              <p className="text-xs text-slate-500 mt-1">P.O. Box 256, Takoradi, Ghana | Tel: +233 (0) 312 022 983</p>
            </div>

            {/* Date and Address */}
            <div className="space-y-4 text-sm text-slate-800">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold uppercase">{letterFields.letterAddressedTo}</p>
                  <p className="font-semibold">{letterFields.companyName}</p>
                  <p className="font-semibold uppercase">{letterFields.companyTown}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="font-medium">Our Ref: TTU/IL/AL/{new Date().getFullYear()}</p>
                </div>
              </div>

              <p className="pt-4">Dear Sir/Madam,</p>

              {/* Title */}
              <p className="font-bold text-center underline uppercase tracking-wide py-2">
                Introductory Letter for Industrial Attachment - {user?.name || studentData?.name || 'STUDENT'}
              </p>

              {/* Body */}
              <p className="leading-relaxed text-justify text-slate-700">
                We write to introduce the above-named student who is currently pursuing a{' '}
                <span className="font-bold text-slate-900">{user?.department || studentData?.department || 'your department'}</span>{' '}
                program at Takoradi Technical University.
              </p>

              <p className="leading-relaxed text-justify text-slate-700">
                As part of the academic curriculum for the award of a Bachelor of Technology degree, students are required to undergo a period of compulsory industrial training. This training aims to bridge the gap between academic theory and practical industrial application.
              </p>

              <p className="leading-relaxed text-justify text-slate-700">
                We would be most grateful if you could offer this student a placement in your organization for the attachment period. We are confident that they will prove to be diligent, respectful, and value-adding to your team.
              </p>

              <p className="leading-relaxed text-justify text-slate-700">
                Thank you for your partnership in training the next generation of industry leaders.
              </p>

              {/* Sign-off */}
              <div className="pt-8 space-y-1">
                <p>Yours faithfully,</p>
                <div className="h-10 flex items-end">
                  <p className="font-bold text-slate-400 italic">Signature & Stamp</p>
                </div>
                <p className="font-bold text-slate-900">Dr. Albert Ofori-Boateng</p>
                <p className="text-xs text-slate-500 uppercase">Head, Industrial Liaison Department</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // â”€â”€ Assumption form helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  

  const validatePhone = (phone: string) =>
    /^\d{10}$/.test(phone.replace(/\s/g, ''));

  const validateStep1 = (): boolean => {
    const errs: AssumptionErrors = {};
    if (!fields.companyName.trim()) errs.companyName = 'Please provide company name';
    if (!validatePhone(fields.companyPhone)) errs.companyPhone = 'Please enter a valid phone number of 10 digits';
    if (!fields.companyLocation.trim()) errs.companyLocation = 'Location is required';
    if (!fields.companyAddress.trim()) errs.companyAddress = 'Home Address is required';
    if (!fields.companySupervisor.trim()) errs.companySupervisor = 'Company supervisor is required';
    if (!fields.companyTown.trim()) errs.companyTown = 'Company city is required';
    if (!fields.dateOfCommencement) errs.dateOfCommencement = 'Date commencement is required';
    if (!validatePhone(fields.supervisorPhone)) errs.supervisorPhone = 'Please enter a valid phone number of 10 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: AssumptionErrors = {};
    if (!fields.studentSignature.trim()) errs.studentSignature = 'Signature is required to confirm agreement';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      submitAssumptionForm({
        studentId: user?.id || studentData?.id || '',
        studentName: user?.name || studentData?.name || 'Unknown',
        companyName: fields.companyName,
        companyPhone: fields.companyPhone,
        companyEmail: fields.companyEmail,
        companyZone: fields.companyZone,
        companyLocation: fields.companyLocation,
        companyAddress: fields.companyAddress,
        companySupervisor: fields.companySupervisor,
        letterAddressedTo: fields.letterAddressedTo,
        companyTown: fields.companyTown,
        dateOfCommencement: fields.dateOfCommencement,
        supervisorPhone: fields.supervisorPhone,
        studentSignature: fields.studentSignature,
      });
      toast.success('Assumption of duty form submitted to the liaison office!');
      navigate('/student');
    }
  };

  const renderAssumptionForm = () => (
    <div className="card-clean rounded-xl overflow-hidden shadow-sm border border-border">

      {/* â”€â”€ Tab header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch relative overflow-x-auto border-b border-border">
        {/* Step 1 tab */}
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors ${step === 1
            ? 'bg-red-600 text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${step === 1 ? 'border-white text-white' : 'border-muted-foreground text-muted-foreground'
            }`}>1</span>
          Company Information
        </button>

        {/* Step 2 tab */}
        <button
          type="button"
          onClick={() => { if (validateStep1()) setStep(2); }}
          className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors ${step === 2
            ? 'bg-blue-500 text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${step === 2 ? 'border-white text-white' : 'border-muted-foreground text-muted-foreground'
            }`}>2</span>
          Terms of Agreement
        </button>

        {/* Spacer + gear icon */}
        <div className="flex-1 bg-muted flex items-center justify-end px-3 sm:px-4">
          <button
            type="button"
            title="Settings"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* â”€â”€ Step 1: Company Information â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {step === 1 && (
        <div className="p-6 space-y-5">
          {/* Row 1 â€” 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            {/* Company Name */}
            <div className="space-y-1">
              <Label htmlFor="af-companyName">Company Name :</Label>
              <Input
                id="af-companyName"
                value={fields.companyName}
                onChange={e => setField('companyName', e.target.value)}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* Company Phone No */}
            <div className="space-y-1">
              <Label htmlFor="af-companyPhone">Company Phone No :</Label>
              <Input
                id="af-companyPhone"
                value={fields.companyPhone}
                onChange={e => setField('companyPhone', e.target.value)}
                placeholder="0XXXXXXXXX"
                className={errors.companyPhone ? 'border-red-500' : ''}
              />
              {errors.companyPhone && (
                <p className="text-xs text-red-500">{errors.companyPhone}</p>
              )}
            </div>

            {/* Company Email Address */}
            <div className="space-y-1">
              <Label htmlFor="af-companyEmail">Company Email Address :</Label>
              <Input
                id="af-companyEmail"
                type="email"
                value={fields.companyEmail}
                onChange={e => setField('companyEmail', e.target.value)}
              />
            </div>

            {/* Company Zone */}
            <div className="space-y-1">
              <Label htmlFor="af-companyZone">Company Zone :</Label>
              <select
                id="af-companyZone"
                title="Company Zone"
                aria-label="Company Zone"
                value={fields.companyZone}
                onChange={e => setField('companyZone', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 â€” 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            {/* Company Exact Location */}
            <div className="space-y-1">
              <Label htmlFor="af-companyLocation">Company Exact Location :</Label>
              <Input
                id="af-companyLocation"
                value={fields.companyLocation}
                onChange={e => setField('companyLocation', e.target.value)}
                className={errors.companyLocation ? 'border-red-500' : ''}
              />
              {errors.companyLocation && (
                <p className="text-xs text-red-500">{errors.companyLocation}</p>
              )}
            </div>

            {/* Company Address */}
            <div className="space-y-1">
              <Label htmlFor="af-companyAddress">Company Address :</Label>
              <Input
                id="af-companyAddress"
                value={fields.companyAddress}
                onChange={e => setField('companyAddress', e.target.value)}
                className={errors.companyAddress ? 'border-red-500' : ''}
              />
              {errors.companyAddress && (
                <p className="text-xs text-red-500">{errors.companyAddress}</p>
              )}
            </div>

            {/* Company Supervisor */}
            <div className="space-y-1">
              <Label htmlFor="af-companySupervisor">Company Supervisor :</Label>
              <Input
                id="af-companySupervisor"
                value={fields.companySupervisor}
                onChange={e => setField('companySupervisor', e.target.value)}
                className={errors.companySupervisor ? 'border-red-500' : ''}
              />
              {errors.companySupervisor && (
                <p className="text-xs text-red-500">{errors.companySupervisor}</p>
              )}
            </div>

            {/* Letter Addressed To */}
            <div className="space-y-1">
              <Label htmlFor="af-letterAddressedTo">Letter Addressed To :</Label>
              <Input
                id="af-letterAddressedTo"
                value={fields.letterAddressedTo}
                onChange={e => setField('letterAddressedTo', e.target.value)}
              />
            </div>
          </div>

          {/* Row 3 â€” 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            {/* Company town/city */}
            <div className="space-y-1">
              <Label htmlFor="af-companyTown">Company town/city :</Label>
              <Input
                id="af-companyTown"
                value={fields.companyTown}
                onChange={e => setField('companyTown', e.target.value)}
                className={errors.companyTown ? 'border-red-500' : ''}
              />
              {errors.companyTown && (
                <p className="text-xs text-red-500">{errors.companyTown}</p>
              )}
            </div>

            {/* Date of commencement */}
            <div className="space-y-1">
              <Label htmlFor="af-dateOfCommencement">Date of commencement :</Label>
              <Input
                id="af-dateOfCommencement"
                type="date"
                value={fields.dateOfCommencement}
                onChange={e => setField('dateOfCommencement', e.target.value)}
                className={errors.dateOfCommencement ? 'border-red-500' : ''}
              />
              {errors.dateOfCommencement && (
                <p className="text-xs text-red-500">{errors.dateOfCommencement}</p>
              )}
            </div>

            {/* Supervisor phoneNo */}
            <div className="space-y-1">
              <Label htmlFor="af-supervisorPhone">Supervisor phoneNo:</Label>
              <Input
                id="af-supervisorPhone"
                value={fields.supervisorPhone}
                onChange={e => setField('supervisorPhone', e.target.value)}
                placeholder="0XXXXXXXXX"
                className={errors.supervisorPhone ? 'border-red-500' : ''}
              />
              {errors.supervisorPhone && (
                <p className="text-xs text-red-500">{errors.supervisorPhone}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary h-10 rounded-lg px-6 text-sm font-semibold"
            >
              Next: Terms of Agreement â†’
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Step 2: Terms of Agreement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3 leading-relaxed max-h-64 overflow-y-auto">
            <p className="font-semibold text-foreground text-base">Industrial Liaison â€” Assumption of Duty</p>
            <p>
              I, the undersigned student, hereby confirm that I have duly reported to and assumed duty at the
              company stated on the previous page. I understand that this form serves as an official record of
              my commencement of industrial attachment.
            </p>
            <p>
              I agree to abide by all rules, regulations, and professional standards of the host organisation
              throughout the duration of my attachment. I acknowledge that any misrepresentation of information
              on this form may lead to disciplinary action.
            </p>
            <p>
              I further consent to the sharing of my attachment details with relevant university departments
              and supervisors for the purpose of assessment and record keeping.
            </p>
            <p>
              By signing below, I confirm that all information provided in this form is true and accurate to
              the best of my knowledge.
            </p>
          </div>

          {/* Agree checkbox */}
          <div className="flex items-start gap-3">
            <input
              id="af-agreedToTerms"
              type="checkbox"
              title="I agree to terms and conditions"
              aria-label="I agree to terms and conditions"
              checked={fields.agreedToTerms}
              onChange={e => setField('agreedToTerms', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--primary)]"
            />
            <Label htmlFor="af-agreedToTerms" className="leading-snug cursor-pointer">
              I have read, understood, and agree to the terms and conditions of the Industrial Liaison
              Assumption of Duty form.
            </Label>
          </div>

          {/* Student signature */}
          <div className="space-y-1.5">
            <Label htmlFor="af-studentSignature">Student Signature (type full name) :</Label>
            <Input
              id="af-studentSignature"
              placeholder="Enter your full name as signature"
              value={fields.studentSignature}
              onChange={e => setField('studentSignature', e.target.value)}
              className={errors.studentSignature ? 'border-red-500' : ''}
            />
            {errors.studentSignature && (
              <p className="text-xs text-red-500">{errors.studentSignature}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-10 rounded-lg px-5 border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              â† Back
            </button>
            <button
              type="submit"
              disabled={!fields.agreedToTerms}
              className="btn-primary h-10 rounded-lg px-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Form
            </button>
          </div>
        </form>
      )}
    </div>
  );
  const renderLogBookPaymentForm = () => (
    <div className="space-y-6">
      <div className="card-clean rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Industrial Attachment Log Book Fee</h3>
            <p className="text-xs text-muted-foreground">Takoradi Technical University â€” Finance Department</p>
          </div>
          <span className="text-2xl font-extrabold text-primary">GHS 30.00</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-muted-foreground">Student Name</p>
            <p className="text-sm font-semibold text-foreground">{user?.name || studentData?.name || 'Student'}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-muted-foreground">Program / Department</p>
            <p className="text-sm font-semibold text-foreground truncate">{user?.department || studentData?.department || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-muted-foreground">Payment Status</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {logBookPaymentSubmitted ? 'Paid / Verified' : 'Pending Payment'}
            </p>
          </div>
        </div>

        {!logBookPaymentSubmitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!logBookReceiptNo.trim()) {
                toast.error('Please enter Mobile Money / Bank Reference Transaction ID');
                return;
              }
              setLogBookPaymentSubmitted(true);
              toast.success('Log Book Payment receipt submitted successfully!');
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="tx-id">Payment Reference / Mobile Money TxID / Bank Receipt No.</Label>
              <Input
                id="tx-id"
                placeholder="e.g. MTN-TX-987654321"
                value={logBookReceiptNo}
                onChange={e => setLogBookReceiptNo(e.target.value)}
                required
                className="h-11 bg-[#f9fafb]"
              />
              <p className="text-xs text-muted-foreground">
                Pay via TTU MoMo Shortcode (*170#) or Bank Teller and paste transaction ID here.
              </p>
            </div>

            <button type="submit" className="btn-primary h-11 rounded-lg px-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Submit Log Book Payment Verification
            </button>
          </form>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 space-y-1">
            <p className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Payment Verified! Log Book Issued.
            </p>
            <p className="text-xs text-emerald-700">
              Receipt / Ref: <span className="font-mono font-bold">{logBookReceiptNo || 'TTU-LB-2026-001'}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderServiceContent = () => {
    if (key === 'fee-payments') return renderLogBookPaymentForm();
    if (key === 'attachment-letter') return renderAttachmentLetterForm();
    return renderAssumptionForm();
  };

  return (
    <DashboardLayout title={key === 'assumption-form' ? 'Industrial Liaison Assumption of duty form' : service.title}>
      <div className="space-y-5 max-w-5xl mx-auto">
        <Link to="/student" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        {key !== 'assumption-form' && (
          <div className="card-clean rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{service.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
              </div>
            </div>
          </div>
        )}

        {renderServiceContent()}
      </div>
    </DashboardLayout>
  );
}



