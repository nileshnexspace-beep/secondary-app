
export type Category = 
  | 'Office Sale' 
  | 'Office Lease' 
  | 'Showroom Sale' 
  | 'Showroom Lease' 
  | 'Apartment Sale' 
  | 'Apartment Rent' 
  | 'Bunglow Sale' 
  | 'Bunglow Rent'
  | 'Penthouse Rent'
  | 'Duplex Rent';

export type Source = 'Owner' | 'Broker';

export interface InventoryLog {
  id: string;
  date: string;
  category: Category;
  source: Source;
  count: number;
  recordedBy: string;
}

export interface DailyAggregation {
  date: string;
  [key: string]: string | number;
}
