import React, { useState } from 'react';
import { Plus, Mic, Camera, FileText, Zap, X } from 'lucide-react';

interface MobileQuickActionsProps {
  onQuickTask: (taskType: string) => void;
}

export const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({ onQuickTask }) => {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      id: 'voice',
      icon: <Mic className="h-5 w-5" />,
      label: 'Voice Task',
      color: 'from-pink-500 to-rose-500',
      action: () => onQuickTask('voice')
    },
    {
      id: 'urgent',
      icon: <Zap className="h-5 w-5" />,
      label: 'Urgent',
      color: 'from-red-500 to-orange-500',
      action: () => onQuickTask('urgent')
    },
    {
      id: 'note',
      icon: <FileText className="h-5 w-5" />,
      label: 'Quick Note',
      color: 'from-blue-500 to-cyan-500',
      action: () => onQuickTask('note')
    },
    {
      id: 'scan',
      icon: <Camera className="h-5 w-5" />,
      label: 'Scan Doc',
      color: 'from-purple-500 to-indigo-500',
      action: () => onQuickTask('scan')
    }
  ];

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {/* Quick Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-slide-up">
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className="relative group"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${action.color} rounded-2xl blur opacity-50`}></div>
              <button
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className={`relative flex items-center space-x-3 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white hover:border-gray-700 transition-all touch-active shadow-xl`}
              >
                <div className={`bg-gradient-to-r ${action.color} p-2 rounded-xl`}>
                  {action.icon}
                </div>
                <span className="font-medium text-sm whitespace-nowrap">{action.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <div className="relative">
        <div className={`absolute inset-0 ${
          isOpen 
            ? 'bg-gradient-to-r from-red-500 to-orange-500' 
            : 'bg-gradient-to-r from-cyan-500 to-purple-500'
        } rounded-2xl blur opacity-50 animate-pulse`}></div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative bg-gradient-to-r ${
            isOpen 
              ? 'from-red-500 to-orange-500' 
              : 'from-cyan-500 to-purple-500'
          } p-4 rounded-2xl text-white shadow-2xl hover:scale-110 transition-all duration-300 touch-active`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Helper text on first open */}
      {isOpen && (
        <div className="absolute bottom-0 right-20 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 whitespace-nowrap animate-slide-up">
          Quick actions →
        </div>
      )}
    </div>
  );
};