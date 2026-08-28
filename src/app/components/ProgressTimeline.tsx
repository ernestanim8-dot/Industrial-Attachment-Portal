import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Circle, Clock, FileText } from 'lucide-react';

export function ProgressTimeline() {
  const { user } = useAuth();
  const { reports, students } = useData();

  const studentData = students.find(s => s.email === user?.email || s.id === user?.id);
  const studentReports = reports
    .filter(r => r.studentId === studentData?.id)
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());

  const timelineItems = studentReports.map(report => ({
    id: report.id,
    title: report.title,
    date: report.submittedDate,
    week: report.weekNumber,
    status: report.status,
    grade: report.grade,
    feedback: report.feedback,
  }));

  // Add milestone markers
  const milestones = [
    { week: 5, title: 'First Assessment', reached: studentReports.some(r => r.weekNumber && r.weekNumber >= 5) },
    { week: 10, title: 'Mid-term Review', reached: studentReports.some(r => r.weekNumber && r.weekNumber >= 10) },
    { week: 15, title: 'Progress Check', reached: studentReports.some(r => r.weekNumber && r.weekNumber >= 15) },
    { week: 20, title: 'Final Evaluation', reached: studentReports.some(r => r.weekNumber && r.weekNumber >= 20) },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'reviewed':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'border-green-600';
      case 'reviewed':
        return 'border-blue-600';
      default:
        return 'border-orange-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Timeline</CardTitle>
        <CardDescription>Your industrial attachment journey</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Overall Progress</span>
            <span className="text-sm">{studentData?.progress || 0}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${studentData?.progress || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${
                milestone.reached
                  ? 'bg-green-50 border-green-600'
                  : 'bg-muted border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {milestone.reached ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/50" />
                )}
                <span className="text-xs font-medium">Week {milestone.week}</span>
              </div>
              <p className="text-xs text-foreground">{milestone.title}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {timelineItems.length > 0 ? (
            timelineItems.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Connector Line */}
                {index < timelineItems.length - 1 && (
                  <div className={`absolute left-2.5 top-10 w-0.5 h-full ${getStatusColor(item.status)} opacity-30`}></div>
                )}

                {/* Timeline Item */}
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${getStatusColor(item.status)} bg-white flex items-center justify-center`}>
                    {getStatusIcon(item.status)}
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="bg-muted rounded-lg p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h4 className="text-sm">{item.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Week {item.week} • {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.status === 'graded'
                              ? 'default'
                              : item.status === 'reviewed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>

                      {item.grade !== undefined && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Grade:</span>
                            <span className="text-sm font-medium text-green-600">
                              {item.grade}/100
                            </span>
                          </div>
                        </div>
                      )}

                      {item.feedback && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-foreground italic">"{item.feedback}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>No reports submitted yet</p>
              <p className="text-sm mt-1">Start by submitting your first report</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
