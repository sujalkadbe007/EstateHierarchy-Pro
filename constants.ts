
import { Employee } from './types';

export const MAX_STAGES = 6;
export const MIN_REPORTS = 5;

export const INITIAL_OWNER: Employee = {
  id: 'owner-001',
  name: 'Alexander Sterling',
  role: 'Company Owner',
  level: 0,
  parentId: null,
  totalSales: 0,
  commissionsEarned: 0,
  dateJoined: new Date().toISOString(),
  childrenIds: []
};

export const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-indigo-600',
  1: 'bg-blue-600',
  2: 'bg-emerald-600',
  3: 'bg-teal-600',
  4: 'bg-cyan-600',
  5: 'bg-sky-600',
  6: 'bg-gray-600',
};
