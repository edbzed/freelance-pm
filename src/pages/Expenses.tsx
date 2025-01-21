import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Trash2, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense, Project, Client } from '../types';
import { getExpenses, saveExpenses, addExpense, getProjects, getClients } from '../services/storage';

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExpenses(getExpenses());
    setProjects(getProjects());
    setClients(getClients());
  };

  const categories = [
    'Software',
    'Hardware',
    'Office Supplies',
    'Travel',
    'Meals',
    'Services',
    'Other'
  ];

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectId = formData.get('projectId') as string;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    const newExpense: Omit<Expense, 'id'> = {
      projectId,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      receipt: formData.get('receipt') as string || undefined
    };

    if (selectedExpense) {
      const updatedExpenses = expenses.map(expense =>
        expense.id === selectedExpense.id ? { ...expense, ...newExpense, id: expense.id } : expense
      );
      saveExpenses(updatedExpenses);
      setExpenses(updatedExpenses);
    } else {
      const expense = addExpense(newExpense);
      setExpenses([...expenses, expense]);
    }

    setIsModalOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedExpenses = expenses.filter(expense => expense.id !== id);
      saveExpenses(updatedExpenses);
      setExpenses(updatedExpenses);
    }
  };

  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const matchesCategory = !selectedCategory || expense.category === selectedCategory;
      const expenseMonth = format(new Date(expense.date), 'yyyy-MM');
      const matchesMonth = !selectedMonth || expenseMonth === selectedMonth;
      return matchesCategory && matchesMonth;
    });
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateMonthlyExpenses = (month: string) => {
    return expenses
      .filter(expense => format(new Date(expense.date), 'yyyy-MM') === month)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateCategoryExpenses = (category: string) => {
    return expenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => {
            setSelectedExpense(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-2xl font-bold text-gray-900">${calculateTotalExpenses().toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">This Month</div>
          <div className="text-2xl font-bold text-blue-600">
            ${calculateMonthlyExpenses(currentMonth).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Last Month</div>
          <div className="text-2xl font-bold text-gray-600">
            ${calculateMonthlyExpenses(lastMonth).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Largest Category</div>
          <div className="text-2xl font-bold text-yellow-600">
            ${Math.max(...categories.map(c => calculateCategoryExpenses(c))).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No expenses yet</p>
            <p className="text-sm text-gray-400">
              Add your first expense to start tracking your spending
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredExpenses().map((expense) => {
                const project = projects.find(p => p.id === expense.projectId);
                const client = clients.find(c => c.id === project?.clientId);
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(expense.date), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{project?.name || 'Unknown Project'}</div>
                      <div className="text-xs text-gray-500">{client?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${expense.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expense.receipt ? (
                        <a href={expense.receipt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                          <Receipt className="h-5 w-5" />
                        </a>
                      ) : (
                        <span className="text-gray-400">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expense Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedExpense(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    name="projectId"
                    defaultValue={selectedExpense?.projectId}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    defaultValue={selectedExpense?.category}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={selectedExpense?.date || format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={selectedExpense?.amount}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={selectedExpense?.description}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Receipt URL (Optional)</label>
                <input
                  type="url"
                  name="receipt"
                  defaultValue={selectedExpense?.receipt}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="https://example.com/receipt.pdf"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedExpense(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;