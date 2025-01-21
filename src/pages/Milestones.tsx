import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, AlertCircle, X, Trash2 } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import type { Milestone, Project, Client, TimeEntry } from '../types';
import { getMilestones, saveMilestones, addMilestone, getProjects, getClients, getTimeEntries } from '../services/storage';

const Milestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMilestones(getMilestones());
    setProjects(getProjects());
    setClients(getClients());
    setTimeEntries(getTimeEntries());
  };

  const handleCreateMilestone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectId = formData.get('projectId') as string;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    const newMilestone: Omit<Milestone, 'id'> = {
      projectId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      dueDate: formData.get('dueDate') as string,
      status: 'pending',
      amount: Number(formData.get('amount'))
    };

    if (selectedMilestone) {
      const updatedMilestones = milestones.map(milestone =>
        milestone.id === selectedMilestone.id ? { ...milestone, ...newMilestone, id: milestone.id } : milestone
      );
      saveMilestones(updatedMilestones);
      setMilestones(updatedMilestones);
    } else {
      const milestone = addMilestone(newMilestone);
      setMilestones([...milestones, milestone]);
    }

    setIsModalOpen(false);
    setSelectedMilestone(null);
  };

  const handleDeleteMilestone = (id: string) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      const updatedMilestones = milestones.filter(milestone => milestone.id !== id);
      saveMilestones(updatedMilestones);
      setMilestones(updatedMilestones);
    }
  };

  const handleToggleStatus = (milestone: Milestone) => {
    const updatedMilestones = milestones.map(m =>
      m.id === milestone.id
        ? { ...m, status: m.status === 'completed' ? 'pending' : 'completed' }
        : m
    );
    saveMilestones(updatedMilestones);
    setMilestones(updatedMilestones);
  };

  const getProjectProgress = (projectId: string) => {
    const projectMilestones = milestones.filter(m => m.projectId === projectId);
    if (projectMilestones.length === 0) return 0;
    
    const completed = projectMilestones.filter(m => m.status === 'completed').length;
    return (completed / projectMilestones.length) * 100;
  };

  const getProjectTimeSpent = (projectId: string) => {
    return timeEntries
      .filter(entry => entry.projectId === projectId)
      .reduce((total, entry) => {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
  };

  const getTotalMilestones = () => milestones.length;
  const getCompletedMilestones = () => milestones.filter(m => m.status === 'completed').length;
  const getUpcomingMilestones = () => milestones.filter(m => {
    const dueDate = new Date(m.dueDate);
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return m.status === 'pending' && isAfter(dueDate, today) && isBefore(dueDate, nextWeek);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Project Milestones</h1>
        <button
          onClick={() => {
            setSelectedMilestone(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total Milestones</div>
          <div className="text-2xl font-bold text-gray-900">{getTotalMilestones()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">{getCompletedMilestones()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Due This Week</div>
          <div className="text-2xl font-bold text-yellow-600">{getUpcomingMilestones()}</div>
        </div>
      </div>

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No milestones yet</p>
            <p className="text-sm text-gray-400">
              Create your first milestone to start tracking project progress
            </p>
          </div>
        ) : (
          projects.map(project => {
            const projectMilestones = milestones.filter(m => m.projectId === project.id);
            if (projectMilestones.length === 0) return null;

            const client = clients.find(c => c.id === project.clientId);
            const progress = getProjectProgress(project.id);
            const timeSpent = getProjectTimeSpent(project.id);

            return (
              <div key={project.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{client?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Progress</div>
                      <div className="text-lg font-medium text-blue-600">{progress.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-sm text-gray-500">
                    <span>Time Spent: {timeSpent.toFixed(1)} hours</span>
                    <span>Budget: ${project.budget.toLocaleString()}</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {projectMilestones.map((milestone) => (
                    <div key={milestone.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <button
                            onClick={() => handleToggleStatus(milestone)}
                            className={`mt-1 p-1 rounded-full ${
                              milestone.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{milestone.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                ${milestone.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {milestone.status === 'pending' && isAfter(new Date(), new Date(milestone.dueDate)) && (
                        <div className="mt-4 flex items-center text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Overdue
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Milestone Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedMilestone ? 'Edit Milestone' : 'Create New Milestone'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMilestone(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  name="projectId"
                  defaultValue={selectedMilestone?.projectId}
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
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={selectedMilestone?.title}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedMilestone?.description}
                  required
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={selectedMilestone?.dueDate}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={selectedMilestone?.amount}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedMilestone(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedMilestone ? 'Save Changes' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Milestones;