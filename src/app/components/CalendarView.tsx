import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { useData } from '../context/DataContext';
import { format, addWeeks, isSameDay } from 'date-fns';
import { CalendarDays, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function CalendarView() {
  const { reports, students } = useData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Generate deadline dates
  const deadlines = students.flatMap(student => {
    if (!student.attachmentStartDate) return [];

    const startDate = new Date(student.attachmentStartDate);
    const deadlinesList = [];

    // Generate weekly deadlines for 20 weeks
    for (let i = 1; i <= 20; i++) {
      const deadline = addWeeks(startDate, i);
      const weekReports = reports.filter(
        r => r.studentId === student.id && r.weekNumber === i
      );

      deadlinesList.push({
        date: deadline,
        week: i,
        studentId: student.id,
        studentName: student.name,
        submitted: weekReports.length > 0,
        report: weekReports[0],
      });
    }

    return deadlinesList;
  });

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? deadlines.filter(d => isSameDay(d.date, selectedDate))
    : [];

  // Get upcoming deadlines (next 7 days)
  const today = new Date();
  const upcomingDeadlines = deadlines
    .filter(d => d.date >= today && d.date <= addWeeks(today, 1) && !d.submitted)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const modifiers = {
    deadline: deadlines.map(d => d.date),
    submitted: deadlines.filter(d => d.submitted).map(d => d.date),
    pending: deadlines.filter(d => !d.submitted && d.date >= today).map(d => d.date),
    overdue: deadlines.filter(d => !d.submitted && d.date < today).map(d => d.date),
  };

  const modifiersStyles = {
    submitted: { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' },
    pending: { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' },
    overdue: { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Submission Calendar</CardTitle>
          <CardDescription>Track report deadlines and submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100"></div>
              <span>Submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100"></div>
              <span>Overdue</span>
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDateEvents.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm mb-3">
                Events on {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {selectedDateEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {event.submitted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : event.date < today ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-600" />
                      )}
                      <div>
                        <p className="text-sm">{event.studentName} - Week {event.week}</p>
                        {event.report && (
                          <p className="text-xs text-muted-foreground">{event.report.title}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={event.submitted ? 'default' : event.date < today ? 'destructive' : 'secondary'}
                    >
                      {event.submitted ? 'Submitted' : event.date < today ? 'Overdue' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm">{deadline.studentName}</p>
                      <p className="text-xs text-muted-foreground">Week {deadline.week} Report</p>
                    </div>
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {format(deadline.date, 'MMM d, yyyy')}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.ceil((deadline.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
