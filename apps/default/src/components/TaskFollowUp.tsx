import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertTriangle, RefreshCw, Mic, Volume2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

interface Task {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@stat1'?: string;
    '/attributes/@prio1'?: string;
    '/attributes/@cat01'?: string;
    '/attributes/@due01'?: string;
  };
}

interface TaskFollowUpProps {
  tasks: Task[];
  onRefresh: () => void;
}

interface FollowUpStatus {
  taskId: string;
  status: 'progress' | 'stalled' | 'completed' | 'blocked';
  update: string;
  needsAttention: boolean;
  suggestedAction?: string;
}

export const TaskFollowUp: React.FC<TaskFollowUpProps> = ({ tasks, onRefresh }) => {
  const [followUpStatuses, setFollowUpStatuses] = useState<FollowUpStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeech();

  // D. Follow-Up Process
  const checkTaskStatus = async (taskId: string) => {
    setLoading(true);
    try {
      // Simulate follow-up check - in real implementation, this would call the follow-up prompt
      const response = await fetch('/api/taskade/projects/QLy4pjACoDeGcxXH/nodes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const task = data.payload.nodes.find((node: any) => node.id === taskId);
        
        if (task) {
          const status = generateFollowUpStatus(task);
          setFollowUpStatuses(prev => {
            const filtered = prev.filter(s => s.taskId !== taskId);
            return [...filtered, status];
          });

          if (voiceMode) {
            speakFollowUpStatus(status);
          }
        }
      }
    } catch (error) {
      console.error('Error checking task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUpStatus = (task: any): FollowUpStatus => {
    const status = task.fieldValues['/attributes/@stat1'] || 'pending';
    const priority = task.fieldValues['/attributes/@prio1'] || 'medium';
    const taskText = task.fieldValues['/text'] || 'Untitled Task';
    
    // Simulate different follow-up scenarios
    const scenarios = {
      'completed': {
        status: 'completed' as const,
        update: `✅ Task "${taskText}" has been completed successfully.`,
        needsAttention: false
      },
      'in-progress': {
        status: 'progress' as const,
        update: `🔄 Task "${taskText}" is progressing well. Andries is actively working on it.`,
        needsAttention: false
      },
      'pending': priority === 'urgent' ? {
        status: 'stalled' as const,
        update: `⚠️ Urgent task "${taskText}" hasn't been started yet.`,
        needsAttention: true,
        suggestedAction: 'Consider providing additional context or removing blockers.'
      } : {
        status: 'progress' as const,
        update: `📋 Task "${taskText}" is queued and will be started soon.`,
        needsAttention: false
      },
      'blocked': {
        status: 'blocked' as const,
        update: `🚫 Task "${taskText}" is blocked and needs executive input.`,
        needsAttention: true,
        suggestedAction: 'Provide missing information or approval to unblock.'
      }
    };

    return {
      taskId: task.id,
      ...scenarios[status as keyof typeof scenarios] || scenarios['pending']
    };
  };

  const speakFollowUpStatus = (status: FollowUpStatus) => {
    let spokenUpdate = status.update.replace(/[✅🔄⚠️📋🚫]/g, '');
    
    if (status.needsAttention && status.suggestedAction) {
      spokenUpdate += ` ${status.suggestedAction}`;
    }

    speak(spokenUpdate);
  };

  const handleFollowUpAll = async () => {
    setLoading(true);
    
    if (voiceMode) {
      speak("Checking status of all tasks. Please wait...");
    }

    const pendingTasks = tasks.filter(task => 
      task.fieldValues['/attributes/@stat1'] !== 'completed'
    );

    for (const task of pendingTasks.slice(0, 5)) { // Limit to 5 tasks to avoid overwhelming
      await checkTaskStatus(task.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between checks
    }

    if (voiceMode) {
      const needsAttention = followUpStatuses.filter(s => s.needsAttention).length;
      if (needsAttention > 0) {
        speak(`Follow-up complete. ${needsAttention} tasks need your attention.`);
      } else {
        speak("Follow-up complete. All tasks are progressing well.");
      }
    }

    setLoading(false);
  };

  const getStatusIcon = (status: FollowUpStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'stalled':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: FollowUpStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'progress':
        return 'bg-blue-50 border-blue-200';
      case 'stalled':
        return 'bg-yellow-50 border-yellow-200';
      case 'blocked':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const activeTasks = tasks.filter(task => 
    task.fieldValues['/attributes/@stat1'] !== 'completed'
  );

  const needsAttentionCount = followUpStatuses.filter(s => s.needsAttention).length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <span>Task Follow-Up</span>
          </h3>
          <p className="text-gray-600">Check progress and get micro-updates on active tasks</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`p-2 rounded-lg transition-colors ${
              voiceMode 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle voice mode"
          >
            {voiceMode ? <Volume2 className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          
          <button
            onClick={handleFollowUpAll}
            disabled={loading || activeTasks.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Follow Up All</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">{activeTasks.length}</div>
          <div className="text-sm text-blue-600">Active Tasks</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">{needsAttentionCount}</div>
          <div className="text-sm text-yellow-600">Need Attention</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">{followUpStatuses.filter(s => s.status === 'completed').length}</div>
          <div className="text-sm text-green-600">Recently Completed</div>
        </div>
      </div>

      {/* Active Tasks List */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Active Tasks ({activeTasks.length})</h4>
        
        {activeTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active tasks to follow up on.</p>
          </div>
        ) : (
          activeTasks.map((task) => {
            const followUpStatus = followUpStatuses.find(s => s.taskId === task.id);
            
            return (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">
                      {task.fieldValues['/text'] || 'Untitled Task'}
                    </h5>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.fieldValues['/attributes/@prio1'] === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.fieldValues['/attributes/@prio1'] === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.fieldValues['/attributes/@prio1'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.fieldValues['/attributes/@prio1'] || 'medium'} priority
                      </span>
                      <span className="capitalize">
                        {task.fieldValues['/attributes/@cat01'] || 'general'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => checkTaskStatus(task.id)}
                    disabled={loading}
                    className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm flex items-center space-x-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading && selectedTask === task.id ? 'animate-spin' : ''}`} />
                    <span>Check Status</span>
                  </button>
                </div>

                {/* Follow-up Status */}
                {followUpStatus && (
                  <div className={`p-3 rounded-lg border ${getStatusColor(followUpStatus.status)}`}>
                    <div className="flex items-start space-x-2">
                      {getStatusIcon(followUpStatus.status)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 mb-1">{followUpStatus.update}</p>
                        {followUpStatus.suggestedAction && (
                          <p className="text-xs text-gray-600 italic">
                            💡 {followUpStatus.suggestedAction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Voice Mode Indicator */}
      {voiceMode && (
        <div className="mt-6 bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Voice Mode Active</span>
            {isSpeaking && <span className="text-xs text-purple-700 animate-pulse">Speaking...</span>}
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Follow-up updates will be spoken aloud. Click the voice icon to disable.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h5 className="font-semibold text-gray-900 mb-2">Follow-Up Process:</h5>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Progress Made:</strong> Shows micro-updates on task advancement</li>
          <li>• <strong>Stalled Tasks:</strong> Identifies tasks needing executive attention</li>
          <li>• <strong>Blocked Items:</strong> Highlights tasks requiring approval or info</li>
          <li>• <strong>Voice Mode:</strong> Get spoken updates for hands-free monitoring</li>
        </ul>
      </div>
    </div>
  );
};