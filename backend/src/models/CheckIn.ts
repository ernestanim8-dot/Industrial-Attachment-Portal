import { supabase } from '../supabase';

export interface ICheckIn {
  id: string;
  _id: string;
  studentId: string;
  studentName: string;
  timestamp: string | Date;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  status: 'verified_on_site' | 'off_site';
  distanceFromAssignedKm?: number;
  notes?: string;
  createdAt?: string | Date;
}

const mapRowToCheckIn = (row: any): ICheckIn => ({
  id: row.id,
  _id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  timestamp: row.timestamp,
  date: row.date,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  address: row.address,
  city: row.city,
  status: row.status,
  distanceFromAssignedKm: row.distance_from_assigned_km != null ? Number(row.distance_from_assigned_km) : undefined,
  notes: row.notes,
  createdAt: row.created_at,
});

class CheckInModel {
  static async create(payload: any) {
    const dbPayload = {
      student_id: payload.studentId?.toString() || payload.studentId,
      student_name: payload.studentName,
      timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
      date: payload.date,
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      address: payload.address,
      city: payload.city,
      status: payload.status || 'verified_on_site',
      distance_from_assigned_km: payload.distanceFromAssignedKm != null ? Number(payload.distanceFromAssignedKm) : null,
      notes: payload.notes,
    };

    const { data, error } = await supabase.from('check_ins').insert(dbPayload).select().single();
    if (error) throw error;
    return mapRowToCheckIn(data);
  }

  static find(query: any = {}) {
    return {
      sort: async function (sortObj: any = { timestamp: -1 }) {
        let builder = supabase.from('check_ins').select('*');

        if (query.studentId) {
          if (typeof query.studentId === 'object' && query.studentId.$in) {
            const ids = query.studentId.$in.map((id: any) => id?.toString ? id.toString() : id);
            if (ids.length === 0) return [];
            builder = builder.in('student_id', ids);
          } else {
            builder = builder.eq('student_id', query.studentId.toString());
          }
        }

        builder = builder.order('timestamp', { ascending: false });

        const { data, error } = await builder;
        if (error) throw error;
        return (data || []).map(mapRowToCheckIn);
      },
      then: async function (resolve: (data: ICheckIn[]) => void, reject: (err: any) => void) {
        try {
          const res = await this.sort();
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('check_ins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default CheckInModel;
