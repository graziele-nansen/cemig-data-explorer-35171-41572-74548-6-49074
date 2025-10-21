import * as XLSX from 'xlsx';

export async function loadDCUData(): Promise<any[]> {
  try {
    const response = await fetch('/data/DCUS.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log('DCU data loaded:', data.length, 'records');
    return data;
  } catch (error) {
    console.error('Error loading DCU data:', error);
    return [];
  }
}
