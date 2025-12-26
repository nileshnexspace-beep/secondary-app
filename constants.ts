
import { Category, InventoryLog } from './types';

export const CATEGORIES: Category[] = [
  'Office Sale',
  'Office Lease',
  'Showroom Sale',
  'Showroom Lease',
  'Apartment Sale',
  'Apartment Rent',
  'Bunglow Sale',
  'Bunglow Rent',
  'Penthouse Rent',
  'Duplex Rent'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Office Sale': '#3b82f6',
  'Office Lease': '#60a5fa',
  'Showroom Sale': '#10b981',
  'Showroom Lease': '#34d399',
  'Apartment Sale': '#f59e0b',
  'Apartment Rent': '#fbbf24',
  'Bunglow Sale': '#8b5cf6',
  'Bunglow Rent': '#a78bfa',
  'Penthouse Rent': '#ec4899',
  'Duplex Rent': '#f43f5e',
};

// Initial data provided by user
const baselineDate = '2024-05-20'; // Starting baseline date

const ownerData: Record<Category, number> = {
  'Showroom Sale': 305,
  'Showroom Lease': 1274,
  'Office Sale': 290,
  'Office Lease': 487,
  'Bunglow Sale': 247,
  'Bunglow Rent': 31,
  'Apartment Sale': 296,
  'Apartment Rent': 81,
  'Penthouse Rent': 2,
  'Duplex Rent': 3
};

const brokerData: Record<Category, number> = {
  'Showroom Sale': 42,
  'Showroom Lease': 54,
  'Office Sale': 76,
  'Office Lease': 147,
  'Bunglow Sale': 168,
  'Bunglow Rent': 27,
  'Apartment Sale': 137,
  'Apartment Rent': 147,
  'Penthouse Rent': 5,
  'Duplex Rent': 0
};

const createInitialLogs = (): InventoryLog[] => {
  const logs: InventoryLog[] = [];
  
  Object.entries(ownerData).forEach(([cat, count], index) => {
    if (count > 0) {
      logs.push({
        id: `baseline-owner-${index}`,
        date: baselineDate,
        category: cat as Category,
        source: 'Owner',
        count,
        recordedBy: 'System Baseline'
      });
    }
  });

  Object.entries(brokerData).forEach(([cat, count], index) => {
    if (count > 0) {
      logs.push({
        id: `baseline-broker-${index}`,
        date: baselineDate,
        category: cat as Category,
        source: 'Broker',
        count,
        recordedBy: 'System Baseline'
      });
    }
  });

  return logs;
};

export const INITIAL_LOGS = createInitialLogs();
