import * as XLSX from 'xlsx';

export async function loadDCUData(): Promise<any[]> {
  try {
    // Google Sheets ID extraído do link fornecido
    const sheetId = '1k5CmUWiCf3KVuewsvSlkTvUQMY57S2Y0';
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    
    const response = await fetch(exportUrl);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log('DCU data loaded from Google Sheets:', data.length, 'records');
    return data;
  } catch (error) {
    console.error('Error loading DCU data from Google Sheets:', error);
    return [];
  }
}
