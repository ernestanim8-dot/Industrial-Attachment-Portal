import { supabase } from '../supabase';

export interface IReport {
  id: string;
  _id: string;
  studentId: any;
  title: string;
  description: string;
  fileUrl: string;
  type: 'weekly' | 'monthly' | 'final';
  status: 'pending' | 'reviewed' | 'graded';
  weekNumber?: number;
  grade?: number;
  fileName?: string;
  fileSize?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToReport = (row: any): IReport => {
  const student = row.users ? {
    id: row.users.id,
    _id: row.users.id,
    name: row.users.name,
    email: row.users.email,
    assignedSupervisorId: row.users.assigned_supervisor_id,
  } : row.student_id;

  return {
    id: row.id,
    _id: row.id,
    studentId: student,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    type: row.type,
    status: row.status,
    weekNumber: row.week_number,
    grade: row.grade,
    fileName: row.file_name,
    fileSize: row.file_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

class ReportModel {
  static async create(payload: any) {
    const dbPayload: any = {
      student_id: payload.studentId?.toString() || payload.studentId,
      title: payload.title,
      description: payload.description,
      file_url: payload.fileUrl,
      file_name: payload.fileName,
      file_size: payload.fileSize,
      type: payload.type || 'weekly',
      status: payload.status || 'pending',
      week_number: payload.weekNumber,
      grade: payload.grade,
    };

    const { data, error } = await supabase
      .from('reports')
      .insert(dbPayload)
      .select('*, users:student_id(id, name, email, assigned_supervisor_id)')
      .single();

    if (error) throw error;
    return mapRowToReport(data);
  }

  static find(query: any = {}) {
    return {
      populate: function (field: string, selectFields?: string) {
        return this;
      },
      sort: async function (sortObj: any = { createdAt: -1 }) {
        let builder = supabase
          .from('reports')
          .select('*, users:student_id(id, name, email, assigned_supervisor_id)');

        if (query.studentId) {
          if (typeof query.studentId === 'object' && query.studentId.$in) {
            const ids = query.studentId.$in.map((id: any) => id?.toString ? id.toString() : id);
            if (ids.length === 0) return [];
            builder = builder.in('student_id', ids);
          } else {
            builder = builder.eq('student_id', query.studentId.toString());
          }
        }

        builder = builder.order('created_at', { ascending: false });

        const { data, error } = await builder;
        if (error) throw error;
        return (data || []).map(mapRowToReport);
      },
      then: async function (resolve: (data: IReport[]) => void, reject: (err: any) => void) {
        try {
          const res = await this.sort();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static findById(id: string | any) {
    const cleanId = String(id || '');
    return {
      populate: async function (field: string, selectFields?: string) {
        const { data, error } = await supabase
          .from('reports')
          .select('*, users:student_id(id, name, email, assigned_supervisor_id)')
          .eq('id', cleanId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return null;
        return mapRowToReport(data);
      },
      then: async function (resolve: (data: IReport | null) => void, reject: (err: any) => void) {
        try {
          const res = await this.populate('studentId');
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static findByIdAndUpdate(id: string | any, updates: any, options: { new?: boolean } = {}) {
    const cleanId = String(id || '');
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.weekNumber !== undefined) dbUpdates.week_number = updates.weekNumber;

    return {
      populate: async function (field?: string, selectFields?: string) {
        const { data, error } = await supabase
          .from('reports')
          .update(dbUpdates)
          .eq('id', cleanId)
          .select('*, users:student_id(id, name, email, assigned_supervisor_id)')
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        return mapRowToReport(data);
      },
      then: async function (resolve: (data: IReport | null) => void, reject: (err: any) => void) {
        try {
          const res = await this.populate();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default ReportModel;
