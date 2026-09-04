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
  ChevronRight, Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
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

  const [logBookReceiptNo, setLogBookReceiptNo] = useState('');
  const [logBookPaymentSubmitted, setLogBookPaymentSubmitted] = useState(false);

  // ── Attachment Letter state ────────────────────────────────────────────────
  const [letterStep, setLetterStep] = useState<1 | 2>(1);
  const [letterFields, setLetterFields] = useState({
    companyName: 'IDesign',
    companyTown: 'Accra',
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
  const [selectedLetterForModal, setSelectedLetterForModal] = useState<AttachmentLetterSubmission | null>(null);
  const [isLetterSubmitting, setIsLetterSubmitting] = useState(false);

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

  const handleLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLetterStep2()) return;
    setIsLetterSubmitting(true);
    try {
      const newLetterId = `letter-${Date.now()}`;
      await submitAttachmentLetter({
        studentId: studentData?.id || user?.id || '',
        studentName: studentData?.name || user?.name || 'Unknown',
        studentRegNo: studentData?.studentId || '',
        studentPhone: (studentData as { phone?: string })?.phone || '',
        department: studentData?.department || user?.department || 'Unknown Department',
        academicLevel: studentData?.currentLevel || 1,
        companyName: letterFields.companyName,
        companyTown: letterFields.companyTown,
        letterAddressedTo: letterFields.letterAddressedTo,
        studentSignature: letterFields.studentSignature,
      });
      toast.success('Attachment Letter submitted! Your official letter is ready to print or download as PDF.');
      setSelectedLetterForModal({
        id: newLetterId,
        studentId: studentData?.id || user?.id || 'student1',
        studentName: studentData?.name || user?.name || 'John Doe',
        studentRegNo: studentData?.studentId || 'BC/GRD/22/012',
        studentPhone: (studentData as { phone?: string })?.phone || '0502310663',
        department: studentData?.department || user?.department || 'Bachelor of Technology in Graphic Design',
        academicLevel: studentData?.currentLevel || 3,
        submittedAt: new Date().toISOString(),
        status: 'verified',
        companyName: letterFields.companyName || 'Host Organization',
        companyTown: letterFields.companyTown || 'Accra',
        letterAddressedTo: letterFields.letterAddressedTo || 'THE MANAGER',
        startDate: '2023-09-11',
        endDate: '2023-11-24',
        studentSignature: letterFields.studentSignature || user?.name || studentData?.name || 'John Doe',
        refNumber: `TTU/IL/AL/${new Date().getFullYear()}/001`,
      });
      setIsPreviewOpen(true);
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsLetterSubmitting(false);
    }
  };

  const renderAttachmentLetterForm = () => {
    const myLetters = (attachmentLetterSubmissions || []).filter(l =>
      l.studentId === studentData?.id ||
      l.studentId === user?.id ||
      l.studentName?.toLowerCase() === (studentData?.name || user?.name || '').toLowerCase()
    );

    const openPreview = (letter?: AttachmentLetterSubmission) => {
      if (letter) {
        setSelectedLetterForModal(letter);
        setIsPreviewOpen(true);
        return;
      }
      if (!validateLetterStep1()) {
        toast.error('Please fill out Company Name and Town/City first.');
        return;
      }
      setSelectedLetterForModal({
        id: myLetters[0]?.id || 'preview-letter',
        studentId: studentData?.id || user?.id || 'student1',
        studentName: studentData?.name || user?.name || 'John Doe',
        studentRegNo: studentData?.studentId || 'BC/GRD/22/012',
        studentPhone: (studentData as { phone?: string })?.phone || '0502310663',
        department: studentData?.department || user?.department || 'Bachelor of Technology in Graphic Design',
        academicLevel: studentData?.currentLevel || 3,
        submittedAt: myLetters[0]?.submittedAt || new Date().toISOString(),
        status: myLetters[0]?.status || 'verified',
        companyName: letterFields.companyName || 'Host Organization',
        companyTown: letterFields.companyTown || 'Accra',
        letterAddressedTo: letterFields.letterAddressedTo || 'THE MANAGER',
        startDate: myLetters[0]?.startDate || '2023-09-11',
        endDate: myLetters[0]?.endDate || '2023-11-24',
        studentSignature: letterFields.studentSignature || user?.name || studentData?.name || 'John Doe',
        refNumber: myLetters[0]?.refNumber || `TTU/IL/AL/${new Date().getFullYear()}/001`,
      });
      setIsPreviewOpen(true);
    };

    return (
      <div className="space-y-6">
        {/* Top Header Row matching screenshot */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">
            Industrial Liaison Attachment
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openPreview()}
              className="bg-[#7cb342] hover:bg-[#689f38] text-white font-medium text-xs sm:text-sm px-4 py-2 rounded shadow-xs transition-colors cursor-pointer"
            >
              Are you done? Click to Preview Form
            </button>
            <button
              type="button"
              onClick={() => openPreview()}
              className="bg-primary hover:bg-primary/90 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print / PDF Letter
            </button>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-card border border-border shadow-xs overflow-hidden">
          {/* Tab Header Bar */}
          <div className="flex items-stretch bg-[#2196f3]">
            {/* Tab 1: Company Information (Red) */}
            <button
              type="button"
              onClick={() => setLetterStep(1)}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-semibold text-white transition-colors cursor-pointer ${
                letterStep === 1 ? 'bg-[#c62828]' : 'bg-[#c62828]/85 hover:bg-[#c62828]'
              }`}
            >
              <span className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shrink-0">
                1
              </span>
              Company Information
            </button>

            {/* Tab 2: Terms of Agreement (Blue) */}
            <button
              type="button"
              onClick={() => {
                if (validateLetterStep1()) setLetterStep(2);
              }}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-semibold text-white transition-colors cursor-pointer ${
                letterStep === 2 ? 'bg-[#1976d2]' : 'bg-[#2196f3] hover:bg-[#1e88e5]'
              }`}
            >
              <span className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shrink-0">
                2
              </span>
              Terms of Agreement
            </button>

            {/* Spacer extending blue tab bar background */}
            <div className="flex-1 bg-[#2196f3]" />

            {/* Settings Gear Icon in white block at right */}
            <div className="bg-white flex items-center justify-center px-3 border-l border-blue-400">
              <button
                type="button"
                title="Settings"
                className="text-slate-800 hover:text-black transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step 1: Form Content */}
          {letterStep === 1 ? (
            <div>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {/* Left Column: Company Name & Town/City */}
                  <div className="space-y-6">
                    {/* Company Name */}
                    <div className="space-y-1">
                      <Label htmlFor="al-companyName" className="text-xs text-slate-500 font-normal">
                        Company Name :
                      </Label>
                      <Input
                        id="al-companyName"
                        value={letterFields.companyName}
                        onChange={e => {
                          setLetterFields(prev => ({ ...prev, companyName: e.target.value }));
                          setLetterErrors(prev => ({ ...prev, companyName: undefined }));
                        }}
                        className={`h-9 bg-transparent border-0 border-b border-slate-300 dark:border-slate-700 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-sm sm:text-base ${
                          letterErrors.companyName ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter Company Name"
                      />
                      {letterErrors.companyName && (
                        <p className="text-xs text-red-500">{letterErrors.companyName}</p>
                      )}
                    </div>

                    {/* Town/City */}
                    <div className="space-y-1">
                      <Label htmlFor="al-companyTown" className="text-xs text-slate-500 font-normal">
                        Town/City :
                      </Label>
                      <Input
                        id="al-companyTown"
                        value={letterFields.companyTown}
                        onChange={e => {
                          setLetterFields(prev => ({ ...prev, companyTown: e.target.value }));
                          setLetterErrors(prev => ({ ...prev, companyTown: undefined }));
                        }}
                        className={`h-9 bg-transparent border-0 border-b border-slate-300 dark:border-slate-700 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-foreground text-sm sm:text-base ${
                          letterErrors.companyTown ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter Town/City"
                      />
                      {letterErrors.companyTown && (
                        <p className="text-xs text-red-500">{letterErrors.companyTown}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Letter Addressed To (aligned down matching screenshot) */}
                  <div className="flex flex-col justify-end space-y-1">
                    <Label htmlFor="al-letterAddressedTo" className="text-xs text-slate-500 font-normal">
                      Letter Addressed To :
                    </Label>
                    <select
                      id="al-letterAddressedTo"
                      title="Letter Addressed To"
                      aria-label="Letter Addressed To"
                      value={letterFields.letterAddressedTo}
                      onChange={e => setLetterFields(prev => ({ ...prev, letterAddressedTo: e.target.value }))}
                      className="flex h-10 w-full rounded border border-slate-300 dark:border-slate-700 bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              {/* Light grey bottom bar with NEXT > */}
              <div className="bg-[#e0e0e0] dark:bg-muted p-3.5 px-6 flex justify-end items-center">
                <button
                  type="button"
                  onClick={handleLetterNext}
                  className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-foreground flex items-center gap-1 hover:opacity-75 transition-opacity cursor-pointer"
                >
                  NEXT <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLetterSubmit} className="p-6 sm:p-8 space-y-5">
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
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLetterStep(1)}
                  className="h-10 rounded-lg px-5 border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => openPreview()}
                  className="h-10 rounded-lg px-4 border border-blue-600 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Preview & Print PDF
                </button>
                <button
                  type="submit"
                  disabled={!letterFields.agreedToTerms || isLetterSubmitting}
                  className="btn-primary h-10 rounded-lg px-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {isLetterSubmitting ? 'Submitting...' : 'Submit to Liaison Office'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing / Generated Attachment Letters */}
        {myLetters.length > 0 && (
          <div className="bg-white dark:bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />
                Your Generated Attachment Letters ({myLetters.length})
              </h3>
              <span className="text-xs text-muted-foreground">Ready to Print & Download</span>
            </div>
            <div className="divide-y divide-border">
              {myLetters.map(letter => (
                <div key={letter.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{letter.companyName}</span>
                      <span className="text-xs text-muted-foreground font-mono">({letter.refNumber || 'REF PENDING'})</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {letter.letterAddressedTo} &bull; {letter.companyTown} &bull; Submitted: {new Date(letter.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPreview(letter)}
                      className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview & Print Letter Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-card border border-border shadow-xl rounded-2xl p-4 sm:p-6">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary" />
                Official Industrial Attachment Letter
              </DialogTitle>
              <DialogDescription className="text-xs">
                Official Takoradi Technical University Introductory Letter. Use the buttons below to print or download as an official PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="pt-2">
              <AttachmentLetterDocument
                submission={selectedLetterForModal || {
                  id: 'preview-letter',
                  studentId: studentData?.id || user?.id || 'student1',
                  studentName: studentData?.name || user?.name || 'John Doe',
                  studentRegNo: studentData?.studentId || 'BC/GRD/22/012',
                  studentPhone: (studentData as { phone?: string })?.phone || '0502310663',
                  department: studentData?.department || user?.department || 'Bachelor of Technology in Graphic Design',
                  academicLevel: studentData?.currentLevel || 3,
                  submittedAt: new Date().toISOString(),
                  status: 'verified',
                  companyName: letterFields.companyName || 'Host Organization',
                  companyTown: letterFields.companyTown || 'Accra',
                  letterAddressedTo: letterFields.letterAddressedTo || 'THE MANAGER',
                  startDate: '2023-09-11',
                  endDate: '2023-11-24',
                  studentSignature: letterFields.studentSignature || user?.name || studentData?.name || 'John Doe',
                  refNumber: `TTU/IL/AL/${new Date().getFullYear()}/001`,
                }}
                showActions={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ── Assumption form helpers ─────────────────────────────────────────────────
  const setField = <K extends keyof AssumptionFields>(k: K, v: AssumptionFields[K]) => {
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
                className="flex h-11 w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                className="h-11 bg-input-background"
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

        {key !== 'assumption-form' && key !== 'attachment-letter' && (
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






