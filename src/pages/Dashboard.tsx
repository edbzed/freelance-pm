import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, Users, FileText, Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { getClients, getProjects, getTimeEntries, getInvoices, addProject, addClient, addTimeEntry, addMilestone, addExpense, addDocument, addInvoice } from '../services/storage';
import { format, addDays, subDays } from 'date-fns';
import type { Project, Client, TimeEntry, Milestone, Expense, Document, Invoice, InvoiceItem } from '../types';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalRevenue: 0,
    activeClients: 0,
    pendingInvoices: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    loadStats();
    setClients(getClients());
  }, []);

  const loadStats = () => {
    const clients = getClients();
    const projects = getProjects();
    const timeEntries = getTimeEntries();
    const invoices = getInvoices();

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalRevenue = timeEntries.reduce((sum, entry) => {
      const hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      return sum + (hours * entry.hourlyRate);
    }, 0);
    const pendingInvoices = invoices.filter(i => i.status === 'draft' || i.status === 'sent').length;

    setStats({
      activeProjects,
      totalRevenue,
      activeClients: clients.length,
      pendingInvoices
    });
  };

  const deleteAllData = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      // Clear all data from localStorage
      localStorage.clear();
      
      // Reset state
      setStats({
        activeProjects: 0,
        totalRevenue: 0,
        activeClients: 0,
        pendingInvoices: 0
      });
      setClients([]);
    }
  };

  const createTestData = () => {
    // Create test clients
    const techCorp = addClient({
      name: 'John Smith',
      email: 'john@techcorp.com',
      company: 'TechCorp',
      phone: '(555) 123-4567',
      address: '123 Tech Street, Silicon Valley, CA 94025'
    });

    const designStudio = addClient({
      name: 'Sarah Johnson',
      email: 'sarah@designstudio.com',
      company: 'Design Studio',
      phone: '(555) 987-6543',
      address: '456 Creative Ave, San Francisco, CA 94110'
    });

    const startupInc = addClient({
      name: 'Mike Wilson',
      email: 'mike@startupinc.com',
      company: 'Startup Inc',
      phone: '(555) 456-7890',
      address: '789 Innovation Blvd, Austin, TX 78701'
    });

    // Create test projects
    const webApp = addProject({
      clientId: techCorp.id,
      name: 'Enterprise Web Application',
      description: 'Development of a full-stack web application for internal team management',
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
      status: 'active',
      budget: 50000
    });

    const mobileApp = addProject({
      clientId: designStudio.id,
      name: 'Mobile App Design',
      description: 'UI/UX design and development of a mobile application',
      startDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 45), 'yyyy-MM-dd'),
      status: 'active',
      budget: 35000
    });

    const ecommerce = addProject({
      clientId: startupInc.id,
      name: 'E-commerce Platform',
      description: 'Building a custom e-commerce solution with inventory management',
      startDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 85), 'yyyy-MM-dd'),
      status: 'active',
      budget: 75000
    });

    // Create time entries
    const projects = [webApp, mobileApp, ecommerce];
    const hourlyRates = [85, 95, 75];
    
    projects.forEach((project, index) => {
      // Create multiple time entries per project
      for (let i = 0; i < 3; i++) {
        const startTime = new Date();
        startTime.setHours(9 + i * 3, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 2, 30, 0);

        addTimeEntry({
          projectId: project.id,
          description: `Working on ${project.name} - Task ${i + 1}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hourlyRate: hourlyRates[index]
        });
      }
    });

    // Create milestones
    projects.forEach(project => {
      const milestones = [
        {
          title: 'Project Planning',
          description: 'Complete project scope and requirements documentation',
          amount: project.budget * 0.2,
          status: 'completed'
        },
        {
          title: 'Development Phase 1',
          description: 'Core functionality implementation',
          amount: project.budget * 0.3,
          status: 'pending'
        },
        {
          title: 'Testing & QA',
          description: 'Comprehensive testing and bug fixes',
          amount: project.budget * 0.2,
          status: 'pending'
        }
      ];

      milestones.forEach((milestone, index) => {
        addMilestone({
          projectId: project.id,
          title: milestone.title,
          description: milestone.description,
          dueDate: format(addDays(new Date(), 15 * (index + 1)), 'yyyy-MM-dd'),
          status: milestone.status,
          amount: milestone.amount
        });
      });
    });

    // Create expenses
    const expenseCategories = ['Software', 'Hardware', 'Travel', 'Office Supplies'];
    projects.forEach(project => {
      for (let i = 0; i < 2; i++) {
        addExpense({
          projectId: project.id,
          description: `${expenseCategories[i]} expense for ${project.name}`,
          amount: Math.random() * 1000 + 500,
          date: format(subDays(new Date(), i * 3), 'yyyy-MM-dd'),
          category: expenseCategories[i],
          receipt: `https://example.com/receipts/${project.id}-${i}.pdf`
        });
      }
    });

    // Create documents
    const documentTypes = ['pdf', 'image', 'document'];
    projects.forEach(project => {
      documentTypes.forEach((type, index) => {
        addDocument({
          projectId: project.id,
          name: `${project.name} - Document ${index + 1}.${type}`,
          type,
          url: `https://example.com/documents/${project.id}-${index}.${type}`,
          uploadDate: format(subDays(new Date(), index), 'yyyy-MM-dd')
        });
      });
    });

    // Create invoices
    projects.forEach(project => {
      const items: InvoiceItem[] = [
        {
          description: 'Development Services',
          quantity: 40,
          rate: 85,
          amount: 3400
        },
        {
          description: 'Design Services',
          quantity: 20,
          rate: 95,
          amount: 1900
        }
      ];

      addInvoice({
        projectId: project.id,
        clientId: project.clientId,
        number: `INV-2024-${project.id}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        items,
        status: 'sent'
      });
    });

    // Refresh stats
    loadStats();
    setClients(getClients());
  };

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject: Omit<Project, 'id'> = {
      clientId: formData.get('clientId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      status: 'active',
      budget: Number(formData.get('budget'))
    };

    addProject(newProject);
    loadStats();
    setIsModalOpen(false);
  };

  const statCards = [
    { name: 'Active Projects', value: stats.activeProjects.toString(), icon: Clock, color: 'bg-blue-500' },
    { name: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-green-500' },
    { name: 'Active Clients', value: stats.activeClients.toString(), icon: Users, color: 'bg-purple-500' },
    { name: 'Pending Invoices', value: stats.pendingInvoices.toString(), icon: FileText, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={deleteAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Data
          </button>
          <button
            onClick={createTestData}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Test Data
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Clock className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No recent activity</p>
            <p className="text-sm text-gray-400">
              Start tracking time or create a project to see your activity here
            </p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No upcoming deadlines</p>
            <p className="text-sm text-gray-400">
              Add milestones to your projects to track deadlines
            </p>
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <select
                    name="clientId"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                  <input
                    type="date"
                    name="endDate"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <input
                    type="number"
                    name="budget"
                    min="0"
                    step="0.01"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;