import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Clock, AlertTriangle, RefreshCw, Mic, Volume2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

interface Task {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@stat1'?: string;
    '/attributes/@prio1'?: string;
    '/attributes/@cat01'?: string;
    '/attributes/@due01'?: string;
    '/attributes/@desc1'?: string;
  };
}

interface FollowUpSystemProps {
  tasks: Task[];
  onRefresh: () => void;
}

interface FollowUpData {
  taskId: string;
  status: 'progress' | 'stalled' | 'completed' | 'blocked';
  microUpdate?: string;
  missingInfo?: string;
  approvalNeeded?: string;
  nextSteps?: string;
}

export const FollowUpSystem: React.FC<FollowUpSystemProps> = ({ tasks, onRefresh }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [followUpData, setFollowUpData] = useState<FollowUpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  const { speak, isSpeaking } = useSpeech({ rate: 0.9 });

  // D. Follow-Up Prompt Implementation
  const handleFollowUp = async (task: Task) => {
    setSelectedTask(task);
    setLoading(true);

    try {
      // Call AI backend with follow-up prompt
      const response = await fetch('/api/taskade/webhooks/01K57CY3RGC9S6YNG1TZQKX251/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.fieldValues['/text'],
          currentStatus: task.fieldValues['/attributes/@stat1'],
          priority: task.fieldValues['/attributes/@prio1'],
          category: task.fieldValues['/attributes/@cat01'],
          deadline: task.fieldValues['/attributes/@due01'],
          promptType: 'follow_up',
          instruction: 'Check task status. If progress made → show micro-update. If stalled → prompt executive for missing info or approval.'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const followUpInfo = JSON.parse(data.body.followUpData || '{}');
          setFollowUpData(followUpInfo);
          
          if (voiceMode) {
            speakFollowUp(followUpInfo, task);
          }
        } catch (parseError) {
          // Generate fallback follow-up
          const fallbackFollowUp = generateFallbackFollowUp(task);
          setFollowUpData(fallbackFollowUp);
          
          if (voiceMode) {
            speakFollowUp(fallbackFollowUp, task);
          }
        }
      } else {
        const fallbackFollowUp = generateFallbackFollowUp(task);
        setFollowUpData(fallbackFollowUp);
        
        if (voiceMode) {
          speakFollowUp(fallbackFollowUp, task);
        }
      }
    } catch (error) {
      console.error('Error getting follow-up:', error);
      const fallbackFollowUp = generateFallbackFollowUp(task);
      setFollowUpData(fallbackFollowUp);
      
      if (voiceMode) {
        speakFollowUp(fallbackFollowUp, task);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackFollowUp = (task: Task): FollowUpData => {
    const status = task.fieldValues['/attributes/@stat1'];
    const priority = task.fieldValues['/attributes/@prio1'];
    
    if (status === 'completed') {
      return {
        taskId: task.id,
        status: 'completed',
        microUpdate: 'Task has been completed successfully. All deliverables are ready for review.',
        nextSteps: 'Review completed work and provide feedback if needed.'
      };
    } else if (status === 'in-progress') {
      return {
        taskId: task.id,
        status: 'progress',
        microUpdate: 'Task is progressing well. Andries is actively working on the deliverables.',
        nextSteps: 'Continue monitoring progress. Expected completion within timeline.'
      };
    } else if (status === 'blocked') {
      return {
        taskId: task.id,
        status: 'blocked',
        missingInfo: 'Task is blocked and requires executive input to proceed.',
        approvalNeeded: 'Please provide additional context or approval to unblock this task.',
        nextSteps: 'Provide missing information or approval to resume progress.'
      };
    } else {
      return {
        taskId: task.id,
        status: 'stalled',
        missingInfo: 'Task appears to be stalled. May need clarification or prioritization.',
        nextSteps: 'Check with Andries for any blockers or provide additional guidance.'
      };
    }
  };

  const speakFollowUp = (followUp: FollowUpData, task: Task) => {
    let spokenUpdate = `Follow-up for task: ${task.fieldValues['/text']}. `;
    
    if (followUp.status === 'progress' && followUp.microUpdate) {
      spokenUpdate += `Good news: ${followUp.microUpdate}`;
    } else if (followUp.status === 'completed' && followUp.microUpdate) {
      spokenUpdate += `Excellent: ${followUp.microUpdate}`;
    } else if (followUp.status === 'stalled' || followUp.status === 'blocked') {
      spokenUpdate += `Attention needed: ${followUp.missingInfo || 'This task needs your input.'}`;
      if (followUp.approvalNeeded) {
        spokenUpdate += ` ${followUp.approvalNeeded}`;
      }
    }
    
    if (followUp.nextSteps) {
      spokenUpdate += ` Next steps: ${followUp.nextSteps}`;
    }

    speak(spokenUpdate);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'blocked':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const pendingTasks = tasks.filter(task => 
    task.fieldValues['/attributes/@stat1'] !== 'completed'
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <span>Task Follow-Up System</span>
          </h3>
          <p className="text-gray-600">Check progress and get micro-updates on active tasks</p>
        </div>
        
        <div className="flex items-center space-x-2">
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
            onClick={onRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">All Tasks Completed!</h4>
          <p className="text-gray-600">No pending tasks require follow-up at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {task.fieldValues['/text'] || 'Untitled Task'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.fieldValues['/attributes/@stat1'] || 'pending')}
                      <span className="text-sm text-gray-600 capitalize">
                        {task.fieldValues['/attributes/@stat1']?.replace('-', ' ') || 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleFollowUp(task)}
                    disabled={loading && selectedTask?.id === task.id}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {loading && selectedTask?.id === task.id ? 'Checking...' : 'Follow Up'}
                  </button>
                </div>
                
                {task.fieldValues['/attributes/@prio1'] && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {task.fieldValues['/attributes/@prio1']} priority
                    </span>
                    {task.fieldValues['/attributes/@cat01'] && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {task.fieldValues['/attributes/@cat01']}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-Up Details Modal */}
      {followUpData && selectedTask && (
        <div className="mt-6 border-t pt-6">
          <div className={`p-4 rounded-lg border ${getStatusColor(followUpData.status)}`}>
            <div className="flex items-center space-x-2 mb-3">
              {getStatusIcon(followUpData.status)}
              <h4 className="font-semibold">
                Follow-up: {selectedTask.fieldValues['/text']}
              </h4>
              {isSpeaking && (
                <div className="flex items-center space-x-1 text-sm">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span>Speaking...</span>
                </div>
              )}
            </div>
            
            {followUpData.microUpdate && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Progress Update:</p>
                <p className="text-sm">{followUpData.microUpdate}</p>
              </div>
            )}
            
            {followUpData.missingInfo && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Missing Information:</p>
                <p className="text-sm">{followUpData.missingInfo}</p>
              </div>
            )}
            
            {followUpData.approvalNeeded && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Approval Needed:</p>
                <p className="text-sm">{followUpData.approvalNeeded}</p>
              </div>
            )}
            
            {followUpData.nextSteps && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Next Steps:</p>
                <p className="text-sm">{followUpData.nextSteps}</p>
              </div>
            )}
            
            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={() => {
                  setFollowUpData(null);
                  setSelectedTask(null);
                }}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Close
              </button>
              
              {voiceMode && (
                <button
                  onClick={() => speakFollowUp(followUpData, selectedTask)}
                  disabled={isSpeaking}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors text-sm disabled:opacity-50 flex items-center space-x-1"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Repeat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">How Follow-Up Works:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Progress Made:</strong> Shows micro-updates and current status</li>
          <li>• <strong>Task Stalled:</strong> Identifies missing information or approvals needed</li>
          <li>• <strong>Voice Mode:</strong> Spoken updates for hands-free operation</li>
          <li>• <strong>Smart Detection:</strong> AI analyzes task status and suggests next steps</li>
        </ul>
      </div>
    </div>
  );
};