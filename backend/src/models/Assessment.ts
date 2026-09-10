import { supabase } from '../supabase';

export interface IAssessment {
  id: string;
  _id: string;
  reportId: any;
  supervisorId: any;
  feedback: string;
  grade: number;
  criteria: {
    content: number;
    presentation: number;
    understanding: number;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToAssessment = (row: any): IAssessment => {
  const supervisor = row.users ? {
    id: row.users.id,
    _id: row.users.id,
    name: row.users.name,
    email: row.users.email,
  } : row.supervisor_id;

  return {
    id: row.id,
    _id: row.id,
    reportId: row.report_id,
    supervisorId: supervisor,
    feedback: row.feedback,
    grade: Number(row.grade),
    criteria: row.criteria || { content: 0, presentation: 0, understanding: 0 },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

class AssessmentModel {
  static async create(payload: any) {
    const dbPayload: any = {
      report_id: payload.reportId?.toString() || payload.reportId,
      supervisor_id: payload.supervisorId?.toString() || payload.supervisorId,
      feedback: payload.feedback,
      grade: payload.grade,
      criteria: payload.criteria || { content: 0, presentation: 0, understanding: 0 },
    };

    const { data, error } = await supabase
      .from('assessments')
      .insert(dbPayload)
      .select('*, users:supervisor_id(id, name, email)')
      .single();

    if (error) throw error;
    return mapRowToAssessment(data);
  }

  static find(query: any = {}) {
    return {
      populate: async function (field: string, selectFields?: string) {
        let builder = supabase
          .from('assessments')
          .select('*, users:supervisor_id(id, name, email)');

        if (query.reportId) {
          builder = builder.eq('report_id', query.reportId.toString());
        }

        builder = builder.order('created_at', { ascending: false });

        const { data, error } = await builder;
        if (error) throw error;
        return (data || []).map(mapRowToAssessment);
      },
      then: async function (resolve: (data: IAssessment[]) => void, reject: (err: any) => void) {
        try {
          const res = await this.populate('supervisorId');
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default AssessmentModel;
