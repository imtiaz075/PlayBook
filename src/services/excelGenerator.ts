import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  data: Record<string, unknown>[];
}

export function exportToExcel(filename: string, sheets: SheetData[]): void {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)); // max sheet name length is 31
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
