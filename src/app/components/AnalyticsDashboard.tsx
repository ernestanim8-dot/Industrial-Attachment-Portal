import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { TrendingUp, Users, FileText, Award } from 'lucide-react';

type WeeklyAggregate = {
  week: number;
  avgGrade: number;
  totalGrade: number;
  count: number;
};

type DepartmentCount = {
  name: string;
  value: number;
};

export function AnalyticsDashboard() {
  const { reports, students } = useData();

  // Performance trend data
  const performanceTrend = reports
    .filter(r => r.grade !== undefined)
    .reduce((acc: WeeklyAggregate[], report) => {
      const week = report.weekNumber || 0;
      const existing = acc.find(item => item.week === week);
      if (existing) {
        existing.totalGrade += report.grade!;
        existing.count += 1;
        existing.avgGrade = Math.round(existing.totalGrade / existing.count);
      } else {
        acc.push({
          week,
          avgGrade: report.grade || 0,
          totalGrade: report.grade || 0,
          count: 1,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.week - b.week)
    .map(item => ({
      name: `Week ${item.week}`,
      grade: item.avgGrade,
    }));

  // Report status distribution
  const statusData = [
    { name: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: '#f97316' },
    { name: 'Reviewed', value: reports.filter(r => r.status === 'reviewed').length, color: '#3b82f6' },
    { name: 'Graded', value: reports.filter(r => r.status === 'graded').length, color: '#22c55e' },
  ];

  // Student performance data
  const studentPerformance = students.map(student => {
    const studentReports = reports.filter(r => r.studentId === student.id && r.grade !== undefined);
    const avgGrade = studentReports.length > 0
      ? Math.round(studentReports.reduce((sum, r) => sum + (r.grade || 0), 0) / studentReports.length)
      : 0;
    return {
      name: student.name.split(' ')[0], // First name only for chart
      grade: avgGrade,
      reports: studentReports.length,
    };
  }).filter(s => s.grade > 0);

  // Department distribution
  const departmentData = students.reduce((acc: DepartmentCount[], student) => {
    const existing = acc.find(item => item.name === student.department);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: student.department || 'General', value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{students.length}</div>
            <p className="text-xs text-gray-600">Active attachments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">No.of Reports Uploaded</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{reports.length}</div>
            <p className="text-xs text-gray-600">All submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Grade</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {reports.filter(r => r.grade).length > 0
                ? Math.round(
                    reports.filter(r => r.grade).reduce((sum, r) => sum + (r.grade || 0), 0) /
                      reports.filter(r => r.grade).length
                  )
                : 0}
            </div>
            <p className="text-xs text-gray-600">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {Math.round((students.reduce((sum, s) => sum + s.progress, 0) / students.length) || 0)}%
            </div>
            <p className="text-xs text-gray-600">Average progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Average grades by week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="grade" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Report Status</CardTitle>
            <CardDescription>Distribution of report statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Average grades per student</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="grade" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Students by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
