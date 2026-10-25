import React from 'react';
import { Zap, BarChart3, User, ArrowRight } from 'lucide-react';

interface HeaderProps {
  activeView: 'intake' | 'dashboard' | 'profile';
  setActiveView: (view: 'intake' | 'dashboard' | 'profile') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Exec2Andries</h1>
              <p className="text-sm text-gray-500">AI Task Bridge</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveView('intake')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeView === 'intake'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              <span>Quick Task</span>
            </button>
            
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveView('profile')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeView === 'profile'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Andries</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};