import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function StudentGrades() {
  const { reports, students } = useData();
  const { user } = useAuth();

  // Find the current student based on auth user
  const currentStudent = students.find(s => s.id === user?.id);

  const studentReports = reports.filter(r => r.studentId === currentStudent?.id);
  const gradedReports = studentReports.filter(r => r.status === 'graded');
  const avgGrade = gradedReports.length > 0
    ? Math.round(gradedReports.reduce((acc, r) => acc + (r.grade || 0), 0) / gradedReports.length)
    : 0;

  const getCategory = (grade: number) => {
    if (grade >= 80) return { label: 'Good', color: 'bg-green-100 text-green-800' };
    if (grade >= 50) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Bad', color: 'bg-red-100 text-red-800' };
  };

  const category = getCategory(avgGrade);

  return (
    <DashboardLayout title="Grade Overview">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Your Overall Grade</CardTitle>
            <CardDescription className="text-3xl font-bold mt-2">
              {avgGrade > 0 ? `${avgGrade}%` : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`inline-block px-4 py-2 rounded ${category.color} mt-4 font-medium`}> {category.label} </div>
          </CardContent>
        </Card>
        <Link to="/student" className="block mt-4">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
