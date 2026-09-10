import { supabase } from '../supabase';

export interface IUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'student' | 'supervisor' | 'admin';
  department?: string;
  phone?: string;
  assignedSupervisorId?: string;
  otp?: string;
  otpExpiry?: Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  save: () => Promise<IUser>;
}

const mapRowToUser = (row: any): IUser => {
  const user: IUser = {
    id: row.id,
    _id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    department: row.department,
    phone: row.phone,
    assignedSupervisorId: row.assigned_supervisor_id,
    otp: row.otp,
    otpExpiry: row.otp_expiry ? new Date(row.otp_expiry) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    save: async function () {
      return await UserModel.findByIdAndUpdate(this.id, {
        otp: this.otp ?? null,
        otpExpiry: this.otpExpiry ?? null,
        name: this.name,
        phone: this.phone,
        department: this.department,
        assignedSupervisorId: this.assignedSupervisorId,
      }) as IUser;
    },
  };
  return user;
};

class UserQuery<T> implements PromiseLike<T> {
  private promise: Promise<T>;

  constructor(executor: () => Promise<T>) {
    this.promise = executor();
  }

  select(fields?: string): this {
    return this;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}

class UserModel {
  static findOne(query: { email?: string; [key: string]: any }): UserQuery<IUser | null> {
    return new UserQuery(async () => {
      let builder = supabase.from('users').select('*');
      if (query.email) {
        builder = builder.ilike('email', query.email.trim());
      }
      const { data, error } = await builder.limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      return mapRowToUser(data);
    });
  }

  static findById(id: string | any): UserQuery<IUser | null> {
    return new UserQuery(async () => {
      const cleanId = String(id || '');
      if (!cleanId) return null;
      const { data, error } = await supabase.from('users').select('*').eq('id', cleanId).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      return mapRowToUser(data);
    });
  }

  static async create(payload: Partial<IUser> & { passwordHash: string }): Promise<IUser> {
    const dbPayload: any = {
      name: payload.name,
      email: payload.email?.toLowerCase().trim(),
      password_hash: payload.passwordHash,
      role: payload.role || 'student',
      department: payload.department,
      phone: payload.phone,
      assigned_supervisor_id: payload.assignedSupervisorId || null,
      otp: payload.otp || null,
      otp_expiry: payload.otpExpiry ? new Date(payload.otpExpiry).toISOString() : null,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return mapRowToUser(data);
  }

  static find(query: { role?: string; assignedSupervisorId?: any } = {}): UserQuery<IUser[]> {
    return new UserQuery(async () => {
      let builder = supabase.from('users').select('*');

      if (query.role) {
        builder = builder.eq('role', query.role);
      }
      if (query.assignedSupervisorId) {
        builder = builder.eq('assigned_supervisor_id', String(query.assignedSupervisorId));
      }

      const { data, error } = await builder.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRowToUser);
    });
  }

  static findByIdAndUpdate(id: string | any, updates: any, options: { new?: boolean } = {}): UserQuery<IUser | null> {
    return new UserQuery(async () => {
      const cleanId = String(id || '');
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.assignedSupervisorId !== undefined) dbUpdates.assigned_supervisor_id = updates.assignedSupervisorId;
      if (updates.otp !== undefined) dbUpdates.otp = updates.otp;
      if (updates.otpExpiry !== undefined) {
        dbUpdates.otp_expiry = updates.otpExpiry ? new Date(updates.otpExpiry).toISOString() : null;
      }

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', cleanId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapRowToUser(data);
    });
  }

  static async findByIdAndDelete(id: string | any) {
    const cleanId = String(id || '');
    const { error } = await supabase.from('users').delete().eq('id', cleanId);
    if (error) throw error;
    return { success: true };
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default UserModel;
