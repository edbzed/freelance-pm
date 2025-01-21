export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  address?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on-hold';
  budget: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  amount: number;
}

export interface Expense {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  receipt?: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string;
  number: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
}