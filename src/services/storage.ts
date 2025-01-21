import { Client, Project, TimeEntry, Milestone, Expense, Invoice, Document } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'freelance_clients',
  PROJECTS: 'freelance_projects',
  TIME_ENTRIES: 'freelance_time_entries',
  MILESTONES: 'freelance_milestones',
  EXPENSES: 'freelance_expenses',
  INVOICES: 'freelance_invoices',
  DOCUMENTS: 'freelance_documents'
} as const;

// Generic get function
const getItems = <T>(key: string): T[] => {
  const items = localStorage.getItem(key);
  return items ? JSON.parse(items) : [];
};

// Generic save function
const saveItems = <T>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

// Generate a simple ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Clients
export const getClients = (): Client[] => getItems(STORAGE_KEYS.CLIENTS);
export const saveClients = (clients: Client[]): void => saveItems(STORAGE_KEYS.CLIENTS, clients);
export const addClient = (client: Omit<Client, 'id'>): Client => {
  const clients = getClients();
  const newClient = { ...client, id: generateId() };
  clients.push(newClient);
  saveClients(clients);
  return newClient;
};

// Projects
export const getProjects = (): Project[] => getItems(STORAGE_KEYS.PROJECTS);
export const saveProjects = (projects: Project[]): void => saveItems(STORAGE_KEYS.PROJECTS, projects);
export const addProject = (project: Omit<Project, 'id'>): Project => {
  const projects = getProjects();
  const newProject = { ...project, id: generateId() };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
};

// Time Entries
export const getTimeEntries = (): TimeEntry[] => getItems(STORAGE_KEYS.TIME_ENTRIES);
export const saveTimeEntries = (entries: TimeEntry[]): void => saveItems(STORAGE_KEYS.TIME_ENTRIES, entries);
export const addTimeEntry = (entry: Omit<TimeEntry, 'id'>): TimeEntry => {
  const entries = getTimeEntries();
  const newEntry = { ...entry, id: generateId() };
  entries.push(newEntry);
  saveTimeEntries(entries);
  return newEntry;
};

// Milestones
export const getMilestones = (): Milestone[] => getItems(STORAGE_KEYS.MILESTONES);
export const saveMilestones = (milestones: Milestone[]): void => saveItems(STORAGE_KEYS.MILESTONES, milestones);
export const addMilestone = (milestone: Omit<Milestone, 'id'>): Milestone => {
  const milestones = getMilestones();
  const newMilestone = { ...milestone, id: generateId() };
  milestones.push(newMilestone);
  saveMilestones(milestones);
  return newMilestone;
};

// Expenses
export const getExpenses = (): Expense[] => getItems(STORAGE_KEYS.EXPENSES);
export const saveExpenses = (expenses: Expense[]): void => saveItems(STORAGE_KEYS.EXPENSES, expenses);
export const addExpense = (expense: Omit<Expense, 'id'>): Expense => {
  const expenses = getExpenses();
  const newExpense = { ...expense, id: generateId() };
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
};

// Invoices
export const getInvoices = (): Invoice[] => getItems(STORAGE_KEYS.INVOICES);
export const saveInvoices = (invoices: Invoice[]): void => saveItems(STORAGE_KEYS.INVOICES, invoices);
export const addInvoice = (invoice: Omit<Invoice, 'id'>): Invoice => {
  const invoices = getInvoices();
  const newInvoice = { ...invoice, id: generateId() };
  invoices.push(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
};

// Documents
export const getDocuments = (): Document[] => getItems(STORAGE_KEYS.DOCUMENTS);
export const saveDocuments = (documents: Document[]): void => saveItems(STORAGE_KEYS.DOCUMENTS, documents);
export const addDocument = (document: Omit<Document, 'id'>): Document => {
  const documents = getDocuments();
  const newDocument = { ...document, id: generateId() };
  documents.push(newDocument);
  saveDocuments(documents);
  return newDocument;
};