
export interface Employee {
  id: string;
  name: string;
  role: string;
  level: number;
  parentId: string | null;
  totalSales: number;
  commissionsEarned: number;
  dateJoined: string;
  childrenIds: string[];
}

export interface SaleRecord {
  id: string;
  sellerId: string;
  amount: number;
  date: string;
  plotName: string;
  commissionBreakdown: CommissionPart[];
}

export interface CommissionPart {
  employeeId: string;
  employeeName: string;
  percentage: number;
  amount: number;
  role: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HIERARCHY = 'HIERARCHY',
  SALES = 'SALES',
  ANALYTICS = 'ANALYTICS'
}
