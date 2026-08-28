import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Download, FileArchive } from 'lucide-react';
import { Report } from '../types';
import { toast } from 'sonner';

interface BulkDownloadProps {
  reports: Report[];
}

export function BulkDownload({ reports }: BulkDownloadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleToggleReport = (reportId: string) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  const handleDownload = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report');
      return;
    }

    setIsDownloading(true);

    // Simulate download process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real application, this would create a ZIP file
    // For now, we'll just show a success message
    const selectedReportsList = reports.filter(r => selectedReports.includes(r.id));

    // Create a mock text file with report information
    const content = selectedReportsList.map(report => `
Report: ${report.title}
Student: ${report.studentName}
Week: ${report.weekNumber || 'N/A'}
Date: ${new Date(report.submittedDate).toLocaleDateString()}
Status: ${report.status}
Grade: ${report.grade !== undefined ? `${report.grade}/100` : 'Not graded'}

Description:
${report.description}

${report.feedback ? `Feedback:\n${report.feedback}` : ''}

${'='.repeat(80)}
    `).join('\n\n');

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${selectedReports.length} report(s)`);
    setIsDownloading(false);
    setIsOpen(false);
    setSelectedReports([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Bulk Download
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5" />
            Bulk Download Reports
          </DialogTitle>
          <DialogDescription>
            Select the reports you want to download. They will be packaged together.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Select All */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-3">
            <Checkbox
              id="select-all"
              checked={selectedReports.length === reports.length}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({reports.length} reports)
            </label>
          </div>

          {/* Report List */}
          <div className="space-y-2">
            {reports.map(report => (
              <div
                key={report.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  selectedReports.includes(report.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-card border-border hover:bg-accent/50'
                }`}
              >
                <Checkbox
                  id={report.id}
                  checked={selectedReports.includes(report.id)}
                  onCheckedChange={() => handleToggleReport(report.id)}
                  className="mt-1"
                />
                <label htmlFor={report.id} className="flex-1 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.studentName} • Week {report.weekNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {report.fileSize}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.submittedDate).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      report.status === 'graded'
                        ? 'bg-green-100 text-green-700'
                        : report.status === 'reviewed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-sm text-muted-foreground">
            {selectedReports.length} report(s) selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading || selectedReports.length === 0}>
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download ({selectedReports.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
