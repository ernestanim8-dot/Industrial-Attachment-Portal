import { supabase } from '../supabase';

export interface ILocation {
  id: string;
  _id: string;
  name: string;
  zone: string;
  city: string;
  address: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  latitude: number;
  longitude: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const mapRowToLocation = (row: any): ILocation => {
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    zone: row.zone,
    city: row.city,
    address: row.address,
    description: row.description,
    contactPerson: row.contact_person,
    contactPhone: row.contact_phone,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapLocationToRow = (payload: any) => ({
  name: payload.name,
  zone: payload.zone,
  city: payload.city,
  address: payload.address,
  description: payload.description,
  contact_person: payload.contactPerson || payload.contact_person,
  contact_phone: payload.contactPhone || payload.contact_phone,
  latitude: Number(payload.latitude),
  longitude: Number(payload.longitude),
});

class LocationModel {
  static async create(payload: any[]): Promise<ILocation[]>;
  static async create(payload: any): Promise<ILocation>;
  static async create(payload: any | any[]): Promise<ILocation | ILocation[]> {
    if (Array.isArray(payload)) {
      const rows = payload.map(mapLocationToRow);
      const { data, error } = await supabase.from('locations').insert(rows).select();
      if (error) throw error;
      return (data || []).map(mapRowToLocation);
    }

    const row = mapLocationToRow(payload);
    const { data, error } = await supabase.from('locations').insert(row).select().single();
    if (error) throw error;
    return mapRowToLocation(data);
  }

  static find(query: any = {}) {
    return {
      sort: async function (sortObj: any = { createdAt: -1 }) {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToLocation);
      },
      then: async function (resolve: (data: ILocation[]) => void, reject: (err: any) => void) {
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
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return mapRowToLocation(data);
  }

  static async findByIdAndUpdate(id: string | any, updates: any, options: { new?: boolean } = {}) {
    const cleanId = String(id || '');
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.zone !== undefined) dbUpdates.zone = updates.zone;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
    if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
    if (updates.latitude !== undefined) dbUpdates.latitude = Number(updates.latitude);
    if (updates.longitude !== undefined) dbUpdates.longitude = Number(updates.longitude);

    const { data, error } = await supabase
      .from('locations')
      .update(dbUpdates)
      .eq('id', cleanId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRowToLocation(data);
  }

  static async findByIdAndDelete(id: string | any) {
    const cleanId = String(id || '');
    const { data, error } = await supabase
      .from('locations')
      .delete()
      .eq('id', cleanId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRowToLocation(data);
  }

  static async deleteMany(query: any = {}) {
    const { error } = await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    return { acknowledged: true };
  }
}

export default LocationModel;
