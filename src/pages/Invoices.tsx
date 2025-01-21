import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Send, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Invoice, InvoiceItem, Project, Client } from '../types';
import { getInvoices, saveInvoices, addInvoice, getProjects, getClients } from '../services/storage';

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(getInvoices());
    setProjects(getProjects());
    setClients(getClients());
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      saveInvoices(updatedInvoices);
      setInvoices(updatedInvoices);
    }
  };

  const handleAddInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { description: '', quantity: 0, rate: 0, amount: 0 }
    ]);
  };

  const handleUpdateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...invoiceItems];
    const item = { ...updatedItems[index] };

    if (field === 'quantity' || field === 'rate') {
      item[field] = Number(value);
      item.amount = item.quantity * item.rate;
    } else {
      item[field] = value as string;
    }

    updatedItems[index] = item;
    setInvoiceItems(updatedItems);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectId = formData.get('projectId') as string;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    const newInvoice: Omit<Invoice, 'id'> = {
      projectId,
      clientId: project.clientId,
      number: formData.get('number') as string,
      date: formData.get('date') as string,
      dueDate: formData.get('dueDate') as string,
      items: invoiceItems,
      status: 'draft'
    };

    if (selectedInvoice) {
      const updatedInvoices = invoices.map(invoice =>
        invoice.id === selectedInvoice.id ? { ...invoice, ...newInvoice, id: invoice.id } : invoice
      );
      saveInvoices(updatedInvoices);
      setInvoices(updatedInvoices);
    } else {
      const invoice = addInvoice(newInvoice);
      setInvoices([...invoices, invoice]);
    }

    setIsModalOpen(false);
    setSelectedInvoice(null);
    setInvoiceItems([]);
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = invoices
      .map(i => parseInt(i.number.split('-')[2]))
      .filter(n => !isNaN(n));
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button 
          onClick={() => {
            setSelectedInvoice(null);
            setInvoiceItems([]);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-2xl font-bold text-gray-900">
            ${invoices
              .filter(i => i.status === 'sent')
              .reduce((sum, i) => sum + calculateTotal(i.items), 0)
              .toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Overdue</div>
          <div className="text-2xl font-bold text-red-600">
            ${invoices
              .filter(i => i.status === 'sent' && new Date(i.dueDate) < new Date())
              .reduce((sum, i) => sum + calculateTotal(i.items), 0)
              .toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Paid (Last 30 days)</div>
          <div className="text-2xl font-bold text-green-600">
            ${invoices
              .filter(i => i.status === 'paid')
              .reduce((sum, i) => sum + calculateTotal(i.items), 0)
              .toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Draft</div>
          <div className="text-2xl font-bold text-gray-600">
            ${invoices
              .filter(i => i.status === 'draft')
              .reduce((sum, i) => sum + calculateTotal(i.items), 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">No invoices yet</p>
                  <p className="text-sm text-gray-400">
                    Create your first invoice to get started
                  </p>
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const client = clients.find(c => c.id === invoice.clientId);
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{invoice.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client?.name || 'Unknown Client'}</div>
                      <div className="text-sm text-gray-500">{client?.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(invoice.date), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${calculateTotal(invoice.items).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Download className="h-5 w-5" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Send className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <button onClick={() => {
                setIsModalOpen(false);
                setSelectedInvoice(null);
                setInvoiceItems([]);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    name="number"
                    defaultValue={selectedInvoice?.number || getNextInvoiceNumber()}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    name="projectId"
                    defaultValue={selectedInvoice?.projectId}
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
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={selectedInvoice?.date || format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={selectedInvoice?.dueDate}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateInvoiceItem(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          min="0"
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleUpdateInvoiceItem(index, 'rate', e.target.value)}
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.amount}
                          readOnly
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvoiceItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {invoiceItems.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="w-48 bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>${calculateTotal(invoiceItems).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedInvoice(null);
                    setInvoiceItems([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedInvoice ? 'Save Changes' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;