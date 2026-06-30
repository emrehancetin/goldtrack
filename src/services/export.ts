import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getAllBars } from './database';

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export async function exportBarsToExcel(): Promise<void> {
  const bars = await getAllBars();

  const rows = bars.map((bar, index) => ({
    Sıra: index + 1,
    'Seri Numarası': bar.serial_number,
    'Ağırlık (g)': bar.weight_g,
    Marka: bar.brand ?? '',
    'Kimden Geldi': bar.received_from,
    'Kayıt Tarihi': formatDate(bar.created_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok');

  const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

  const file = new File(Paths.cache, `goldtrack_export_${dateStr}.xlsx`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(new Uint8Array(wbout));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Stok Listesini Paylaş',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}
