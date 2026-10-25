import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle, Brain, Sparkles, Settings } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputProps {
  onTaskCreated: () => void;
}

interface VoiceQuestion {
  id: string;
  question: string;
  type: 'dropdown' | 'toggle' | 'text';
  options?: string[];
  spokenOptions?: string[];
}

interface VoiceTaskBreakdown {
  mainTask: string;
  subtasks: Array<{
    title: string;
    description: string;
    estimatedTime: string;
    skillsUsed?: string[];
  }>;
  category: string;
  tags: string[];
  priority: string;
  status: string;
  assignee: string;
  estimatedDuration: string;
  andriesStrengths?: string;
  recommendedApproach?: string;
}

type VoiceStep = 'idle' | 'listening' | 'processing' | 'questions' | 'breakdown' | 'confirming' | 'success';

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTaskCreated }) => {
  const [step, setStep] = useState<VoiceStep>('idle');
  const [taskInput, setTaskInput] = useState('');
  const [questions, setQuestions] = useState<VoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [taskBreakdown, setTaskBreakdown] = useState<VoiceTaskBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
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

  // Handle speech results
  useEffect(() => {
    if (transcript && !isListening) {
      handleSpeechResult(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  const handleSpeechResult = async (result: string) => {
    if (step === 'idle') {
      // Initial task description
      setTaskInput(result);
      setStep('processing');
      setLoading(true);

      speak("I heard: " + result + ". Let me analyze this task and generate some questions for you.", async () => {
        await generateQuestions(result);
      });
    } else if (step === 'questions') {
      // Handle question answers
      await handleQuestionAnswer(result);
    } else if (step === 'confirming') {
      // Handle confirmation
      const confirmation = result.toLowerCase();
      if (confirmation.includes('yes') || confirmation.includes('confirm') || confirmation.includes('save')) {
        await handleConfirmTask();
      } else if (confirmation.includes('no') || confirmation.includes('cancel') || confirmation.includes('back')) {
        speak("Okay, let's go back to the questions.", () => {
          setStep('questions');
          setCurrentQuestionIndex(0);
          askCurrentQuestion();
        });
      } else {
        speak("I didn't understand. Please say 'yes' to confirm or 'no' to go back.", () => {
          setTimeout(() => startListening(), 1000);
        });
      }
    }
  };

  const generateQuestions = async (task: string) => {
    try {
      const response = await fetch('/api/taskade/webhooks/01K57CQXCGZ8VQA279H0JMW9SK/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription: task
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const questionsData = JSON.parse(data.body.questions);
          if (questionsData.questions && Array.isArray(questionsData.questions)) {
            const voiceQuestions = questionsData.questions.map((q: any) => ({
              ...q,
              spokenOptions: q.options?.map((opt: string) => 
                opt.replace(/[^\w\s]/g, '').toLowerCase()
              )
            }));
            setQuestions(voiceQuestions);
          } else {
            setQuestions(generateFallbackQuestions(task));
          }
        } catch (parseError) {
          setQuestions(generateFallbackQuestions(task));
        }
      } else {
        setQuestions(generateFallbackQuestions(task));
      }

      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions(generateFallbackQuestions(task));
      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackQuestions = (task: string): VoiceQuestion[] => {
    return [
      {
        id: 'priority',
        question: 'How urgent is this task?',
        type: 'dropdown',
        options: ['Low - Can wait a week', 'Medium - Within 3 days', 'High - Within 24 hours', 'Urgent - ASAP'],
        spokenOptions: ['low', 'medium', 'high', 'urgent']
      },
      {
        id: 'category',
        question: 'Which area does this task belong to?',
        type: 'dropdown',
        options: ['Sales', 'Marketing', 'Business Growth', 'Training', 'Events', 'AI Systems'],
        spokenOptions: ['sales', 'marketing', 'business growth', 'training', 'events', 'ai systems']
      },
      {
        id: 'context',
        question: 'Any additional context or requirements?',
        type: 'text'
      }
    ];
  };

  const askCurrentQuestion = useCallback(() => {
    if (currentQuestionIndex >= questions.length) {
      // All questions answered, generate task breakdown
      generateTaskBreakdown();
      return;
    }

    const question = questions[currentQuestionIndex];
    let questionText = `Question ${currentQuestionIndex + 1}: ${question.question}`;

    if (question.type === 'dropdown' && question.options) {
      questionText += ` Your options are: ${question.options.join(', ')}`;
    } else if (question.type === 'toggle') {
      questionText += ' Please answer yes or no.';
    } else if (question.type === 'text') {
      questionText += ' Please provide your answer.';
    }

    speak(questionText, () => {
      setTimeout(() => startListening(), 500);
    });
  }, [currentQuestionIndex, questions, speak, startListening]);

  const handleQuestionAnswer = async (answer: string) => {
    const question = questions[currentQuestionIndex];
    const answerLower = answer.toLowerCase();

    let processedAnswer: string | boolean = answer;

    if (question.type === 'dropdown' && question.spokenOptions) {
      // Find matching option
      const matchIndex = question.spokenOptions.findIndex(opt => 
        answerLower.includes(opt) || opt.includes(answerLower)
      );
      if (matchIndex !== -1 && question.options) {
        processedAnswer = question.options[matchIndex];
      }
    } else if (question.type === 'toggle') {
      processedAnswer = answerLower.includes('yes') || answerLower.includes('true');
    }

    setAnswers(prev => ({ ...prev, [question.id]: processedAnswer }));

    // Confirm the answer
    const confirmationText = question.type === 'toggle' 
      ? `I heard: ${processedAnswer ? 'Yes' : 'No'}`
      : `I heard: ${processedAnswer}`;

    speak(confirmationText, () => {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeout(() => askCurrentQuestion(), 1000);
    });
  };

  const generateTaskBreakdown = async () => {
    setStep('processing');
    setLoading(true);

    speak("Great! Let me structure this task based on Andries' expertise.", async () => {
      try {
        const response = await fetch('/api/taskade/webhooks/01K57CWWSPHZE5ZCTBK2ZX3T6P/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskDescription: taskInput,
            taskAnswers: JSON.stringify(answers)
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const breakdownData = JSON.parse(data.body.taskBreakdown);
            setTaskBreakdown(breakdownData);
          } catch (parseError) {
            setTaskBreakdown(generateFallbackTaskBreakdown());
          }
        } else {
          setTaskBreakdown(generateFallbackTaskBreakdown());
        }

        setStep('breakdown');
        setTimeout(() => presentTaskBreakdown(), 1000);
      } catch (error) {
        console.error('Error generating task breakdown:', error);
        setTaskBreakdown(generateFallbackTaskBreakdown());
        setStep('breakdown');
        setTimeout(() => presentTaskBreakdown(), 1000);
      } finally {
        setLoading(false);
      }
    });
  };

  const generateFallbackTaskBreakdown = (): VoiceTaskBreakdown => {
    return {
      mainTask: taskInput,
      subtasks: [
        {
          title: 'Initial Assessment',
          description: 'Analyze requirements and gather necessary information',
          estimatedTime: '2-3 hours'
        },
        {
          title: 'Execution Phase',
          description: 'Complete main task deliverables',
          estimatedTime: '4-6 hours'
        },
        {
          title: 'Review and Finalization',
          description: 'Quality check and prepare final deliverables',
          estimatedTime: '1-2 hours'
        }
      ],
      category: 'business-growth',
      tags: ['executive-delegated', 'voice-created'],
      priority: 'medium',
      status: 'pending',
      assignee: '@andries-lieb',
      estimatedDuration: '2-3 days'
    };
  };

  const presentTaskBreakdown = () => {
    if (!taskBreakdown) return;

    const presentationText = `Perfect! I've structured your task "${taskBreakdown.mainTask}" into ${taskBreakdown.subtasks.length} subtasks. 
    The estimated duration is ${taskBreakdown.estimatedDuration}. 
    This will be assigned to Andries with ${taskBreakdown.priority} priority in the ${taskBreakdown.category} category. 
    Would you like me to save this task to the dashboard? Say 'yes' to confirm or 'no' to go back.`;

    speak(presentationText, () => {
      setStep('confirming');
      setTimeout(() => startListening(), 1000);
    });
  };

  const handleConfirmTask = async () => {
    if (!taskBreakdown) return;

    setLoading(true);
    speak("Saving your task to the dashboard...", async () => {
      try {
        const mainTaskData = {
          taskTitle: taskBreakdown.mainTask,
          taskDescription: `🎤 Voice-Created Task by AI Brain\n\n📋 Main Task: ${taskBreakdown.mainTask}\n\n🎯 Subtasks:\n${taskBreakdown.subtasks.map((subtask, index) => 
            `${index + 1}. ${subtask.title} (${subtask.estimatedTime})\n     ${subtask.description}`
          ).join('\n\n')}\n\n📊 Project Details:\n• Category: ${taskBreakdown.category}\n• Priority: ${taskBreakdown.priority}\n• Assignee: ${taskBreakdown.assignee}\n• Estimated Duration: ${taskBreakdown.estimatedDuration}\n• Tags: ${taskBreakdown.tags.join(', ')}\n\n🎤 Created via Voice Input with AI Structuring`,
          priority: taskBreakdown.priority,
          category: taskBreakdown.category,
          deadline: answers.deadline ? new Date(answers.deadline as string).toISOString() : undefined
        };

        const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mainTaskData),
        });

        if (response.ok) {
          setStep('success');
          speak("Perfect! Your task has been saved to the dashboard and Andries has been notified. The task is now ready for execution.", () => {
            onTaskCreated();
          });
        } else {
          speak("I'm sorry, there was an error saving your task. Please try again.");
        }
      } catch (error) {
        console.error('Error saving task:', error);
        speak("I'm sorry, there was an error saving your task. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  };

  const resetVoiceInput = () => {
    setStep('idle');
    setTaskInput('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTaskBreakdown(null);
    setLoading(false);
    stopSpeaking();
    stopListening();
    resetTranscript();
  };

  const getStepDescription = () => {
    switch (step) {
      case 'idle':
        return 'Ready to listen. Click the microphone to describe your task.';
      case 'listening':
        return 'Listening... Speak clearly about what you need done.';
      case 'processing':
        return 'Processing your request with AI...';
      case 'questions':
        return `Asking question ${currentQuestionIndex + 1} of ${questions.length}`;
      case 'breakdown':
        return 'Generating intelligent task breakdown...';
      case 'confirming':
        return 'Waiting for your confirmation...';
      case 'success':
        return 'Task created successfully!';
      default:
        return '';
    }
  };

  const isSupported = speechSupported && recognitionSupported;

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Task Created!</h2>
        <p className="text-gray-600 mb-6">
          Your voice command has been processed and the task is now in Andries' dashboard.
        </p>
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-semibold text-purple-800">Powered by Voice AI + Andries Knowledge Brain</p>
          </div>
          <p className="text-sm text-purple-800">
            🎤 Voice transcribed → 🧠 AI structured → 📊 Dashboard saved
          </p>
        </div>
        <button
          onClick={resetVoiceInput}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Create Another Voice Task
        </button>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-yellow-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Input Not Supported</h2>
        <p className="text-gray-600 mb-6">
          Your browser doesn't support voice input features. Please use a modern browser like Chrome, Edge, or Safari.
        </p>
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Supported browsers:</strong> Chrome, Edge, Safari (latest versions)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Mic className="h-8 w-8 text-purple-600" />
          <Brain className="h-6 w-6 text-blue-600" />
          <Sparkles className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Task Delegation</h2>
        <p className="text-gray-600">Speak your task - AI will ask 3 questions and structure it for Andries</p>
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
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{speechError}</span>
        </div>
      )}

      {/* Status Display */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className="text-sm text-gray-600">{getStepDescription()}</span>
        </div>
        
        {transcript && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Last heard:</p>
            <p className="text-sm text-blue-800">"{transcript}"</p>
          </div>
        )}

        {taskInput && step !== 'idle' && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-1">Task:</p>
            <p className="text-sm text-purple-800">"{taskInput}"</p>
          </div>
        )}

        {step === 'questions' && questions.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">
              Question {currentQuestionIndex + 1} of {questions.length}:
            </p>
            <p className="text-sm text-green-800">{questions[currentQuestionIndex]?.question}</p>
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {step === 'idle' || step === 'questions' || step === 'confirming' ? (
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading || isSpeaking}
            className={`p-6 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }`}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        ) : (
          <div className="p-6 rounded-full bg-gray-200">
            <Mic className="h-8 w-8 text-gray-400" />
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

      {/* Progress Indicator */}
      {step !== 'idle' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress:</span>
            <span className="text-sm text-gray-600">
              {step === 'processing' || step === 'breakdown' ? 'AI Processing...' : 
               step === 'questions' ? `${currentQuestionIndex}/${questions.length} questions` :
               step === 'confirming' ? 'Awaiting confirmation' :
               step === 'success' ? 'Complete!' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: step === 'processing' ? '25%' :
                       step === 'questions' ? `${25 + (currentQuestionIndex / questions.length) * 50}%` :
                       step === 'breakdown' ? '75%' :
                       step === 'confirming' ? '90%' :
                       step === 'success' ? '100%' : '0%'
              }}
            />
          </div>
        </div>
      )}

      {/* Task Breakdown Preview */}
      {taskBreakdown && step === 'breakdown' && (
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">AI-Generated Task Structure:</h3>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Main Task:</strong> {taskBreakdown.mainTask}
          </p>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Subtasks:</strong> {taskBreakdown.subtasks.length} intelligent steps
          </p>
          <p className="text-sm text-blue-800">
            <strong>Estimated Duration:</strong> {taskBreakdown.estimatedDuration}
          </p>
        </div>
      )}

      {/* Reset Button */}
      {step !== 'idle' && step !== 'success' && (
        <div className="text-center">
          <button
            onClick={resetVoiceInput}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span>How Voice Input Works:</span>
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Step 1:</strong> Click the microphone and describe your task</li>
          <li>• <strong>Step 2:</strong> Answer 3 AI-generated questions verbally</li>
          <li>• <strong>Step 3:</strong> Review the intelligent task breakdown</li>
          <li>• <strong>Step 4:</strong> Confirm to save to Andries' dashboard</li>
        </ul>
      </div>
    </div>
  );
};