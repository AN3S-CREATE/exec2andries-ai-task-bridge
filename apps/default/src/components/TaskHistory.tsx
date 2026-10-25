import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Zap, Calendar, User, Tag, RefreshCw, Search, Filter } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: string;
  priority?: string;
  category?: string;
  assignee?: string;
  tags?: string[];
}

export const TaskHistory: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'completed' | 'pending'>('all');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/taskade/projects/QLy4pjACoDeGcxXH/nodes');
      if (response.ok) {
        const data = await response.json();
        const taskNodes = data.payload.nodes || [];
        const formattedTasks: Task[] = taskNodes.map((node: any) => ({
          id: node.id,
          text: node.text || 'Untitled Task',
          completed: node.completed || false,
          createdAt: node.createdAt,
          priority: node.attributes?.['@priority'] || 'medium',
          category: node.attributes?.['@category'] || 'general',
          assignee: node.attributes?.['@assignee'] || '@andries-lieb',
          tags: node.attributes?.['@tags']?.split(',') || []
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterBy === 'all' ? true :
      filterBy === 'completed' ? task.completed :
      !task.completed;
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'from-red-500 to-orange-500';
      case 'high':
        return 'from-orange-500 to-yellow-500';
      case 'medium':
        return 'from-blue-500 to-cyan-500';
      case 'low':
        return 'from-gray-500 to-gray-600';
      default:
        return 'from-blue-500 to-purple-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sales':
        return '💼';
      case 'marketing':
        return '📊';
      case 'training':
        return '🎓';
      case 'events':
        return '🎪';
      case 'ai-systems':
        return '🤖';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-gray-400">Loading task history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex space-x-2 flex-1">
                <button
                  onClick={() => setFilterBy('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterBy === 'all'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterBy('pending')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterBy === 'pending'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterBy('completed')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterBy === 'completed'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                  }`}
                >
                  Completed
                </button>
              </div>
              <button
                onClick={fetchTasks}
                className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{tasks.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{tasks.filter(t => t.completed).length}</div>
            <div className="text-xs text-gray-400">Done</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{tasks.filter(t => !t.completed).length}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-2xl blur"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No tasks found</p>
              <p className="text-xs text-gray-500">
                {searchQuery ? 'Try a different search' : 'Create your first task to get started'}
              </p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${getPriorityColor(task.priority || 'medium')}/10 rounded-xl blur transition-opacity ${
                task.completed ? 'opacity-50' : ''
              }`}></div>
              <div className={`relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-4 transition-all hover:border-gray-700 ${
                task.completed ? 'opacity-60' : ''
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 mt-1 ${task.completed ? 'opacity-50' : ''}`}>
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                        {task.text}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">{getCategoryIcon(task.category || '')}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r ${getPriorityColor(task.priority || 'medium')} text-white`}>
                        <Zap className="h-3 w-3 mr-1" />
                        {task.priority}
                      </span>
                      
                      {task.assignee && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <User className="h-3 w-3 mr-1" />
                          {task.assignee.replace('@', '')}
                        </span>
                      )}
                      
                      {task.createdAt && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-800/50 text-gray-400 border border-gray-700">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(task.createdAt)}
                        </span>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Hint */}
      {filteredTasks.length > 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
      )}
    </div>
  );
};