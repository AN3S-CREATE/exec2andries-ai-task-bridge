import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, CheckCircle, AlertTriangle, Clock, Zap, TrendingUp, User } from 'lucide-react';

interface Task {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@stat1'?: string;
    '/attributes/@prio1'?: string;
    '/attributes/@cat01'?: string;
    '/attributes/@due01'?: string;
    '/attributes/@desc1'?: string;
    '/attributes/@assg1'?: string;
  };
}

interface FollowUpResponse {
  status: 'progress' | 'stalled' | 'completed' | 'blocked';
  message: string;
  needsAttention: boolean;
  suggestedAction?: string;
  lastUpdated: string;
}

interface ExecutiveFollowUpProps {
  tasks: Task[];
  onRefresh?: () => void;
}

export const ExecutiveFollowUp: React.FC<ExecutiveFollowUpProps> = ({ tasks, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [followUpResults, setFollowUpResults] = useState<Record<string, FollowUpResponse>>({});
  const [lastFollowUpTime, setLastFollowUpTime] = useState<Date | null>(null);

  // Filter to only show active tasks (not completed)
  const activeTasks = tasks.filter(task => 
    task.fieldValues['/attributes/@stat1'] !== 'completed'
  );

  const handleBulkFollowUp = async () => {
    setLoading(true);
    const results: Record<string, FollowUpResponse> = {};
    
    try {
      // Process each active task
      for (const task of activeTasks) {
        const response = await checkTaskStatus(task);
        results[task.id] = response;
      }
      
      setFollowUpResults(results);
      setLastFollowUpTime(new Date());
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Bulk follow-up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTaskStatus = async (task: Task): Promise<FollowUpResponse> => {
    // Simulate backend agent checking task status
    const currentStatus = task.fieldValues['/attributes/@stat1'] || 'pending';
    const priority = task.fieldValues['/attributes/@prio1'] || 'medium';
    const taskTitle = task.fieldValues['/text'] || 'Untitled Task';
    const assignee = task.fieldValues['/attributes/@assg1'] || 'Andries';
    
    // Simulate realistic delay for backend processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const now = new Date().toLocaleTimeString();
    
    if (currentStatus === 'in-progress') {
      const progressMessages = [
        `Research complete, drafting proposal for "${taskTitle}".`,
        `Initial analysis done, moving to implementation phase for "${taskTitle}".`,
        `Client feedback incorporated, finalizing deliverables for "${taskTitle}".`,
        `50% complete - on track for deadline with "${taskTitle}".`,
        `Documentation updated, proceeding with next milestone for "${taskTitle}".`
      ];
      
      return {
        status: 'progress',
        message: progressMessages[Math.floor(Math.random() * progressMessages.length)],
        needsAttention: false,
        lastUpdated: now
      };
    }
    
    if (currentStatus === 'blocked') {
      return {
        status: 'blocked',
        message: `Task "${taskTitle}" is blocked and requires executive input to proceed.`,
        needsAttention: true,
        suggestedAction: 'Provide missing information, approval, or resources to unblock this task.',
        lastUpdated: now
      };
    }
    
    if (currentStatus === 'pending') {
      if (priority === 'urgent' || priority === 'high') {
        const stalledMessages = [
          `Waiting on your approval for next step with "${taskTitle}".`,
          `Need clarification on requirements before starting "${taskTitle}".`,
          `Awaiting access permissions to begin work on "${taskTitle}".`,
          `Requires executive decision to proceed with "${taskTitle}".`
        ];
        
        return {
          status: 'stalled',
          message: stalledMessages[Math.floor(Math.random() * stalledMessages.length)],
          needsAttention: true,
          suggestedAction: 'Review task requirements and provide necessary approvals or clarifications.',
          lastUpdated: now
        };
      } else {
        return {
          status: 'progress',
          message: `Task "${taskTitle}" is queued and will be started according to priority schedule.`,
          needsAttention: false,
          lastUpdated: now
        };
      }
    }
    
    // Default case
    return {
      status: 'progress',
      message: `Task "${taskTitle}" status confirmed - ${assignee} is managing this task.`,
      needsAttention: false,
      lastUpdated: now
    };
  };

  const getStatusIcon = (status: FollowUpResponse['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'progress':
        return <TrendingUp className="h-5 w-5 text-blue-400" />;
      case 'stalled':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: FollowUpResponse['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30';
      case 'progress':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'stalled':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'blocked':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getFollowUpStats = () => {
    const total = Object.keys(followUpResults).length;
    const needsAttention = Object.values(followUpResults).filter(r => r.needsAttention).length;
    const inProgress = Object.values(followUpResults).filter(r => r.status === 'progress').length;
    const blocked = Object.values(followUpResults).filter(r => r.status === 'blocked').length;
    
    return { total, needsAttention, inProgress, blocked };
  };

  const stats = getFollowUpStats();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <span>Executive Follow-Up</span>
              </h3>
              <p className="text-gray-400 text-sm">Get instant micro-updates on all active tasks</p>
            </div>
            
            <button
              onClick={handleBulkFollowUp}
              disabled={loading || activeTasks.length === 0}
              className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    <span>Follow Up All ({activeTasks.length})</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Stats */}
          {Object.keys(followUpResults).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-blue-400">{stats.total}</div>
                <div className="text-xs text-blue-300">Tasks Checked</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-green-400">{stats.inProgress}</div>
                <div className="text-xs text-green-300">In Progress</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-yellow-400">{stats.needsAttention}</div>
                <div className="text-xs text-yellow-300">Need Attention</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-red-400">{stats.blocked}</div>
                <div className="text-xs text-red-300">Blocked</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last Follow-Up Time */}
      {lastFollowUpTime && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Last follow-up: {lastFollowUpTime.toLocaleString()}
          </p>
        </div>
      )}

      {/* Follow-Up Results */}
      {Object.keys(followUpResults).length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-blue-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h4 className="text-base font-medium text-white mb-2">Ready for Follow-Up</h4>
            <p className="text-gray-400 mb-4 text-sm">
              Click "Follow Up All" to get instant status updates on {activeTasks.length} active tasks.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>How it works:</strong> The backend agent checks each task status and returns either 
                micro-updates for progressing tasks or nudges for stalled tasks requiring your attention.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-semibold text-white mb-2">Follow-Up Results:</h4>
          
          {activeTasks.map((task) => {
            const result = followUpResults[task.id];
            if (!result) return null;
            
            return (
              <div key={task.id} className={`relative`}>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-xl blur"></div>
                <div className={`relative bg-gray-900/60 backdrop-blur-sm border rounded-xl p-4 ${getStatusColor(result.status)}`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white text-sm">
                          {task.fieldValues['/text'] || 'Untitled Task'}
                        </h5>
                        <span className="text-xs text-gray-400">
                          {result.lastUpdated}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">{result.message}</p>
                      
                      {result.suggestedAction && (
                        <div className="bg-gray-800/50 p-2 rounded text-xs mb-2">
                          <strong>💡 Suggested Action:</strong> {result.suggestedAction}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <User className="h-3 w-3" />
                          <span>{task.fieldValues['/attributes/@assg1'] || 'Andries'}</span>
                          <span>•</span>
                          <span className="capitalize">{task.fieldValues['/attributes/@prio1'] || 'medium'} priority</span>
                        </div>
                        
                        {result.needsAttention && (
                          <div className="flex items-center space-x-1 text-xs font-medium text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Needs Attention</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-blue-500/10 rounded-xl blur"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <h5 className="font-semibold text-white mb-2">📋 Follow-Up System Guide:</h5>
          <div className="space-y-2 text-sm text-gray-300">
            <div>
              <p><strong className="text-green-400">✅ Progress Updates:</strong> "Research complete, drafting proposal" - Tasks moving forward normally</p>
            </div>
            <div>
              <p><strong className="text-red-400">⚠️ Executive Nudges:</strong> "Waiting on your approval for next step" - Tasks needing your input</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};