import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle, Brain, Sparkles, ArrowRight, Clock, Target, Users } from 'lucide-react';

interface EnhancedVoiceInputProps {
  onTaskCreated: () => void;
}

interface VoiceQuestion {
  id: string;
  question: string;
  type: 'multiple' | 'yesno' | 'text';
  options?: string[];
  category: 'context' | 'deadline' | 'scope';
}

interface TaskBreakdown {
  title: string;
  description: string;
  subtasks: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>;
  category: string;
  tags: string[];
  status: string;
  assignee: string;
  deadline?: string;
  priority: string;
  impact: string;
}

type VoiceStep = 'idle' | 'listening' | 'processing' | 'questions' | 'structuring' | 'confirming' | 'success';

export const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({ onTaskCreated }) => {
  const [step, setStep] = useState<VoiceStep>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [questions, setQuestions] = useState<VoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) return;

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      handleSpeechResult(result);
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string, callback?: () => void) => {
    if (!synthRef.current) {
      if (callback) callback();
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }

    setError('');
    setTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start listening');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeechResult = async (result: string) => {
    if (step === 'idle') {
      // Initial task description - trigger 3-question generation
      setTaskDescription(result);
      setStep('processing');
      setLoading(true);

      speak(`I heard: ${result}. Let me generate 3 clarifying questions based on Andries' expertise.`, async () => {
        await generateThreeQuestions(result);
      });
    } else if (step === 'questions') {
      // Handle question answers
      await handleQuestionAnswer(result);
    } else if (step === 'confirming') {
      // Handle final confirmation
      const confirmation = result.toLowerCase();
      if (confirmation.includes('yes') || confirmation.includes('confirm') || confirmation.includes('save')) {
        await saveTaskToDashboard();
      } else if (confirmation.includes('no') || confirmation.includes('back')) {
        speak("Let's go back to the questions.", () => {
          setStep('questions');
          setCurrentQuestionIndex(0);
          askCurrentQuestion();
        });
      } else {
        speak("Please say 'yes' to save the task or 'no' to go back.", () => {
          setTimeout(() => startListening(), 1000);
        });
      }
    }
  };

  // A. 3-Question Generation Prompt Implementation
  const generateThreeQuestions = async (taskDesc: string) => {
    try {
      // Call the AI backend to generate exactly 3 questions
      const response = await fetch('/api/taskade/webhooks/01K57CQXCGZ8VQA279H0JMW9SK/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription: taskDesc
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const questionsData = JSON.parse(data.body.questions);
          if (questionsData.questions && Array.isArray(questionsData.questions)) {
            setQuestions(questionsData.questions);
          } else {
            setQuestions(generateFallbackQuestions(taskDesc));
          }
        } catch (parseError) {
          setQuestions(generateFallbackQuestions(taskDesc));
        }
      } else {
        setQuestions(generateFallbackQuestions(taskDesc));
      }

      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions(generateFallbackQuestions(taskDesc));
      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } finally {
      setLoading(false);
    }
  };

  // Fallback questions following the prompt structure: Context, Deadline, Scope
  const generateFallbackQuestions = (taskDesc: string): VoiceQuestion[] => {
    const taskLower = taskDesc.toLowerCase();
    
    // Identify category first
    let category = 'business-growth';
    if (taskLower.includes('sales') || taskLower.includes('client') || taskLower.includes('deal')) {
      category = 'sales';
    } else if (taskLower.includes('marketing') || taskLower.includes('campaign') || taskLower.includes('brand')) {
      category = 'marketing';
    } else if (taskLower.includes('training') || taskLower.includes('onboard')) {
      category = 'training';
    }

    return [
      // Question 1: Context (who/what/where)
      {
        id: 'context',
        question: category === 'sales' 
          ? 'Who is the target client or stakeholder for this task?'
          : category === 'marketing'
          ? 'What is the target audience or market for this initiative?'
          : 'Who are the key people involved in this task?',
        type: 'text',
        category: 'context'
      },
      // Question 2: Deadline or urgency
      {
        id: 'urgency',
        question: 'How urgent is this task?',
        type: 'multiple',
        options: ['Low priority - can wait a week', 'Medium priority - within 3 days', 'High priority - within 24 hours', 'Urgent - needs immediate attention'],
        category: 'deadline'
      },
      // Question 3: Scope or deliverables
      {
        id: 'scope',
        question: category === 'sales'
          ? 'What specific deliverables or outcomes do you expect?'
          : category === 'marketing'
          ? 'What are the key deliverables for this marketing initiative?'
          : 'What should be the main deliverable or outcome?',
        type: 'text',
        category: 'scope'
      }
    ];
  };

  const askCurrentQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      // All questions answered - move to task structuring
      structureTask();
      return;
    }

    const question = questions[currentQuestionIndex];
    let questionText = `Question ${currentQuestionIndex + 1} of 3: ${question.question}`;

    if (question.type === 'multiple' && question.options) {
      questionText += ` Your options are: ${question.options.join(', ')}. Please choose one.`;
    } else if (question.type === 'yesno') {
      questionText += ' Please answer yes or no.';
    } else {
      questionText += ' Please provide your answer.';
    }

    speak(questionText, () => {
      setTimeout(() => startListening(), 500);
    });
  };

  const handleQuestionAnswer = async (answer: string) => {
    const question = questions[currentQuestionIndex];
    let processedAnswer = answer;

    // Process multiple choice answers
    if (question.type === 'multiple' && question.options) {
      const answerLower = answer.toLowerCase();
      const matchingOption = question.options.find(option => 
        answerLower.includes(option.toLowerCase().split(' ')[0]) || 
        option.toLowerCase().includes(answerLower)
      );
      if (matchingOption) {
        processedAnswer = matchingOption;
      }
    }

    setAnswers(prev => ({ ...prev, [question.id]: processedAnswer }));

    // Confirm the answer
    speak(`I heard: ${processedAnswer}`, () => {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeout(() => askCurrentQuestion(), 1000);
    });
  };

  // B. Task Structuring Prompt Implementation
  const structureTask = async () => {
    setStep('structuring');
    setLoading(true);

    speak("Perfect! Now let me structure this task with subtasks based on Andries' expertise.", async () => {
      try {
        // Call the task structuring AI
        const response = await fetch('/api/taskade/webhooks/01K57CWWSPHZE5ZCTBK2ZX3T6P/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskDescription: taskDescription,
            taskAnswers: JSON.stringify(answers)
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const breakdownData = JSON.parse(data.body.taskBreakdown);
            setTaskBreakdown(breakdownData);
          } catch (parseError) {
            setTaskBreakdown(generateFallbackBreakdown());
          }
        } else {
          setTaskBreakdown(generateFallbackBreakdown());
        }

        setStep('confirming');
        setTimeout(() => presentTaskBreakdown(), 1000);
      } catch (error) {
        console.error('Error structuring task:', error);
        setTaskBreakdown(generateFallbackBreakdown());
        setStep('confirming');
        setTimeout(() => presentTaskBreakdown(), 1000);
      } finally {
        setLoading(false);
      }
    });
  };

  const generateFallbackBreakdown = (): TaskBreakdown => {
    // Map urgency to priority
    const urgencyToPriority: Record<string, string> = {
      'Low priority - can wait a week': 'low',
      'Medium priority - within 3 days': 'medium',
      'High priority - within 24 hours': 'high',
      'Urgent - needs immediate attention': 'urgent'
    };

    const priority = urgencyToPriority[answers.urgency] || 'medium';

    return {
      title: taskDescription,
      description: `Task: ${taskDescription}\nContext: ${answers.context || 'Not specified'}\nScope: ${answers.scope || 'Not specified'}`,
      subtasks: [
        {
          title: 'Initial Planning & Research',
          description: 'Analyze requirements and gather necessary information',
          estimatedTime: '2-3 hours'
        },
        {
          title: 'Core Execution',
          description: 'Complete the main deliverables based on scope',
          estimatedTime: '4-6 hours'
        },
        {
          title: 'Review & Finalization',
          description: 'Quality check and prepare final deliverables',
          estimatedTime: '1-2 hours'
        }
      ],
      category: 'business-growth',
      tags: ['voice-created', 'executive-delegated', 'ai-structured'],
      status: 'pending',
      assignee: 'Andries',
      priority: priority,
      impact: priority === 'urgent' || priority === 'high' ? 'high' : 'medium'
    };
  };

  const presentTaskBreakdown = () => {
    if (!taskBreakdown) return;

    const presentationText = `Excellent! I've structured your task "${taskBreakdown.title}" with ${taskBreakdown.subtasks.length} subtasks. 
    Priority level: ${taskBreakdown.priority}. 
    Impact: ${taskBreakdown.impact}. 
    This will be assigned to ${taskBreakdown.assignee}. 
    Would you like me to save this to the dashboard? Say 'yes' to confirm or 'no' to go back.`;

    speak(presentationText, () => {
      setTimeout(() => startListening(), 1000);
    });
  };

  const saveTaskToDashboard = async () => {
    if (!taskBreakdown) return;

    setLoading(true);
    speak("Saving your structured task to the dashboard...", async () => {
      try {
        // Create the complete task brief as specified in the prompts
        const taskBrief = {
          taskTitle: taskBreakdown.title,
          taskDescription: `🎤 Voice-Created Task with AI Structuring\n\n📋 ${taskBreakdown.description}\n\n🎯 Subtasks:\n${taskBreakdown.subtasks.map((subtask, index) => 
            `${index + 1}. ${subtask.title} (${subtask.estimatedTime})\n   ${subtask.description}`
          ).join('\n\n')}\n\n📊 Task Details:\n• Context: ${answers.context || 'Not specified'}\n• Scope: ${answers.scope || 'Not specified'}\n• Priority: ${taskBreakdown.priority}\n• Impact: ${taskBreakdown.impact}\n• Tags: ${taskBreakdown.tags.join(', ')}\n\n🧠 Generated by Voice AI + Andries Knowledge Brain`,
          priority: taskBreakdown.priority,
          category: taskBreakdown.category,
          deadline: taskBreakdown.deadline ? new Date(taskBreakdown.deadline).toISOString() : undefined
        };

        const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskBrief),
        });

        if (response.ok) {
          setStep('success');
          speak("Perfect! Your structured task has been saved to the dashboard. Andries has been notified and can begin work immediately.", () => {
            onTaskCreated();
          });
        } else {
          throw new Error('Failed to save task');
        }
      } catch (error) {
        console.error('Error saving task:', error);
        speak("I'm sorry, there was an error saving your task. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  };

  const reset = () => {
    setStep('idle');
    setTaskDescription('');
    setTranscript('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTaskBreakdown(null);
    setError('');
    setLoading(false);
    stopSpeaking();
    stopListening();
  };

  const getStepDescription = () => {
    switch (step) {
      case 'idle':
        return 'Ready to listen. Describe your task.';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Generating 3 clarifying questions...';
      case 'questions':
        return `Question ${currentQuestionIndex + 1} of 3`;
      case 'structuring':
        return 'Structuring task with AI...';
      case 'confirming':
        return 'Awaiting confirmation...';
      case 'success':
        return 'Task created successfully!';
      default:
        return '';
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-yellow-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Not Supported</h2>
        <p className="text-gray-600">Please use Chrome, Edge, or Safari for voice features.</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Task Created!</h2>
        <p className="text-gray-600 mb-6">
          Your task has been intelligently structured and assigned to Andries.
        </p>
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-semibold text-purple-800">Complete Voice Workflow</p>
          </div>
          <p className="text-sm text-purple-800">
            🎤 Voice → 🤔 3 Questions → 🧠 AI Structuring → 📊 Dashboard
          </p>
        </div>
        <button
          onClick={reset}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Create Another Voice Task
        </button>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Voice Task Delegation</h2>
        <p className="text-gray-600">Full 3-question workflow with AI task structuring</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
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
            <p className="text-sm font-medium text-blue-900 mb-1">You said:</p>
            <p className="text-sm text-blue-800">"{transcript}"</p>
          </div>
        )}

        {taskDescription && step !== 'idle' && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-1">Task:</p>
            <p className="text-sm text-purple-800">"{taskDescription}"</p>
          </div>
        )}

        {step === 'questions' && questions.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {questions[currentQuestionIndex]?.category === 'context' && <Users className="h-4 w-4 text-green-600" />}
              {questions[currentQuestionIndex]?.category === 'deadline' && <Clock className="h-4 w-4 text-green-600" />}
              {questions[currentQuestionIndex]?.category === 'scope' && <Target className="h-4 w-4 text-green-600" />}
              <p className="text-sm font-medium text-green-900">
                {questions[currentQuestionIndex]?.category.toUpperCase()} Question:
              </p>
            </div>
            <p className="text-sm text-green-800">{questions[currentQuestionIndex]?.question}</p>
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {(step === 'idle' || step === 'questions' || step === 'confirming') && !loading ? (
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
              {step === 'processing' ? 'Generating questions...' : 
               step === 'questions' ? `${currentQuestionIndex}/${questions.length} questions` :
               step === 'structuring' ? 'AI structuring...' :
               step === 'confirming' ? 'Ready to save' :
               step === 'success' ? 'Complete!' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: step === 'processing' ? '20%' :
                       step === 'questions' ? `${20 + (currentQuestionIndex / questions.length) * 40}%` :
                       step === 'structuring' ? '70%' :
                       step === 'confirming' ? '90%' :
                       step === 'success' ? '100%' : '0%'
              }}
            />
          </div>
        </div>
      )}

      {/* Task Breakdown Preview */}
      {taskBreakdown && step === 'confirming' && (
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">AI-Structured Task:</h3>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Title:</strong> {taskBreakdown.title}
          </p>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Subtasks:</strong> {taskBreakdown.subtasks.length} intelligent steps
          </p>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Priority:</strong> {taskBreakdown.priority}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Impact:</strong> {taskBreakdown.impact}
          </p>
        </div>
      )}

      {/* Reset Button */}
      {step !== 'idle' && step !== 'success' && (
        <div className="text-center">
          <button
            onClick={reset}
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
          <span>Enhanced Voice Workflow:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 rounded-full p-1">
              <Mic className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-gray-700">1. Speak task</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 rounded-full p-1">
              <Users className="h-3 w-3 text-green-600" />
            </div>
            <span className="text-gray-700">2. Answer 3 questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-purple-100 rounded-full p-1">
              <Brain className="h-3 w-3 text-purple-600" />
            </div>
            <span className="text-gray-700">3. AI structures</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 rounded-full p-1">
              <CheckCircle className="h-3 w-3 text-orange-600" />
            </div>
            <span className="text-gray-700">4. Confirm & save</span>
          </div>
        </div>
      </div>
    </div>
  );
};