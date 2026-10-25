import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, RefreshCw, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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

interface VoiceFollowUpProps {
  tasks: Task[];
  onRefresh?: () => void;
}

type VoiceStep = 'idle' | 'listening' | 'processing' | 'speaking' | 'confirming';

export const VoiceFollowUp: React.FC<VoiceFollowUpProps> = ({ tasks, onRefresh }) => {
  const [step, setStep] = useState<VoiceStep>('idle');
  const [currentCommand, setCurrentCommand] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [followUpResults, setFollowUpResults] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Custom hooks for speech functionality
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking, 
    isSupported: speechSupported,
    voices,
    selectedVoice,
    setSelectedVoice
  } = useSpeech({ rate: 0.9, pitch: 1, volume: 1 });

  const {
    startListening,
    stopListening,
    isListening,
    transcript,
    error: speechError,
    isSupported: recognitionSupported,
    resetTranscript
  } = useSpeechRecognition({ continuous: false, interimResults: false });

  const isSupported = speechSupported && recognitionSupported;

  // Handle speech results
  useEffect(() => {
    if (transcript && !isListening) {
      handleVoiceCommand(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  const handleVoiceCommand = async (command: string) => {
    setCurrentCommand(command);
    setStep('processing');

    const commandLower = command.toLowerCase();

    try {
      if (commandLower.includes('follow up all') || commandLower.includes('check all tasks')) {
        await handleFollowUpAll();
      } else if (commandLower.includes('follow up') || commandLower.includes('check status')) {
        // Try to identify specific task
        const taskToCheck = findTaskByVoiceCommand(command);
        if (taskToCheck) {
          await handleFollowUpSpecific(taskToCheck);
        } else {
          speak("I couldn't identify which specific task you want to follow up on. Would you like me to check all tasks instead?", () => {
            setStep('confirming');
            setTimeout(() => startListening(), 1000);
          });
        }
      } else if (commandLower.includes('yes') || commandLower.includes('confirm')) {
        if (step === 'confirming') {
          await handleFollowUpAll();
        }
      } else if (commandLower.includes('no') || commandLower.includes('cancel')) {
        speak("Okay, follow-up cancelled. Say 'follow up all' to check all tasks or 'follow up [task name]' for a specific task.", () => {
          setStep('idle');
        });
      } else {
        speak("I can help you follow up on tasks. Say 'follow up all' to check all tasks, or 'follow up [task name]' for a specific task.", () => {
          setStep('idle');
        });
      }
    } catch (error) {
      console.error('Voice command error:', error);
      speak("Sorry, there was an error processing your request. Please try again.", () => {
        setStep('idle');
      });
    }
  };

  const findTaskByVoiceCommand = (command: string): Task | null => {
    const commandLower = command.toLowerCase();
    
    // Try to find task by matching keywords in task titles
    for (const task of tasks) {
      const taskTitle = task.fieldValues['/text']?.toLowerCase() || '';
      const taskWords = taskTitle.split(' ');
      
      // Check if command contains significant words from task title
      const matchingWords = taskWords.filter(word => 
        word.length > 3 && commandLower.includes(word)
      );
      
      if (matchingWords.length >= 1) {
        return task;
      }
    }
    
    return null;
  };

  const handleFollowUpAll = async () => {
    setStep('processing');
    const activeTasks = tasks.filter(task => 
      task.fieldValues['/attributes/@stat1'] !== 'completed'
    );

    speak(`Checking status of ${activeTasks.length} active tasks. Please wait...`, async () => {
      const results = [];
      
      for (const task of activeTasks) {
        const result = await checkTaskStatus(task);
        results.push({ task, result });
      }
      
      setFollowUpResults(results);
      await presentFollowUpResults(results);
      
      if (onRefresh) {
        onRefresh();
      }
    });
  };

  const handleFollowUpSpecific = async (task: Task) => {
    setStep('processing');
    
    speak(`Checking status of "${task.fieldValues['/text']}"...`, async () => {
      const result = await checkTaskStatus(task);
      setFollowUpResults([{ task, result }]);
      
      // Speak the specific result
      speak(result.message, () => {
        if (result.suggestedAction) {
          speak(`Suggested action: ${result.suggestedAction}`, () => {
            setStep('idle');
          });
        } else {
          setStep('idle');
        }
      });
    });
  };

  const checkTaskStatus = async (task: Task) => {
    // Simulate backend agent checking task status
    const currentStatus = task.fieldValues['/attributes/@stat1'] || 'pending';
    const priority = task.fieldValues['/attributes/@prio1'] || 'medium';
    const taskTitle = task.fieldValues['/text'] || 'Untitled Task';
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    if (currentStatus === 'in-progress') {
      const progressMessages = [
        `Research complete, drafting proposal for ${taskTitle}.`,
        `Initial analysis done, moving to implementation phase for ${taskTitle}.`,
        `Client feedback incorporated, finalizing deliverables for ${taskTitle}.`,
        `Fifty percent complete, on track for deadline with ${taskTitle}.`
      ];
      
      return {
        status: 'progress',
        message: progressMessages[Math.floor(Math.random() * progressMessages.length)],
        needsAttention: false
      };
    }
    
    if (currentStatus === 'blocked') {
      return {
        status: 'blocked',
        message: `Task ${taskTitle} is blocked and requires executive input to proceed.`,
        needsAttention: true,
        suggestedAction: 'Provide missing information or approval to unblock this task.'
      };
    }
    
    if (currentStatus === 'pending') {
      if (priority === 'urgent' || priority === 'high') {
        const stalledMessages = [
          `Waiting on your approval for next step with ${taskTitle}.`,
          `Need clarification on requirements before starting ${taskTitle}.`,
          `Awaiting access permissions to begin work on ${taskTitle}.`
        ];
        
        return {
          status: 'stalled',
          message: stalledMessages[Math.floor(Math.random() * stalledMessages.length)],
          needsAttention: true,
          suggestedAction: 'Review task requirements and provide necessary approvals.'
        };
      } else {
        return {
          status: 'progress',
          message: `Task ${taskTitle} is queued and will be started according to priority schedule.`,
          needsAttention: false
        };
      }
    }
    
    return {
      status: 'progress',
      message: `Task ${taskTitle} status confirmed, Andries is managing this task.`,
      needsAttention: false
    };
  };

  const presentFollowUpResults = async (results: any[]) => {
    const needsAttention = results.filter(r => r.result.needsAttention);
    const inProgress = results.filter(r => r.result.status === 'progress' && !r.result.needsAttention);
    
    let summary = `Follow-up complete. `;
    
    if (needsAttention.length > 0) {
      summary += `${needsAttention.length} tasks need your attention. `;
      
      // Speak details of tasks needing attention
      for (const item of needsAttention) {
        await new Promise(resolve => {
          speak(item.result.message, () => {
            if (item.result.suggestedAction) {
              speak(`Suggested action: ${item.result.suggestedAction}`, resolve);
            } else {
              resolve(undefined);
            }
          });
        });
      }
    }
    
    if (inProgress.length > 0) {
      summary += `${inProgress.length} tasks are progressing well. `;
      
      // Speak a few progress updates
      const progressToSpeak = inProgress.slice(0, 3);
      for (const item of progressToSpeak) {
        await new Promise(resolve => {
          speak(item.result.message, resolve);
        });
      }
      
      if (inProgress.length > 3) {
        await new Promise(resolve => {
          speak(`And ${inProgress.length - 3} other tasks are also progressing normally.`, resolve);
        });
      }
    }
    
    speak(summary + "Follow-up complete.", () => {
      setStep('idle');
    });
  };

  const resetVoiceFollowUp = () => {
    setStep('idle');
    setCurrentCommand('');
    setSelectedTasks([]);
    setFollowUpResults([]);
    stopSpeaking();
    stopListening();
    resetTranscript();
  };

  const getStepDescription = () => {
    switch (step) {
      case 'idle':
        return 'Ready to listen. Say "follow up all" or "follow up [task name]"';
      case 'listening':
        return 'Listening for your follow-up command...';
      case 'processing':
        return 'Processing follow-up request...';
      case 'speaking':
        return 'Providing follow-up results...';
      case 'confirming':
        return 'Waiting for confirmation...';
      default:
        return '';
    }
  };

  const activeTasks = tasks.filter(task => 
    task.fieldValues['/attributes/@stat1'] !== 'completed'
  );

  if (!isSupported) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-yellow-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Not Supported</h2>
        <p className="text-gray-600 mb-6">
          Your browser doesn't support voice features. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <MessageSquare className="h-8 w-8 text-purple-600" />
          <Mic className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Follow-Up System</h2>
        <p className="text-gray-600">Use voice commands to check task status and get micro-updates</p>
      </div>

      {/* Voice Settings */}
      <div className="mb-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Voice Settings</span>
        </button>
        
        {showSettings && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voice:</label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = voices.find(v => v.name === e.target.value);
                    setSelectedVoice(voice || null);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Default Voice</option>
                  {voices
                    .filter(voice => voice.lang.startsWith('en'))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {speechError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{speechError}</span>
        </div>
      )}

      {/* Status Display */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className="text-sm text-gray-600">{getStepDescription()}</span>
        </div>
        
        {currentCommand && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Voice Command:</p>
            <p className="text-sm text-blue-800">"{currentCommand}"</p>
          </div>
        )}

        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-900 mb-1">Active Tasks Available:</p>
          <p className="text-sm text-green-800">{activeTasks.length} tasks ready for follow-up</p>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {step === 'idle' || step === 'confirming' ? (
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
            className={`p-6 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }`}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        ) : (
          <div className="p-6 rounded-full bg-gray-200">
            {step === 'processing' ? (
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            ) : (
              <Mic className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}

        <button
          onClick={isSpeaking ? stopSpeaking : undefined}
          disabled={!isSpeaking}
          className={`p-4 rounded-full transition-all ${
            isSpeaking
              ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isSpeaking ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
      </div>

      {/* Follow-Up Results */}
      {followUpResults.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Follow-Up Results:</h3>
          <div className="space-y-3">
            {followUpResults.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                item.result.needsAttention 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start space-x-2">
                  {item.result.needsAttention ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.task.fieldValues['/text']}
                    </p>
                    <p className="text-sm text-gray-700">{item.result.message}</p>
                    {item.result.suggestedAction && (
                      <p className="text-xs text-gray-600 mt-1">
                        💡 {item.result.suggestedAction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {step !== 'idle' && (
        <div className="text-center mb-6">
          <button
            onClick={resetVoiceFollowUp}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Voice Commands Guide */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <Mic className="h-4 w-4 text-purple-600" />
          <span>Voice Commands:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div>
            <p><strong>"Follow up all"</strong> - Check all active tasks</p>
            <p><strong>"Check all tasks"</strong> - Same as follow up all</p>
          </div>
          <div>
            <p><strong>"Follow up [task name]"</strong> - Check specific task</p>
            <p><strong>"Yes/No"</strong> - Confirm or cancel actions</p>
          </div>
        </div>
        <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-600">
          <strong>Example:</strong> Say "Follow up marketing campaign" to check status of a specific task, 
          or "Follow up all" to get micro-updates on all active tasks.
        </div>
      </div>
    </div>
  );
};