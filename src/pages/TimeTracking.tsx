import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Plus, Clock, Trash2 } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import type { TimeEntry, Project } from '../types';
import { getTimeEntries, saveTimeEntries, addTimeEntry, getProjects } from '../services/storage';

const TimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(85);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    setTimeEntries(getTimeEntries());
    setProjects(getProjects());

    const savedTimer = localStorage.getItem('activeTimer');
    if (savedTimer) {
      const { start, projectId, task, rate } = JSON.parse(savedTimer);
      setStartTime(new Date(start));
      setSelectedProjectId(projectId);
      setCurrentTask(task);
      setHourlyRate(rate);
      setIsTracking(true);
    }
  }, []);

  const updateTimer = useCallback(() => {
    if (startTime) {
      const now = new Date();
      const seconds = differenceInSeconds(now, startTime);
      setElapsedTime(seconds);
    }
  }, [startTime]);

  useEffect(() => {
    let intervalId: number;
    if (isTracking && startTime) {
      intervalId = window.setInterval(updateTimer, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTracking, startTime, updateTimer]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateAmount = (start: string, end: string, rate: number) => {
    const seconds = differenceInSeconds(new Date(end), new Date(start));
    const hours = seconds / 3600; // Convert seconds to hours
    return (hours * rate).toFixed(2);
  };

  const handleStartStop = () => {
    if (!isTracking) {
      if (!selectedProjectId || !currentTask) {
        alert('Please select a project and enter a task description');
        return;
      }
      const now = new Date();
      setStartTime(now);
      setIsTracking(true);
      setElapsedTime(0);

      localStorage.setItem('activeTimer', JSON.stringify({
        start: now.toISOString(),
        projectId: selectedProjectId,
        task: currentTask,
        rate: hourlyRate
      }));
    } else {
      if (startTime) {
        const endTime = new Date();
        const newEntry: Omit<TimeEntry, 'id'> = {
          projectId: selectedProjectId,
          description: currentTask,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hourlyRate
        };
        const entry = addTimeEntry(newEntry);
        setTimeEntries([...timeEntries, entry]);

        localStorage.removeItem('activeTimer');
      }
      setIsTracking(false);
      setCurrentTask('');
      setElapsedTime(0);
      setStartTime(null);
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      const updatedEntries = timeEntries.filter(entry => entry.id !== id);
      saveTimeEntries(updatedEntries);
      setTimeEntries(updatedEntries);
    }
  };

  const handleManualEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDateTime = new Date(`${formData.get('date')}T${formData.get('startTime')}`);
    const endDateTime = new Date(`${formData.get('date')}T${formData.get('endTime')}`);

    if (endDateTime <= startDateTime) {
      alert('End time must be after start time');
      return;
    }

    const newEntry: Omit<TimeEntry, 'id'> = {
      projectId: formData.get('projectId') as string,
      description: formData.get('description') as string,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      hourlyRate: Number(formData.get('hourlyRate'))
    };

    if (selectedEntry) {
      const updatedEntries = timeEntries.map(entry =>
        entry.id === selectedEntry.id ? { ...entry, ...newEntry, id: entry.id } : entry
      );
      saveTimeEntries(updatedEntries);
      setTimeEntries(updatedEntries);
    } else {
      const entry = addTimeEntry(newEntry);
      setTimeEntries([...timeEntries, entry]);
    }
    
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const getTotalSecondsToday = () => {
    return timeEntries
      .filter(entry => {
        const entryDate = new Date(entry.startTime);
        const today = new Date();
        return (
          entryDate.getDate() === today.getDate() &&
          entryDate.getMonth() === today.getMonth() &&
          entryDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((total, entry) => {
        return total + differenceInSeconds(new Date(entry.endTime), new Date(entry.startTime));
      }, 0);
  };

  const totalHoursToday = getTotalSecondsToday() / 3600; // Convert seconds to hours

  const totalEarningsToday = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.startTime);
      const today = new Date();
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((total, entry) => {
      return total + Number(calculateAmount(entry.startTime, entry.endTime, entry.hourlyRate));
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <button
          onClick={() => {
            setSelectedEntry(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Time Entry
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              disabled={isTracking}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Description</label>
            <input
              type="text"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              placeholder="What are you working on?"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              disabled={isTracking}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              disabled={isTracking}
            />
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-center">
            <Clock className="w-6 h-6 inline-block mr-2" />
            <span className="text-xl font-semibold">{formatDuration(elapsedTime)}</span>
          </div>
          <button
            onClick={handleStartStop}
            className={`px-6 py-2 rounded-md flex items-center ${
              isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Hours Tracked</p>
              <p className="text-2xl font-bold text-blue-600">{totalHoursToday.toFixed(2)}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Earnings</p>
              <p className="text-2xl font-bold text-green-600">${totalEarningsToday.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeEntries.map((entry) => {
              const project = projects.find(p => p.id === entry.projectId);
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(entry.startTime), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{project?.name || 'Unknown Project'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{entry.description}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(entry.startTime), 'h:mm a')} - {format(new Date(entry.endTime), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(differenceInSeconds(new Date(entry.endTime), new Date(entry.startTime)))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${calculateAmount(entry.startTime, entry.endTime, entry.hourlyRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedEntry ? 'Edit Time Entry' : 'Add Time Entry'}
            </h2>
            <form onSubmit={handleManualEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    name="projectId"
                    defaultValue={selectedEntry?.projectId}
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
                    defaultValue={selectedEntry ? format(new Date(selectedEntry.startTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={selectedEntry ? format(new Date(selectedEntry.startTime), 'HH:mm') : ''}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={selectedEntry ? format(new Date(selectedEntry.endTime), 'HH:mm') : ''}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    defaultValue={selectedEntry?.hourlyRate || hourlyRate}
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
                  defaultValue={selectedEntry?.description}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedEntry(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedEntry ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;