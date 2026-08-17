import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Download, FileText, X } from 'lucide-react';
import { Report } from '../types';

interface DocumentPreviewProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ report, isOpen, onClose }: DocumentPreviewProps) {
  if (!report) return null;

  const handleDownload = () => {
    // Mock download functionality
    const blob = new Blob([`Report: ${report.title}\n\n${report.description}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {report.title}
          </DialogTitle>
          <DialogDescription>
            Submitted by {report.studentName} on {new Date(report.submittedDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Document Preview Area */}
          <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
            {/* Mock PDF Preview */}
            <div className="bg-white shadow-lg rounded p-8 max-w-3xl mx-auto">
              <div className="border-b pb-4 mb-4">
                <h1 className="text-2xl mb-2">{report.title}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Student: {report.studentName}</p>
                  <p>Submitted: {new Date(report.submittedDate).toLocaleDateString()}</p>
                  {report.weekNumber && <p>Week: {report.weekNumber}</p>}
                </div>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-lg mb-3">Report Description</h2>
                <p className="text-gray-700 leading-relaxed">{report.description}</p>

                {/* Mock Content */}
                <div className="mt-6 space-y-4 text-gray-700">
                  <h3 className="text-base">Activities Completed</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Attended orientation and safety training sessions</li>
                    <li>Familiarized with company tools and processes</li>
                    <li>Collaborated with team members on ongoing projects</li>
                    <li>Documented learnings and observations</li>
                  </ul>

                  <h3 className="text-base mt-4">Key Learnings</h3>
                  <p>
                    This week provided valuable insights into professional work environments
                    and industry-standard practices. The hands-on experience has enhanced
                    my understanding of real-world application of academic concepts.
                  </p>

                  <h3 className="text-base mt-4">Challenges Faced</h3>
                  <p>
                    Initial adjustment to the fast-paced work environment required quick
                    adaptation. Overcame challenges through active communication with
                    supervisors and team members.
                  </p>

                  <h3 className="text-base mt-4">Next Steps</h3>
                  <p>
                    Continue building on this week's foundation by taking on more
                    responsibilities and contributing to team objectives.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t text-sm text-gray-500">
                <p>File: {report.fileName} ({report.fileSize})</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {report.status === 'graded' && report.grade && (
              <span className="font-medium text-green-600">Grade: {report.grade}/100</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={onClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
