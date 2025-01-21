import React, { useState, useEffect } from 'react';
import { Plus, FileText, Image, File, Download, Trash2, X, Upload } from 'lucide-react';
import { format } from 'date-fns';
import type { Document, Project, Client } from '../types';
import { getDocuments, saveDocuments, addDocument, getProjects, getClients } from '../services/storage';

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDocuments(getDocuments());
    setProjects(getProjects());
    setClients(getClients());
  };

  const documentTypes = [
    'pdf',
    'image',
    'document',
    'spreadsheet',
    'presentation',
    'other'
  ];

  const handleCreateDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectId = formData.get('projectId') as string;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    const newDocument: Omit<Document, 'id'> = {
      projectId,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      url: formData.get('url') as string,
      uploadDate: new Date().toISOString()
    };

    if (selectedDocument) {
      const updatedDocuments = documents.map(doc =>
        doc.id === selectedDocument.id ? { ...doc, ...newDocument, id: doc.id } : doc
      );
      saveDocuments(updatedDocuments);
      setDocuments(updatedDocuments);
    } else {
      const document = addDocument(newDocument);
      setDocuments([...documents, document]);
    }

    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const updatedDocuments = documents.filter(doc => doc.id !== id);
      saveDocuments(updatedDocuments);
      setDocuments(updatedDocuments);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'spreadsheet':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'presentation':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      const matchesType = !selectedType || doc.type === selectedType;
      const matchesSearch = !searchTerm || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projects.find(p => p.id === doc.projectId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  };

  const calculateStorageUsed = () => {
    // This is a mock calculation since we don't actually store files
    return documents.length * 1.2; // Assume average file size of 1.2 MB
  };

  const getRecentUploads = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return documents.filter(doc => new Date(doc.uploadDate) > oneWeekAgo).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button
          onClick={() => {
            setSelectedDocument(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Total Documents</div>
          <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Storage Used</div>
          <div className="text-2xl font-bold text-blue-600">{calculateStorageUsed().toFixed(1)} MB</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Recent Uploads</div>
          <div className="text-2xl font-bold text-green-600">{getRecentUploads()}</div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex space-x-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <File className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No documents yet</p>
            <p className="text-sm text-gray-400">
              Upload your first document to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {getFilteredDocuments().map((doc) => {
              const project = projects.find(p => p.id === doc.projectId);
              const client = clients.find(c => c.id === project?.clientId);
              return (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                        <p className="text-xs text-gray-500">
                          Project: {project?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Client: {client?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded on {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedDocument ? 'Edit Document' : 'Upload New Document'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDocument(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <select
                    name="projectId"
                    defaultValue={selectedDocument?.projectId}
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
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select
                    name="type"
                    defaultValue={selectedDocument?.type}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select a type</option>
                    {documentTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Document Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedDocument?.name}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Project Proposal.pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Document URL</label>
                <input
                  type="url"
                  name="url"
                  defaultValue={selectedDocument?.url}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="https://example.com/document.pdf"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Please provide a publicly accessible URL for your document
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedDocument ? 'Save Changes' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;