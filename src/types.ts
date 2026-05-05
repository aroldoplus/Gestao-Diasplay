export interface Client {
  id: string;
  name: string;
  calls: number;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string;   // ISO string YYYY-MM-DD
  subClients?: Client[];
  deleted?: boolean;
  inLixeira?: boolean;
  parentId?: string;
  contractValue?: number;
  billingDate?: string; // ISO string YYYY-MM-DD
  suspended?: boolean;
  paymentStatus?: 'paid' | 'unpaid';
  paymentConfirmedDate?: string; // ISO string
  observations?: string;
  schedule?: string[];
}

export interface Program {
  id: string;
  name: string;
  time: string;
  details: string;
  deleted?: boolean;
}

export interface Expense {
  id: string;
  name: string;
  description: string;
  value: number;
  paymentDate: string; // ISO string YYYY-MM-DD
  deleted?: boolean;
  paid?: boolean;
}
