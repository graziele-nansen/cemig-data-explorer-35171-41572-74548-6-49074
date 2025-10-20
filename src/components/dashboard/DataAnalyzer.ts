export interface ColumnInfo {
  name: string;
  type: 'date' | 'number' | 'string' | 'location' | 'status';
  values: any[];
  uniqueCount: number;
  min?: number;
  max?: number;
  avg?: number;
}

export interface AnalyzedData {
  columns: ColumnInfo[];
  dateColumns: string[];
  numberColumns: string[];
  statusColumns: string[];
  locationColumns: string[];
  totalRecords: number;
}

export const analyzeData = (data: any[]): AnalyzedData => {
  if (!data || data.length === 0) {
    return {
      columns: [],
      dateColumns: [],
      numberColumns: [],
      statusColumns: [],
      locationColumns: [],
      totalRecords: 0,
    };
  }

  const columns: ColumnInfo[] = [];
  const dateColumns: string[] = [];
  const numberColumns: string[] = [];
  const statusColumns: string[] = [];
  const locationColumns: string[] = [];

  const firstRow = data[0];
  Object.keys(firstRow).forEach((key) => {
    const values = data.map((row) => row[key]).filter((v) => v != null);
    const uniqueValues = [...new Set(values)];
    
    let type: ColumnInfo['type'] = 'string';
    let min, max, avg;

    // Detect location columns
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('lat') || lowerKey.includes('long') || lowerKey.includes('coord')) {
      type = 'location';
      locationColumns.push(key);
    }
    // Detect date columns
    else if (lowerKey.includes('data') || lowerKey.includes('date') || isDateColumn(values)) {
      type = 'date';
      dateColumns.push(key);
    }
    // Detect number columns
    else if (values.every((v) => !isNaN(Number(v)))) {
      type = 'number';
      numberColumns.push(key);
      const numbers = values.map(Number);
      min = Math.min(...numbers);
      max = Math.max(...numbers);
      avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    // Detect status columns
    else if (uniqueValues.length <= 10 && lowerKey.includes('status')) {
      type = 'status';
      statusColumns.push(key);
    }

    columns.push({
      name: key,
      type,
      values,
      uniqueCount: uniqueValues.length,
      min,
      max,
      avg,
    });
  });

  return {
    columns,
    dateColumns,
    numberColumns,
    statusColumns,
    locationColumns,
    totalRecords: data.length,
  };
};

const isDateColumn = (values: any[]): boolean => {
  const sample = values.slice(0, 10);
  return sample.some((v) => {
    if (!v) return false;
    const str = String(v);
    return /\d{2}\/\d{2}\/\d{4}/.test(str) || !isNaN(Date.parse(str));
  });
};

export const detectAnomalies = (data: any[], columnName: string): any[] => {
  const values = data.map((row) => Number(row[columnName])).filter((v) => !isNaN(v));
  if (values.length === 0) return [];

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
  );

  const threshold = 2 * stdDev;
  
  return data.filter((row) => {
    const value = Number(row[columnName]);
    return !isNaN(value) && Math.abs(value - mean) > threshold;
  });
};