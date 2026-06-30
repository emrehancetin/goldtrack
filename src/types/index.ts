export interface GoldBar {
  id: string;
  serial_number: string;
  weight_g: number;
  brand: string | null;
  received_from: string;
  notes: string | null;
  created_at: string;
  image_url: string | null;
}

export type InsertBar = Omit<GoldBar, 'id' | 'created_at'>;

export interface Supplier {
  id: string;
  name: string;
  created_at: string;
}

export interface Sale {
  id: string;
  serial_number: string;
  weight_g: number;
  brand: string | null;
  received_from: string;
  sold_to: string;
  sale_note: string | null;
  created_at: string;
  sold_at: string;
}

export interface OcrResult {
  serial_number: string;
  weight_g: number;
  brand: string;
}
