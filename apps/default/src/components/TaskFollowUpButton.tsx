import React, { useState } from 'react';
import { MessageSquare, RefreshCw, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

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

interface FollowUpResponse {
  status: 'progress' | 'stalled' | 'completed' | 'blocked';
  message: string;
  needsAttention: boolean;
  suggestedAction?: string;
}

interface TaskFollowUpButtonProps {
  task: Task;
  onFollowUpComplete?: (response: FollowUpResponse) => void;
}

export const TaskFollowUpButton: React.FC<TaskFollowUpButtonProps> = ({ 
  task, 
  onFollowUpComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState<FollowUpResponse | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  const handleFollowUp = async () => {
    setLoading(true);
    setFollowUpResponse(null);
    
    try {
      // Check task status via backend agent
      const response = await checkTaskStatus(task);
      setFollowUpResponse(response);
      setShowResponse(true);
      
      if (onFollowUpComplete) {
        onFollowUpComplete(response);
      }
    } catch (error) {
      console.error('Follow-up error:', error);
      setFollowUpResponse({
        status: 'stalled',
        message: 'Unable to check task status. Please try again.',
        needsAttention: true,
        suggestedAction: 'Check with Andries directly or refresh the dashboard.'
      });
      setShowResponse(true);
    } finally {
      setLoading(false);
    }
  };

  const checkTaskStatus = async (task: Task): Promise<FollowUpResponse> => {
    // Simulate backend agent checking task status
    const currentStatus = task.fieldValues['/attributes/@stat1'] || 'pending';
    const priority = task.fieldValues['/attributes/@prio1'] || 'medium';
    const taskTitle = task.fieldValues['/text'] || 'Untitled Task';
    const dueDate = task.fieldValues['/attributes/@due01'];
    
    // Simulate different scenarios based on task status and priority
    if (currentStatus === 'completed') {
      return {
        status: 'completed',
        message: `✅ Task "${taskTitle}" has been completed successfully. All deliverables are ready for review.`,
        needsAttention: false
      };
    }
    
    if (currentStatus === 'in-progress') {
      return {
        status: 'progress',
        message: `🔄 Research complete, drafting proposal. Task "${taskTitle}" is progressing well. Andries is actively working on the deliverables.`,
        needsAttention: false
      };
    }
    
    if (currentStatus === 'blocked') {
      return {
        status: 'blocked',
        message: `🚫 Task "${taskTitle}" is blocked and requires executive input to proceed.`,
        needsAttention: true,
        suggestedAction: 'Provide missing information or approval to unblock this task.'
      };
    }
    
    // Check if task is stalled (pending for too long, especially urgent tasks)
    if (currentStatus === 'pending') {
      if (priority === 'urgent' || priority === 'high') {
        return {
          status: 'stalled',
          message: `⚠️ Waiting on your approval for next step. High-priority task "${taskTitle}" hasn't been started yet.`,
          needsAttention: true,
          suggestedAction: 'Consider providing additional context or removing blockers to help Andries get started.'
        };
      } else {
        return {
          status: 'progress',
          message: `📋 Task "${taskTitle}" is queued and will be started soon. No immediate action needed.`,
          needsAttention: false
        };
      }
    }
    
    // Default case
    return {
      status: 'progress',
      message: `📊 Task "${taskTitle}" status updated. Andries is managing this task according to priority.`,
      needsAttention: false
    };
  };

  const getStatusIcon = (status: FollowUpResponse['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'progress':
        return <Zap className="h-4 w-4 text-blue-400" />;
      case 'stalled':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: FollowUpResponse['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30 text-green-300';
      case 'progress':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      case 'stalled':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
      case 'blocked':
        return 'bg-red-500/10 border-red-500/30 text-red-300';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
    }
  };

  return (
    <div className="space-y-2">
      {/* Follow Up Button */}
      <button
        onClick={handleFollowUp}
        disabled={loading}
        className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-lg font-medium text-xs hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
        <div className="relative flex items-center space-x-1">
          {loading ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-3 w-3" />
              <span>Follow Up</span>
            </>
          )}
        </div>
      </button>

      {/* Follow Up Response */}
      {showResponse && followUpResponse && (
        <div className="relative animate-fadeInScale">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-lg blur"></div>
          <div className={`relative bg-gray-900/60 backdrop-blur-sm border rounded-lg p-3 ${getStatusColor(followUpResponse.status)}`}>
            <div className="flex items-start space-x-2">
              {getStatusIcon(followUpResponse.status)}
              <div className="flex-1">
                <div className="font-semibold mb-1 text-xs">
                  {followUpResponse.status === 'progress' && 'Progress Update'}
                  {followUpResponse.status === 'completed' && 'Task Completed'}
                  {followUpResponse.status === 'stalled' && 'Attention Needed'}
                  {followUpResponse.status === 'blocked' && 'Task Blocked'}
                </div>
                
                <p className="text-xs mb-1">{followUpResponse.message}</p>
                
                {followUpResponse.suggestedAction && (
                  <div className="bg-gray-800/50 p-2 rounded text-xs">
                    <strong>💡 Suggested Action:</strong> {followUpResponse.suggestedAction}
                  </div>
                )}
                
                {followUpResponse.needsAttention && (
                  <div className="mt-2 flex items-center space-x-1 text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Requires Executive Attention</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowResponse(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};