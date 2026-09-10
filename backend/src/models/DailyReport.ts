import { supabase } from '../supabase';

export interface IDailyReport {
  id: string;
  _id: string;
  studentId: string;
  studentName: string;
  date: string;
  dayOfWeek: string;
  weekNumber: number;
  monthNumber: number;
  monthName: string;
  title: string;
  tasksCompleted: string;
  skillsAcquired?: string;
  challengesFaced?: string;
  hoursWorked: number;
  equipmentOrTools?: string;
  submittedAt: string | Date;
  status: 'submitted' | 'reviewed' | 'graded';
  grade?: number;
  feedback?: string;
  locationVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToDailyReport = (row: any): IDailyReport => ({
  id: row.id,
  _id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  date: row.date,
  dayOfWeek: row.day_of_week,
  weekNumber: Number(row.week_number),
  monthNumber: Number(row.month_number),
  monthName: row.month_name,
  title: row.title,
  tasksCompleted: row.tasks_completed,
  skillsAcquired: row.skills_acquired,
  challengesFaced: row.challenges_faced,
  hoursWorked: Number(row.hours_worked ?? 8),
  equipmentOrTools: row.equipment_or_tools,
  submittedAt: row.submitted_at,
  status: row.status,
  grade: row.grade != null ? Number(row.grade) : undefined,
  feedback: row.feedback,
  locationVerified: row.location_verified ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapDailyReportToRow = (payload: any) => ({
  student_id: payload.studentId?.toString() || payload.student_id,
  student_name: payload.studentName || payload.student_name,
  date: payload.date,
  day_of_week: payload.dayOfWeek || payload.day_of_week,
  week_number: Number(payload.weekNumber || payload.week_number),
  month_number: Number(payload.monthNumber || payload.month_number),
  month_name: payload.monthName || payload.month_name,
  title: payload.title,
  tasks_completed: payload.tasksCompleted || payload.tasks_completed,
  skills_acquired: payload.skillsAcquired || payload.skills_acquired,
  challenges_faced: payload.challengesFaced || payload.challenges_faced,
  hours_worked: Number(payload.hoursWorked || payload.hours_worked || 8),
  equipment_or_tools: payload.equipmentOrTools || payload.equipment_or_tools,
  submitted_at: payload.submittedAt ? new Date(payload.submittedAt).toISOString() : new Date().toISOString(),
  status: payload.status || 'submitted',
  grade: payload.grade != null ? Number(payload.grade) : null,
  feedback: payload.feedback,
  location_verified: payload.locationVerified ?? true,
});

class DailyReportModel {
  static async create(payload: any[]): Promise<IDailyReport[]>;
  static async create(payload: any): Promise<IDailyReport>;
  static async create(payload: any | any[]): Promise<IDailyReport | IDailyReport[]> {
    if (Array.isArray(payload)) {
      const rows = payload.map(mapDailyReportToRow);
      const { data, error } = await supabase.from('daily_reports').insert(rows).select();
      if (error) throw error;
      return (data || []).map(mapRowToDailyReport);
    }

    const row = mapDailyReportToRow(payload);
    const { data, error } = await supabase.from('daily_reports').insert(row).select().single();
    if (error) throw error;
    return mapRowToDailyReport(data);
  }

  static find(query: any = {}) {
    return {
      sort: async function (sortObj: any = { date: -1, createdAt: -1 }) {
        let builder = supabase.from('daily_reports').select('*');

        if (query.studentId) {
          if (typeof query.studentId === 'object' && query.studentId.$in) {
            const ids = query.studentId.$in.map((id: any) => id?.toString ? id.toString() : id);
            if (ids.length === 0) return [];
            builder = builder.in('student_id', ids);
          } else {
            builder = builder.eq('student_id', query.studentId.toString());
          }
        }

        builder = builder.order('date', { ascending: false });

        const { data, error } = await builder;
        if (error) throw error;
        return (data || []).map(mapRowToDailyReport);
      },
      then: async function (resolve: (data: IDailyReport[]) => void, reject: (err: any) => void) {
        try {
          const res = await this.sort();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static async findById(id: string | any) {
    const cleanId = String(id || '');
    const { data, error } = await supabase.from('daily_reports').select('*').eq('id', cleanId).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return mapRowToDailyReport(data);
  }

  static async findByIdAndUpdate(id: string | any, updates: any, options: { new?: boolean } = {}) {
    const cleanId = String(id || '');
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
    if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback;

    const { data, error } = await supabase
      .from('daily_reports')
      .update(dbUpdates)
      .eq('id', cleanId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRowToDailyReport(data);
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default DailyReportModel;
