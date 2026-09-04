import React, { useRef } from 'react';
import { AttachmentLetterSubmission } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, Printer, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import letterheadImg from '../../assets/ttu-letterhead.png';

interface AttachmentLetterDocumentProps {
  submission: AttachmentLetterSubmission;
  showActions?: boolean;
  onVerified?: () => void;
  canVerify?: boolean;
}

const formatDisplayDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateOrFallback = (value: string | undefined, fallback: string) => {
  return formatDisplayDate(value) || fallback;
};
const formatOrdinalDate = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11
    ? 'st'
    : day % 10 === 2 && day !== 12
      ? 'nd'
      : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';

  return `${day}${suffix} ${date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })}`;
};

export function AttachmentLetterDocument({
  submission,
  showActions = true,
  onVerified,
  canVerify = false,
}: AttachmentLetterDocumentProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const formattedDate = React.useMemo(() => {
    return formatDateOrFallback(submission.submittedAt, '24 January 2026');
  }, [submission.submittedAt]);

  const attachmentStartDate = formatOrdinalDate(submission.startDate, '11th September, 2023');
  const attachmentEndDate = formatOrdinalDate(submission.endDate, '24th November, 2023');
  const refNumber = submission.refNumber || `TTU/IL/AL/${new Date().getFullYear()}/${(submission.id || '001').slice(-3).padStart(3, '0').toUpperCase()}`;

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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Collect all stylesheets and style tags so Tailwind + fonts are preserved in print
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback: If popup blocker prevents opening a new window, trigger window.print directly
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TTU Attachment Letter - ${submission.studentName}</title>
          ${styleTags}
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            html, body {
              background: #fff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Times New Roman', Times, serif;
            }
            .printable-card {
              width: 100% !important;
              max-width: 190mm !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="printable-card">${printContent.innerHTML}</div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 600);
              }, 300);
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
        return <Badge className="bg-red-600 text-white font-bold text-xs px-3 py-1">Revision Requested</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground text-xs px-3 py-1">Not Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="bg-white dark:bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
            {statusBadge(submission.status)}
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Ref: <strong className="text-foreground">{refNumber}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-semibold rounded-lg h-9 border-border">
              <Printer className="w-4 h-4 text-primary" /> Print Letter
            </Button>
            <Button size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="btn-primary gap-1.5 text-xs font-semibold rounded-lg h-9">
              <Download className="w-4 h-4" /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
            {canVerify && onVerified && (submission.status === 'submitted' || submission.status === 'pending' || submission.status === 'pdf_generated') && (
              <Button size="sm" onClick={onVerified} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold rounded-lg h-9">
                <CheckCircle2 className="w-4 h-4" /> Verify Letter
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-100 dark:bg-slate-950/30 border border-slate-200 rounded-xl p-3 sm:p-6 max-w-4xl mx-auto overflow-x-auto">
        <div
          ref={printRef}
          className="print-attachment-letter relative mx-auto bg-white text-slate-950 font-serif shadow-sm border border-slate-300 px-7 py-8 sm:px-10 sm:py-9 w-full max-w-[794px] min-h-[1123px] overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] select-none pointer-events-none">
            <span className="text-6xl sm:text-7xl font-black rotate-[-32deg] tracking-widest uppercase whitespace-nowrap">
              TTU INDUSTRIAL LIAISON
            </span>
          </div>

          <div className="relative z-10">
            <header className="mb-6">
              <img
                src={letterheadImg}
                alt="Takoradi Technical University Industrial Liaison Office Letterhead"
                className="w-full h-auto object-contain block select-none"
              />
            </header>

            <section className="mb-6 grid grid-cols-[1fr_auto] gap-6 text-sm font-sans">
              <div className="space-y-1 leading-snug">
                <p className="font-extrabold uppercase">{submission.letterAddressedTo || 'THE HUMAN RESOURCE MANAGER'}</p>
                <p className="font-bold uppercase">{submission.companyName || 'HOST ORGANIZATION'}</p>
                {submission.companyAddress && <p className="text-slate-700">{submission.companyAddress}</p>}
                <p className="font-semibold uppercase text-slate-800">{submission.companyTown || 'TAKORADI'}</p>
              </div>

              <div className="text-right space-y-1 leading-snug">
                <p><span className="font-bold">Our Ref:</span> <span className="font-mono text-xs">{refNumber}</span></p>
                <p><span className="font-bold">Date:</span> {formattedDate}</p>
              </div>
            </section>

            <section className="mb-5 space-y-3">
              <p className="text-sm font-sans">Dear Sir/Madam,</p>
              <h2 className="text-center text-[15px] font-black uppercase underline tracking-normal">
                Practical Industrial Training Programme for Students
              </h2>
            </section>

            <section className="space-y-3.5 text-[14px] leading-7 text-justify">
              <p>
                Students of Takoradi Technical University pursuing Bachelor of Technology(B.Tech) are expected to undergo practical industrial training in industry as part of the requirements for the award of their certificate.
              </p>
              <p>
                It is believed that the attachment programme would bring positive industrial exposure to students. This exercise would enable students to put theory into practice and acquaint themselves with current technological development in industry and commerce.
              </p>
              <p>
                The University would, therefore, be grateful if you could consider the under-mentioned student to undertake his/her industrial attachment programme in your organization from <strong className="font-bold underline">{attachmentStartDate}</strong> - <strong className="font-bold underline">{attachmentEndDate}</strong>.
              </p>
            </section>

            <section className="my-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-normal font-sans">The student's particulars are as follows:</p>
              <table className="w-full border-collapse border border-slate-950 text-sm font-sans">
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="w-[36%] border border-slate-950 px-3 py-2 font-bold">REGISTRATION NUMBER:</td>
                    <td className="border border-slate-950 px-3 py-2 font-mono font-bold">{submission.studentRegNo || submission.studentId || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-950 px-3 py-2 font-bold">NAME:</td>
                    <td className="border border-slate-950 px-3 py-2 font-bold uppercase">{submission.studentName}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-950 px-3 py-2 font-bold">PROGRAMME:</td>
                    <td className="border border-slate-950 px-3 py-2 font-semibold">{submission.department || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-950 px-3 py-2 font-bold">CONTACT NUMBER:</td>
                    <td className="border border-slate-950 px-3 py-2 font-mono font-semibold">{submission.studentPhone || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="space-y-3.5 text-[14px] leading-7 text-justify">
              <p>
                We request that the student should be made to familiarize him/herself with all the related sections available in your organization.
              </p>
              <p>
                For your information, all students at the University are covered by Group Personal Accident Insurance policy.
              </p>
              <p>We count on your usual cooperation.</p>
            </section>

            <section className="mt-10 grid grid-cols-[1fr_220px] gap-6 font-sans">
              <div>
                <p className="text-sm font-serif">Yours faithfully,</p>
                <div className="mt-5 mb-2 text-xl font-black italic text-blue-900 leading-none">Mark Kofi Aremu</div>
                <div className="inline-block border-2 border-red-700 px-3 py-1 text-center text-[9px] font-bold uppercase tracking-normal text-red-800">
                  Takoradi Technical University<br />Industrial Liaison Office<br />Officially Verified & Stamped
                </div>
                <p className="mt-3 text-sm font-extrabold uppercase">Mark Kofi Aremu</p>
                <p className="text-[11px] font-bold uppercase tracking-normal text-slate-700">Industrial Liaison Officer</p>
              </div>

              <div className="self-end border border-slate-300 bg-slate-50 p-3 text-right text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500">Student Signature Confirmation</span>
                <p className="mt-1 text-base font-bold italic text-slate-950">{submission.studentSignature || submission.studentName}</p>
                <p className="text-[10px] text-slate-500 font-mono">Submitted: {formattedDate}</p>
              </div>
            </section>

            <footer className="mt-8 border-t border-slate-300 pt-3 flex items-center justify-between gap-4 text-[9px] font-sans text-slate-500">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="font-mono">Ref: {refNumber} | Security: TTU-AUTH-{(submission.id || '01').toUpperCase()}</span>
              </div>
              <span className="font-bold uppercase text-slate-700">NB: DO NOT ACCEPT THIS LETTER IF IT DOES NOT BEAR THE ORIGINAL STAMP</span>
            </footer>
          </div>
        </div>
      </div>

      {/* Embedded print styles for seamless browser printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-attachment-letter, .print-attachment-letter * {
            visibility: visible;
          }
          .print-attachment-letter {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            color: #0f172a !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}




