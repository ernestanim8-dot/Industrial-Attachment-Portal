import React, { useRef } from 'react';
import { AttachmentLetterSubmission } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, Printer, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AttachmentLetterDocumentProps {
  submission: AttachmentLetterSubmission;
  showActions?: boolean;
  onVerified?: () => void;
  canVerify?: boolean;
}

export function AttachmentLetterDocument({
  submission,
  showActions = true,
  onVerified,
  canVerify = false,
}: AttachmentLetterDocumentProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const formattedDate = React.useMemo(() => {
    try {
      const d = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '24th January, 2026';
    }
  }, [submission.submittedAt]);

  const refNumber = submission.refNumber || `TTU/IL/AL/${new Date().getFullYear()}/${(submission.id || '001').slice(-3).padStart(3, '0').toUpperCase()}`;

  // Handle PDF generation and download
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    toast.info('Generating official Attachment Letter PDF...');

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
      
      const fileName = `TTU_Attachment_Letter_${submission.studentName.replace(/\s+/g, '_')}_${submission.studentRegNo || 'STU'}.pdf`;
      pdf.save(fileName);
      toast.success('Official Attachment Letter PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try using the Print option.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle browser native print
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the letter.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TTU Attachment Letter - ${submission.studentName}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif, system-ui;
              color: #111827;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .printable-card {
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
            }
            .ttu-crest {
              height: 75px;
              width: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #1f2937;
              padding: 6px 10px;
              font-size: 13px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 80px;
              font-weight: 900;
              color: rgba(0, 0, 0, 0.04);
              pointer-events: none;
              text-transform: uppercase;
              letter-spacing: 12px;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="printable-card">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'verified':
      case 'approved':
        return (
          <Badge className="bg-emerald-600 text-white font-bold gap-1 text-xs px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Liaison Office
          </Badge>
        );
      case 'submitted':
      case 'pdf_generated':
      case 'pending':
        return (
          <Badge className="bg-blue-600 text-white font-bold gap-1 text-xs px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Submitted & PDF Ready
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-600 text-white font-bold text-xs px-3 py-1">
            Revision Requested
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs px-3 py-1">
            Not Submitted
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Status Bar */}
      {showActions && (
        <div className="bg-white dark:bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Status:
            </span>
            {statusBadge(submission.status)}
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Ref: <strong className="text-foreground">{refNumber}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-semibold rounded-lg h-9 border-border"
            >
              <Printer className="w-4 h-4 text-primary" /> Print Letter
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="btn-primary gap-1.5 text-xs font-semibold rounded-lg h-9"
            >
              <Download className="w-4 h-4" /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            {canVerify && onVerified && (submission.status === 'submitted' || submission.status === 'pending' || submission.status === 'pdf_generated') && (
              <Button
                size="sm"
                onClick={onVerified}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold rounded-lg h-9"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify Letter
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Official Printable TTU Attachment Letter Sheet */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-xl shadow-md p-6 sm:p-10 max-w-4xl mx-auto font-serif relative overflow-hidden">
        
        {/* Printable Container */}
        <div ref={printRef} className="relative bg-white p-2">
          
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
            <span className="text-7xl font-black rotate-[-30deg] tracking-widest uppercase">
              TTU INDUSTRIAL LIAISON
            </span>
          </div>

          {/* ========================================================= */}
          {/* 1. OFFICIAL UNIVERSITY LETTERHEAD                          */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/src/assets/TTU LOGO.png"
                alt="Takoradi Technical University Logo"
                className="h-20 w-auto object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif leading-tight">
                  TAKORADI TECHNICAL UNIVERSITY
                </h1>
                <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider font-sans mt-0.5">
                  OFFICE OF THE INDUSTRIAL LIAISON OFFICER
                </p>
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                  P.O. Box 256, Takoradi, Western Region, Ghana • Tel: +233 (0) 312 022 983 / 984
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  Email: liaison@ttu.edu.gh • Web: www.ttu.edu.gh
                </p>
              </div>
            </div>

            {/* Electronic Verification QR / Stamp indicator */}
            <div className="hidden sm:flex flex-col items-center justify-center p-2 border border-slate-300 rounded-lg bg-slate-50 text-center shrink-0">
              <QrCode className="w-10 h-10 text-slate-800" />
              <span className="text-[9px] font-sans font-bold text-slate-700 mt-1 uppercase tracking-wider">
                E-VERIFIED
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                {refNumber}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. DATE & RECIPIENT ADDRESS                               */}
          {/* ========================================================= */}
          <div className="flex justify-between items-start text-xs sm:text-sm font-sans mb-6 gap-4">
            <div className="space-y-1">
              <p className="font-extrabold uppercase text-slate-900 tracking-wide">
                {submission.letterAddressedTo || 'THE HUMAN RESOURCE MANAGER'}
              </p>
              <p className="font-bold text-slate-900">
                {submission.companyName || 'Host Organization'}
              </p>
              <p className="font-semibold uppercase text-slate-700">
                {submission.companyTown || 'Accra / Takoradi'}
              </p>
              {submission.companyAddress && (
                <p className="text-slate-600">{submission.companyAddress}</p>
              )}
            </div>

            <div className="text-right space-y-1 shrink-0 font-sans">
              <p className="font-bold text-slate-900">
                Our Ref: <span className="font-mono">{refNumber}</span>
              </p>
              <p className="font-semibold text-slate-700">
                Date: <span className="font-medium">{formattedDate}</span>
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. SALUTATION & SUBJECT LINE                              */}
          {/* ========================================================= */}
          <div className="space-y-3 mb-5">
            <p className="text-xs sm:text-sm font-sans text-slate-800">
              Dear Sir/Madam,
            </p>

            <div className="text-center py-1">
              <h2 className="text-sm sm:text-base font-black text-slate-950 underline uppercase tracking-wider font-serif">
                PRACTICAL INDUSTRIAL TRAINING PROGRAMME FOR STUDENTS
              </h2>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. BODY PARAGRAPHS (Official TTU Text)                    */}
          {/* ========================================================= */}
          <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-800 text-justify font-serif">
            <p>
              Students of Takoradi Technical University pursuing Bachelor of Technology (B.Tech) and Higher National Diploma (HND) programmes are expected to undergo practical industrial training in industry as part of the academic requirements for the award of their certificate.
            </p>

            <p>
              It is believed that the attachment programme would bring positive industrial exposure to students. This exercise would enable students to put theory into practice and acquaint themselves with current technological developments in industry and commerce.
            </p>

            <p>
              The University would, therefore, be grateful if you could consider the under-mentioned student to undertake his/her industrial attachment programme in your organization from{' '}
              <strong className="font-sans font-bold text-slate-900 underline">
                {submission.startDate || '15th January, 2026'}
              </strong>{' '}
              to{' '}
              <strong className="font-sans font-bold text-slate-900 underline">
                {submission.endDate || '15th June, 2026'}
              </strong>.
            </p>
          </div>

          {/* ========================================================= */}
          {/* 5. STUDENT PARTICULARS TABLE                              */}
          {/* ========================================================= */}
          <div className="my-6">
            <p className="text-xs font-sans font-bold text-slate-900 uppercase tracking-wider mb-2">
              The student's particulars are as follows:
            </p>
            <table className="w-full text-xs sm:text-sm border-collapse border border-slate-900 font-sans">
              <tbody>
                <tr className="border-b border-slate-900 bg-slate-50/70">
                  <td className="w-1/3 py-2 px-3 font-bold text-slate-900 border-r border-slate-900">
                    Registration Number:
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-950">
                    {submission.studentRegNo || submission.studentId || 'BC/GRD/22/012'}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="w-1/3 py-2 px-3 font-bold text-slate-900 border-r border-slate-900">
                    Name:
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-950 uppercase">
                    {submission.studentName}
                  </td>
                </tr>
                <tr className="border-b border-slate-900 bg-slate-50/70">
                  <td className="w-1/3 py-2 px-3 font-bold text-slate-900 border-r border-slate-900">
                    Programme:
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {submission.department || 'Bachelor of Technology in Graphic Design'}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="w-1/3 py-2 px-3 font-bold text-slate-900 border-r border-slate-900">
                    Contact Number:
                  </td>
                  <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                    {submission.studentPhone || '0502310663'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 6. INSTITUTIONAL SAFEGUARDS & INSURANCE CLAUSE            */}
          {/* ========================================================= */}
          <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-800 text-justify font-serif">
            <p>
              We request that the student should be made to familiarize himself/herself with all the related sections available in your organization.
            </p>

            <p className="bg-slate-50 border-l-4 border-slate-800 p-2.5 italic text-slate-900 text-xs sm:text-[13px] font-sans">
              <strong>Insurance Notice:</strong> For your information, all students at Takoradi Technical University are covered by a Group Personal Accident Insurance Policy during their official attachment period.
            </p>

            <p>
              We count on your usual cooperation.
            </p>
          </div>

          {/* ========================================================= */}
          {/* 7. OFFICIAL SIGN-OFF & STAMP BLOCK                        */}
          {/* ========================================================= */}
          <div className="mt-8 pt-4 flex flex-col sm:flex-row items-start justify-between gap-6 font-sans">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-serif">Yours faithfully,</p>
              
              {/* Stamp & Signature graphic */}
              <div className="pt-2 pb-1 relative">
                <div className="text-xs font-script italic font-black text-blue-900 select-none text-xl leading-none">
                  Albert Ofori-Boateng
                </div>
                <div className="inline-block border-2 border-dashed border-red-700/80 rounded-lg px-3 py-1 mt-1.5 bg-red-50/40 text-[9px] font-bold text-red-800 uppercase tracking-widest text-center">
                  TAKORADI TECHNICAL UNIVERSITY<br />
                  ★ INDUSTRIAL LIAISON OFFICE ★<br />
                  OFFICIALLY VERIFIED & STAMPED
                </div>
              </div>

              <p className="font-extrabold text-xs sm:text-sm text-slate-950 uppercase pt-1">
                Dr. Albert Ofori-Boateng
              </p>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Head, Industrial Liaison Department
              </p>
            </div>

            {/* Student electronic acknowledgment */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-right space-y-1 text-xs self-end sm:self-auto min-w-[200px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Student Signature Confirmation
              </span>
              <p className="font-script font-bold text-base text-slate-900 italic">
                {submission.studentSignature || submission.studentName}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Submitted: {formattedDate}
              </p>
            </div>
          </div>

          {/* Footer Code */}
          <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[9px] font-sans text-slate-500">
            <span>Form TTU/IL-01 • Industrial Attachment Introductory Letter</span>
            <span>Security Code: TTU-AUTH-{(submission.id || '01').toUpperCase()}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
