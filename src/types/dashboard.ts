export interface ExcelFile {
  id: string;
  name: string;
  data: ExcelData[];
  uploadedAt: Date;
}

export interface ExcelData {
  [key: string]: any;
  latitude?: number;
  longitude?: number;
}

export interface DashboardStats {
  totalRecords: number;
  avgValue: number;
  maxValue: number;
  minValue: number;
}
