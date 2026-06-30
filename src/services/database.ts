import { supabase } from './supabase';
import type { GoldBar, InsertBar, Sale, Supplier } from '../types';

export async function getAllBars(): Promise<GoldBar[]> {
  const { data, error } = await supabase
    .from('gold_bars')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function checkSerialExists(serial: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('gold_bars')
    .select('id')
    .eq('serial_number', serial)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function insertBar(bar: InsertBar): Promise<void> {
  const { error } = await supabase.from('gold_bars').insert(bar);
  if (error) throw error;
}

export async function deleteBar(id: string): Promise<void> {
  const { error } = await supabase.from('gold_bars').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertSupplier(name: string): Promise<void> {
  const { error } = await supabase.from('suppliers').insert({ name });
  if (error) throw error;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

export async function sellBar(
  bar: GoldBar,
  soldTo: string,
  saleNote: string | null
): Promise<void> {
  const { error: insertError } = await supabase.from('sales').insert({
    serial_number: bar.serial_number,
    weight_g: bar.weight_g,
    brand: bar.brand,
    received_from: bar.received_from,
    sold_to: soldTo,
    sale_note: saleNote,
    created_at: bar.created_at,
  });
  if (insertError) throw insertError;

  const { error: deleteError } = await supabase
    .from('gold_bars')
    .delete()
    .eq('id', bar.id);
  if (deleteError) throw deleteError;
}

export async function getAllSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sold_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

export async function supplierHasBars(name: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('gold_bars')
    .select('id')
    .eq('received_from', name)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
