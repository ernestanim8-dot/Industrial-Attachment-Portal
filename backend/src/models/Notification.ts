import { supabase } from '../supabase';

export interface INotification {
  id: string;
  _id: string;
  recipientId: string;
  message: string;
  type: 'report_submitted' | 'report_graded' | 'report_reviewed' | 'supervisor_assigned' | 'system' | 'info';
  read: boolean;
  link?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToNotification = (row: any): INotification => ({
  id: row.id,
  _id: row.id,
  recipientId: row.recipient_id,
  message: row.message,
  type: row.type,
  read: row.read,
  link: row.link,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class NotificationModel {
  static async create(payload: any) {
    const dbPayload = {
      recipient_id: payload.recipientId?.toString() || payload.recipientId,
      message: payload.message,
      type: payload.type || 'system',
      read: payload.read ?? false,
      link: payload.link,
    };

    const { data, error } = await supabase.from('notifications').insert(dbPayload).select().single();
    if (error) throw error;
    return mapRowToNotification(data);
  }

  static find(query: { recipientId?: any } = {}) {
    let limitCount = 50;
    return {
      sort: function (sortObj: any = { createdAt: -1 }) {
        return this;
      },
      limit: function (n: number) {
        limitCount = n;
        return this;
      },
      then: async function (resolve: (data: INotification[]) => void, reject: (err: any) => void) {
        try {
          let builder = supabase.from('notifications').select('*');
          if (query.recipientId) {
            builder = builder.eq('recipient_id', query.recipientId.toString());
          }
          builder = builder.order('created_at', { ascending: false }).limit(limitCount);

          const { data, error } = await builder;
          if (error) throw error;
          resolve((data || []).map(mapRowToNotification));
        } catch (e) {
          reject(e);
        }
      }
    };
  }

  static async countDocuments(query: { recipientId?: any; read?: boolean } = {}) {
    let builder = supabase.from('notifications').select('*', { count: 'exact', head: true });
    if (query.recipientId) {
      builder = builder.eq('recipient_id', query.recipientId.toString());
    }
    if (query.read !== undefined) {
      builder = builder.eq('read', query.read);
    }
    const { count, error } = await builder;
    if (error) throw error;
    return count || 0;
  }

  static async findOneAndUpdate(filter: { _id?: string | any; id?: string | any; recipientId?: any }, updates: any, options: { new?: boolean } = {}) {
    const targetId = String(filter._id || filter.id || '');
    if (!targetId) return null;

    let builder = supabase.from('notifications').update({ read: updates.read }).eq('id', targetId);
    if (filter.recipientId) {
      builder = builder.eq('recipient_id', filter.recipientId.toString());
    }
    const { data, error } = await builder.select().maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapRowToNotification(data);
  }

  static async updateMany(filter: { recipientId?: any; read?: boolean }, updates: any) {
    let builder = supabase.from('notifications').update({ read: updates.read });
    if (filter.recipientId) {
      builder = builder.eq('recipient_id', filter.recipientId.toString());
    }
    if (filter.read !== undefined) {
      builder = builder.eq('read', filter.read);
    }
    const { error } = await builder;
    if (error) throw error;
    return { acknowledged: true };
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default NotificationModel;
