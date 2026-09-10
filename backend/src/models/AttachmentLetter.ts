import { supabase } from '../supabase';

export interface IAttachmentLetter {
  id: string;
  _id: string;
  studentId: string;
  studentName: string;
  studentRegNo?: string;
  studentPhone?: string;
  department?: string;
  submittedAt: string | Date;
  status: 'pending' | 'approved' | 'rejected' | 'verified' | 'submitted' | 'pdf_generated';
  companyName: string;
  companyTown: string;
  companyAddress?: string;
  letterAddressedTo: string;
  studentSignature?: string;
  startDate?: string;
  endDate?: string;
  refNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToAttachmentLetter = (row: any): IAttachmentLetter => ({
  id: row.id,
  _id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  studentRegNo: row.student_reg_no,
  studentPhone: row.student_phone,
  department: row.department,
  submittedAt: row.submitted_at,
  status: row.status,
  companyName: row.company_name,
  companyTown: row.company_town,
  companyAddress: row.company_address,
  letterAddressedTo: row.letter_addressed_to,
  studentSignature: row.student_signature,
  startDate: row.start_date,
  endDate: row.end_date,
  refNumber: row.ref_number,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class AttachmentLetterModel {
  static async create(payload: any) {
    const dbPayload = {
      student_id: payload.studentId?.toString() || payload.studentId,
      student_name: payload.studentName,
      student_reg_no: payload.studentRegNo,
      student_phone: payload.studentPhone,
      department: payload.department,
      submitted_at: payload.submittedAt ? new Date(payload.submittedAt).toISOString() : new Date().toISOString(),
      status: payload.status || 'pending',
      company_name: payload.companyName,
      company_town: payload.companyTown,
      company_address: payload.companyAddress,
      letter_addressed_to: payload.letterAddressedTo,
      student_signature: payload.studentSignature,
      start_date: payload.startDate,
      end_date: payload.endDate,
      ref_number: payload.refNumber,
    };

    const { data, error } = await supabase.from('attachment_letters').insert(dbPayload).select().single();
    if (error) throw error;
    return mapRowToAttachmentLetter(data);
  }

  static find(query: any = {}) {
    return {
      sort: async function (sortObj: any = { createdAt: -1 }) {
        let builder = supabase.from('attachment_letters').select('*');

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
        return (data || []).map(mapRowToAttachmentLetter);
      },
      then: async function (resolve: (data: IAttachmentLetter[]) => void, reject: (err: any) => void) {
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
      .from('attachment_letters')
      .update(dbUpdates)
      .eq('id', cleanId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRowToAttachmentLetter(data);
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('attachment_letters').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default AttachmentLetterModel;
