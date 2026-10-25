import React, { useState } from 'react';
import { RefreshCw, Filter, Calendar, User, Tag, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { TaskFollowUpButton } from './TaskFollowUpButton';

interface Task {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@cat01'?: string;
    '/attributes/@stat1'?: string;
    '/attributes/@prio1'?: string;
    '/attributes/@due01'?: string;
    '/attributes/@assg1'?: string;
    '/attributes/@tags1'?: string;
    '/attributes/@desc1'?: string;
    '/attributes/@impt1'?: string;
  };
}

interface DashboardProps {
  tasks: Task[];
  loading: boolean;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, loading, onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'category'>('priority');
  const [followUpResponses, setFollowUpResponses] = useState<Record<string, any>>({});

  const categoryColors: Record<string, string> = {
    'sales': 'bg-green-500/20 text-green-400 border-green-500/30',
    'marketing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'business-growth': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'onboarding': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'training': 'bg-red-500/20 text-red-400 border-red-500/30',
    'mentorship': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'innovation': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'events': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    'ai-systems': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  };

  const priorityColors: Record<string, string> = {
    'low': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'high': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'urgent': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const statusIcons: Record<string, React.ReactNode> = {
    'pending': <Clock className="h-4 w-4" />,
    'in-progress': <Zap className="h-4 w-4" />,
    'review': <AlertCircle className="h-4 w-4" />,
    'completed': <CheckCircle className="h-4 w-4" />,
    'blocked': <AlertCircle className="h-4 w-4" />
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.fieldValues['/attributes/@stat1'] === filter;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const aPriority = priorityOrder[a.fieldValues['/attributes/@prio1'] as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.fieldValues['/attributes/@prio1'] as keyof typeof priorityOrder] || 0;
      return bPriority - aPriority;
    }
    if (sortBy === 'deadline') {
      const aDate = new Date(a.fieldValues['/attributes/@due01'] || '');
      const bDate = new Date(b.fieldValues['/attributes/@due01'] || '');
      return aDate.getTime() - bDate.getTime();
    }
    return 0;
  });

  const getStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.fieldValues['/attributes/@stat1'] === 'pending').length;
    const inProgress = tasks.filter(t => t.fieldValues['/attributes/@stat1'] === 'in-progress').length;
    const completed = tasks.filter(t => t.fieldValues['/attributes/@stat1'] === 'completed').length;
    const needsAttention = Object.values(followUpResponses).filter(r => r?.needsAttention).length;
    
    return { total, pending, inProgress, completed, needsAttention };
  };

  const handleFollowUpComplete = (taskId: string, response: any) => {
    setFollowUpResponses(prev => ({
      ...prev,
      [taskId]: response
    }));
  };

  const stats = getStats();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Task Dashboard</h2>
              <p className="text-gray-400 text-sm">Track progress and manage tasks</p>
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </div>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 border border-gray-600 p-3 rounded-xl">
              <div className="text-xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total Tasks</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl">
              <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-yellow-300">Pending</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl">
              <div className="text-xl font-bold text-blue-400">{stats.inProgress}</div>
              <div className="text-xs text-blue-300">In Progress</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
              <div className="text-xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-green-300">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              >
                <option value="priority">Priority</option>
                <option value="deadline">Deadline</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {loading ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Loading tasks...</p>
            </div>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-blue-500/10 rounded-xl blur"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-gray-400 mb-3">
                <Calendar className="h-8 w-8 mx-auto" />
              </div>
              <h3 className="text-base font-medium text-white mb-2">No tasks found</h3>
              <p className="text-gray-400 text-sm">
                {filter === 'all' ? 'Create your first task using the Create feature.' : `No ${filter} tasks at the moment.`}
              </p>
            </div>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div key={task.id} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-xl blur"></div>
              <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2">
                      {task.fieldValues['/text'] || 'Untitled Task'}
                    </h3>
                    {task.fieldValues['/attributes/@desc1'] && (
                      <p className="text-gray-400 mb-2 text-sm">{task.fieldValues['/attributes/@desc1']}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-3">
                    {task.fieldValues['/attributes/@stat1'] && (
                      <div className="flex items-center space-x-1">
                        {statusIcons[task.fieldValues['/attributes/@stat1']]}
                        <span className="text-xs font-medium capitalize text-gray-300">
                          {task.fieldValues['/attributes/@stat1'].replace('-', ' ')}
                        </span>
                      </div>
                    )}
                    
                    {/* Follow Up Button - Only show for non-completed tasks */}
                    {task.fieldValues['/attributes/@stat1'] !== 'completed' && (
                      <TaskFollowUpButton 
                        task={task}
                        onFollowUpComplete={(response) => handleFollowUpComplete(task.id, response)}
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {task.fieldValues['/attributes/@cat01'] && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      categoryColors[task.fieldValues['/attributes/@cat01']] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {task.fieldValues['/attributes/@cat01'].replace('-', ' ')}
                    </span>
                  )}
                  
                  {task.fieldValues['/attributes/@prio1'] && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      priorityColors[task.fieldValues['/attributes/@prio1']] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {task.fieldValues['/attributes/@prio1']} priority
                    </span>
                  )}
                  
                  {task.fieldValues['/attributes/@due01'] && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${
                      isOverdue(task.fieldValues['/attributes/@due01'])
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(task.fieldValues['/attributes/@due01'])}</span>
                    </span>
                  )}
                  
                  {task.fieldValues['/attributes/@assg1'] && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{task.fieldValues['/attributes/@assg1']}</span>
                    </span>
                  )}
                  
                  {task.fieldValues['/attributes/@tags1'] && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{task.fieldValues['/attributes/@tags1']}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Follow-Up Instructions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-base font-semibold text-white mb-2">📋 Executive Follow-Up System</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-green-400 mb-1">✅ Progress Made:</h4>
              <p className="text-xs">Returns micro-updates like "Research complete, drafting proposal" when Andries is actively working.</p>
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-1">⚠️ Task Stalled:</h4>
              <p className="text-xs">Nudges executive with "Waiting on your approval for next step" when tasks need attention.</p>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong>💡 Pro Tip:</strong> Use Follow-Up buttons to get instant status updates without interrupting Andries' workflow. 
              The system intelligently detects when tasks need executive input vs. when they're progressing normally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};