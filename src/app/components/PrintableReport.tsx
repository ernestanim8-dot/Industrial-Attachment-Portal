import { Report, Student } from '../types';
import { GraduationCap, Printer, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { generatePDF } from '../utils/pdfGenerator';

interface PrintableReportProps {
  report: Report;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintableReport({ report, student, isOpen, onClose }: PrintableReportProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle>Print Report</DialogTitle>
        </DialogHeader>

        <div className="print-content" id="printable-report-content">
          {/* Printable Document */}
          <div className="bg-white p-4 sm:p-8 md:p-12 print:p-0">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 border-b-2 border-blue-600 pb-4 sm:pb-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full">
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-foreground">Takoradi Technical University</h1>
              <h2 className="text-base sm:text-xl text-gray-700">Industrial Attachment Report</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Academic Year 2025/2026</p>
            </div>

            {/* Student Information */}
            <div className="mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 rounded-lg print:bg-transparent print:border print:border-gray-300">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-blue-600">Student Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Student Name</p>
                  <p className="font-medium text-sm sm:text-base">{student.name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Student ID</p>
                  <p className="font-medium text-sm sm:text-base">{student.studentId}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Department</p>
                  <p className="font-medium text-sm sm:text-base">{student.department}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Email</p>
                  <p className="font-medium text-sm sm:text-base truncate">{student.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Company</p>
                  <p className="font-medium text-sm sm:text-base">{student.company || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Attachment Period</p>
                  <p className="font-medium text-sm sm:text-base">
                    {student.attachmentStartDate && student.attachmentEndDate
                      ? `${new Date(student.attachmentStartDate).toLocaleDateString()} - ${new Date(student.attachmentEndDate).toLocaleDateString()}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-blue-600">Report Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Report Title</p>
                  <p className="font-medium text-base sm:text-lg">{report.title}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Week Number</p>
                    <p className="font-medium text-sm sm:text-base">Week {report.weekNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Submission Date</p>
                    <p className="font-medium text-sm sm:text-base">{new Date(report.submittedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize text-sm sm:text-base">{report.status}</p>
                  </div>
                  {report.grade !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Grade</p>
                      <p className="font-medium text-green-600 text-lg">{report.grade}/100</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="mb-8">
              <h3 className="text-lg mb-4 text-blue-600">Report Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </div>
            </div>

            {/* Feedback Section */}
            {report.feedback && (
              <div className="mb-8 bg-blue-50 p-6 rounded-lg print:bg-transparent print:border-2 print:border-blue-600">
                <h3 className="text-lg mb-4 text-blue-600">Supervisor Feedback</h3>
                <p className="text-gray-700 italic leading-relaxed">{report.feedback}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="mt-12 grid grid-cols-2 gap-8">
              <div>
                <div className="border-t border-gray-400 pt-2 mt-16">
                  <p className="text-sm text-gray-600">Student Signature</p>
                  <p className="text-sm text-gray-500 mt-1">Date: _______________</p>
                </div>
              </div>
              <div>
                <div className="border-t border-gray-400 pt-2 mt-16">
                  <p className="text-sm text-gray-600">Supervisor Signature</p>
                  <p className="text-sm text-gray-500 mt-1">Date: _______________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-center text-sm text-gray-600">
              <p>©2026 Takoradi Technical University - Industrial Attachment Portal</p>
              <p className="mt-1">This is an official document generated by the Industrial Attachment Portal</p>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => generatePDF('printable-report-content', `Report-${student.name.replace(/\s+/g, '-')}-W${report.weekNumber || 'Final'}.pdf`)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              margin: 1cm;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
