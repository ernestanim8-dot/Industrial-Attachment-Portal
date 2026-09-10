import { supabase } from '../supabase';

export interface IAssumption {
  id: string;
  _id: string;
  studentId: string;
  studentName: string;
  submittedAt: string | Date;
  status: 'pending' | 'approved' | 'rejected';
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  companyZone?: string;
  companyLocation?: string;
  companyAddress?: string;
  companySupervisor?: string;
  letterAddressedTo?: string;
  companyTown?: string;
  dateOfCommencement?: string;
  supervisorPhone?: string;
  studentSignature?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToAssumption = (row: any): IAssumption => ({
  id: row.id,
  _id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  submittedAt: row.submitted_at,
  status: row.status,
  companyName: row.company_name,
  companyPhone: row.company_phone,
  companyEmail: row.company_email,
  companyZone: row.company_zone,
  companyLocation: row.company_location,
  companyAddress: row.company_address,
  companySupervisor: row.company_supervisor,
  letterAddressedTo: row.letter_addressed_to,
  companyTown: row.company_town,
  dateOfCommencement: row.date_of_commencement,
  supervisorPhone: row.supervisor_phone,
  studentSignature: row.student_signature,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class AssumptionModel {
  static async create(payload: any) {
    const dbPayload = {
      student_id: payload.studentId?.toString() || payload.studentId,
      student_name: payload.studentName,
      submitted_at: payload.submittedAt ? new Date(payload.submittedAt).toISOString() : new Date().toISOString(),
      status: payload.status || 'pending',
      company_name: payload.companyName,
      company_phone: payload.companyPhone,
      company_email: payload.companyEmail,
      company_zone: payload.companyZone,
      company_location: payload.companyLocation,
      company_address: payload.companyAddress,
      company_supervisor: payload.companySupervisor,
      letter_addressed_to: payload.letterAddressedTo,
      company_town: payload.companyTown,
      date_of_commencement: payload.dateOfCommencement,
      supervisor_phone: payload.supervisorPhone,
      student_signature: payload.studentSignature,
    };

    const { data, error } = await supabase.from('assumptions').insert(dbPayload).select().single();
    if (error) throw error;
    return mapRowToAssumption(data);
  }

  static find(query: any = {}) {
    return {
      sort: async function (sortObj: any = { createdAt: -1 }) {
        let builder = supabase.from('assumptions').select('*');

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
        return (data || []).map(mapRowToAssumption);
      },
      then: async function (resolve: (data: IAssumption[]) => void, reject: (err: any) => void) {
        try {
          const res = await this.sort();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static async findByIdAndUpdate(id: string | any, updates: any, options: { new?: boolean } = {}) {
    const cleanId = String(id || '');
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('assumptions')
      .update(dbUpdates)
      .eq('id', cleanId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRowToAssumption(data);
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('assumptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default AssumptionModel;
