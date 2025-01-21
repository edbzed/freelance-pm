import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  FileText, 
  Milestone, 
  Receipt, 
  FolderOpen,
  LayoutDashboard,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Time', href: '/time', icon: Clock },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Milestones', href: '/milestones', icon: Milestone },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Documents', href: '/documents', icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-800">FreelanceHub</h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
        <nav className="flex justify-around">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center p-3 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center p-3 text-gray-600"
          >
            <Menu className="h-6 w-6" />
            <span className="text-xs mt-1">More</span>
          </button>
        </nav>
      </div>

      {/* Sidebar for desktop / Mobile drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-full bg-white transform lg:w-64 lg:translate-x-0 lg:shadow-lg transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 lg:p-6">
            <h1 className="text-2xl font-bold text-gray-800">FreelanceHub</h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-base font-medium rounded-md
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Copyright Footer */}
          <div className="p-4 text-center text-[10px] text-gray-400 border-t">
            <p>Copyright © 2025 Ed Bates (TECHBLIP LLC)</p>
            <p className="mt-0.5">This software is released under the Apache-2.0 License.</p>
            <p className="mt-0.5">See the LICENSE file for details</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 pb-20 lg:pt-0 lg:pb-0">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;