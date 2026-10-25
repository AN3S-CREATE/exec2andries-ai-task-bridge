import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle, Brain, Sparkles, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceTaskManagerProps {
  onTaskCreated: () => void;
}

interface VoiceQuestion {
  id: string;
  question: string;
  type: 'multiple' | 'yesno' | 'text';
  category: 'context' | 'deadline' | 'scope';
  options?: string[];
  spokenOptions?: string[];
}

interface TaskBrief {
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
  similarTasks?: string[];
}

type VoiceStep = 'idle' | 'listening' | 'categorizing' | 'questions' | 'compiling' | 'presenting' | 'confirming' | 'success';

export const VoiceTaskManager: React.FC<VoiceTaskManagerProps> = ({ onTaskCreated }) => {
  const [step, setStep] = useState<VoiceStep>('idle');
  const [taskDescription, setTaskDescription] = useState('');
  const [detectedCategory, setDetectedCategory] = useState('');
  const [questions, setQuestions] = useState<VoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [taskBrief, setTaskBrief] = useState<TaskBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [skillReminder, setSkillReminder] = useState('');

  // Custom hooks for speech functionality
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking, 
    isSupported: speechSupported
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

  // Skills reminder rotation (every 10 seconds)
  useEffect(() => {
    const fetchSkillReminder = async () => {
      try {
        const response = await fetch('/api/taskade/webhooks/01K57CY3RGC9S6YNG1TZQKX251/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          const bannerData = JSON.parse(data.body.bannerData);
          
          // Rotate through skills and stats
          const skills = bannerData.skillTips || [];
          const wins = bannerData.recentWins || [];
          const stats = bannerData.quickStats || {};
          
          const reminders = [
            ...skills.map((skill: any) => `Remember, Andries can ${skill.description}`),
            ...wins.map((win: string) => `Andries has achieved ${win}`),
            `Andries maintains ${stats.successRate || '98%'} success rate`,
            `Average response time: ${stats.avgResponseTime || '2.3 hours'}`
          ];

          if (reminders.length > 0) {
            const randomReminder = reminders[Math.floor(Math.random() * reminders.length)];
            setSkillReminder(randomReminder);
          }
        }
      } catch (error) {
        console.error('Error fetching skill reminder:', error);
      }
    };

    fetchSkillReminder();
    const interval = setInterval(fetchSkillReminder, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle speech results
  useEffect(() => {
    if (transcript && !isListening) {
      handleSpeechResult(transcript);
      resetTranscript();
    }
  }, [transcript, isListening]);

  const handleSpeechResult = async (result: string) => {
    if (step === 'idle') {
      await handleInitialTaskDescription(result);
    } else if (step === 'questions') {
      await handleQuestionAnswer(result);
    } else if (step === 'confirming') {
      await handleConfirmation(result);
    }
  };

  // A. 3-Question Generation Process
  const handleInitialTaskDescription = async (description: string) => {
    setTaskDescription(description);
    setStep('categorizing');
    setLoading(true);

    speak(`I heard: ${description}. Let me identify the category and generate 3 clarifying questions.`, async () => {
      await generateClarifyingQuestions(description);
    });
  };

  const generateClarifyingQuestions = async (description: string) => {
    try {
      // Step 1: Identify category and generate questions
      const response = await fetch('/api/taskade/webhooks/01K57CQXCGZ8VQA279H0JMW9SK/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription: description,
          promptType: '3-question-generation',
          requirements: {
            questionCount: 3,
            categories: ['context', 'deadline', 'scope'],
            answerTypes: ['multiple', 'yesno', 'text'],
            focusAreas: ['who/what/where', 'deadline/urgency', 'scope/deliverables']
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const questionsData = JSON.parse(data.body.questions);
        
        if (questionsData.category) {
          setDetectedCategory(questionsData.category);
        }

        if (questionsData.questions && Array.isArray(questionsData.questions)) {
          const voiceQuestions: VoiceQuestion[] = questionsData.questions.map((q: any, index: number) => ({
            ...q,
            category: ['context', 'deadline', 'scope'][index] as 'context' | 'deadline' | 'scope',
            spokenOptions: q.options?.map((opt: string) => 
              opt.replace(/[^\w\s]/g, '').toLowerCase()
            )
          }));
          setQuestions(voiceQuestions);
        } else {
          setQuestions(generateFallbackQuestions(description));
        }
      } else {
        setQuestions(generateFallbackQuestions(description));
      }

      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions(generateFallbackQuestions(description));
      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackQuestions = (description: string): VoiceQuestion[] => {
    const taskLower = description.toLowerCase();
    
    // Detect category
    let category = 'Business Growth';
    if (taskLower.includes('sales') || taskLower.includes('client') || taskLower.includes('deal')) {
      category = 'Sales';
      setDetectedCategory('Sales');
    } else if (taskLower.includes('marketing') || taskLower.includes('campaign') || taskLower.includes('brand')) {
      category = 'Marketing';
      setDetectedCategory('Marketing');
    }

    return [
      {
        id: 'context',
        question: `For this ${category.toLowerCase()} task, who is the target audience or key stakeholder?`,
        type: 'text',
        category: 'context'
      },
      {
        id: 'deadline',
        question: 'What is the urgency level for this task?',
        type: 'multiple',
        category: 'deadline',
        options: ['Low - Can wait a week', 'Medium - Within 3 days', 'High - Within 24 hours', 'Urgent - ASAP'],
        spokenOptions: ['low', 'medium', 'high', 'urgent']
      },
      {
        id: 'scope',
        question: 'What are the key deliverables or outcomes you expect?',
        type: 'text',
        category: 'scope'
      }
    ];
  };

  const askCurrentQuestion = useCallback(() => {
    if (currentQuestionIndex >= questions.length) {
      compileTaskBrief();
      return;
    }

    const question = questions[currentQuestionIndex];
    let questionText = `Question ${currentQuestionIndex + 1} - ${question.category}: ${question.question}`;

    if (question.type === 'multiple' && question.options) {
      questionText += ` Your options are: ${question.options.join(', ')}`;
    } else if (question.type === 'yesno') {
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

    if (question.type === 'multiple' && question.spokenOptions) {
      const matchIndex = question.spokenOptions.findIndex(opt => 
        answerLower.includes(opt) || opt.includes(answerLower)
      );
      if (matchIndex !== -1 && question.options) {
        processedAnswer = question.options[matchIndex];
      }
    } else if (question.type === 'yesno') {
      processedAnswer = answerLower.includes('yes') || answerLower.includes('true');
    }

    setAnswers(prev => ({ ...prev, [question.id]: processedAnswer }));

    const confirmationText = question.type === 'yesno' 
      ? `I heard: ${processedAnswer ? 'Yes' : 'No'}`
      : `I heard: ${processedAnswer}`;

    speak(confirmationText, () => {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeout(() => askCurrentQuestion(), 1000);
    });
  };

  // B. Task Structuring Process
  const compileTaskBrief = async () => {
    setStep('compiling');
    setLoading(true);

    speak("Perfect! Now let me compile a complete task brief and structure this for Andries.", async () => {
      try {
        const response = await fetch('/api/taskade/webhooks/01K57CWWSPHZE5ZCTBK2ZX3T6P/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskDescription: taskDescription,
            taskAnswers: JSON.stringify(answers),
            detectedCategory: detectedCategory,
            promptType: 'task-structuring',
            requirements: {
              includeFields: ['title', 'description', 'subtasks', 'category', 'tags', 'status', 'assignee', 'deadline', 'priority', 'impact'],
              checkSimilarTasks: true,
              assignee: 'Andries'
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const briefData = JSON.parse(data.body.taskBreakdown);
          setTaskBrief(briefData);
        } else {
          setTaskBrief(generateFallbackTaskBrief());
        }

        setStep('presenting');
        setTimeout(() => presentTaskBrief(), 1000);
      } catch (error) {
        console.error('Error compiling task brief:', error);
        setTaskBrief(generateFallbackTaskBrief());
        setStep('presenting');
        setTimeout(() => presentTaskBrief(), 1000);
      } finally {
        setLoading(false);
      }
    });
  };

  const generateFallbackTaskBrief = (): TaskBrief => {
    const priorityMap: Record<string, string> = {
      'Low - Can wait a week': 'low',
      'Medium - Within 3 days': 'medium',
      'High - Within 24 hours': 'high',
      'Urgent - ASAP': 'urgent'
    };

    return {
      title: taskDescription,
      description: `Task: ${taskDescription}\nContext: ${answers.context || 'Not specified'}\nScope: ${answers.scope || 'Standard deliverables'}`,
      subtasks: [
        { title: 'Initial Planning', description: 'Analyze requirements and create action plan', estimatedTime: '2-3 hours' },
        { title: 'Execution', description: 'Complete main deliverables', estimatedTime: '4-6 hours' },
        { title: 'Review & Delivery', description: 'Quality check and final delivery', estimatedTime: '1-2 hours' }
      ],
      category: detectedCategory.toLowerCase().replace(' ', '-') || 'business-growth',
      tags: ['executive-delegated', 'voice-created', 'structured'],
      status: 'pending',
      assignee: 'Andries',
      priority: priorityMap[answers.deadline as string] || 'medium',
      impact: 'medium'
    };
  };

  const presentTaskBrief = () => {
    if (!taskBrief) return;

    let presentationText = `Excellent! I've compiled your complete task brief. 
    Title: ${taskBrief.title}. 
    Category: ${taskBrief.category}. 
    Priority: ${taskBrief.priority}. 
    Impact: ${taskBrief.impact}. 
    I've structured this into ${taskBrief.subtasks.length} subtasks for Andries.`;

    if (taskBrief.similarTasks && taskBrief.similarTasks.length > 0) {
      presentationText += ` I found ${taskBrief.similarTasks.length} similar tasks that could be linked.`;
    }

    presentationText += ` Would you like me to save this to the dashboard? Say 'yes' to confirm or 'no' to modify.`;

    speak(presentationText, () => {
      setStep('confirming');
      setTimeout(() => startListening(), 1000);
    });
  };

  const handleConfirmation = async (confirmation: string) => {
    const confirmLower = confirmation.toLowerCase();
    
    if (confirmLower.includes('yes') || confirmLower.includes('confirm') || confirmLower.includes('save')) {
      await saveTaskBrief();
    } else if (confirmLower.includes('no') || confirmLower.includes('modify') || confirmLower.includes('change')) {
      speak("What would you like to modify? You can say 'priority', 'deadline', or 'start over'.", () => {
        setTimeout(() => startListening(), 1000);
      });
    } else {
      speak("I didn't understand. Please say 'yes' to save or 'no' to modify.", () => {
        setTimeout(() => startListening(), 1000);
      });
    }
  };

  const saveTaskBrief = async () => {
    if (!taskBrief) return;

    setLoading(true);
    speak("Saving your structured task to the dashboard...", async () => {
      try {
        const taskData = {
          taskTitle: taskBrief.title,
          taskDescription: `🎤 Voice-Structured Task\n\n${taskBrief.description}\n\n🎯 Subtasks:\n${taskBrief.subtasks.map((subtask, index) => 
            `${index + 1}. ${subtask.title} (${subtask.estimatedTime})\n   ${subtask.description}`
          ).join('\n\n')}\n\n📊 Task Brief:\n• Category: ${taskBrief.category}\n• Priority: ${taskBrief.priority}\n• Impact: ${taskBrief.impact}\n• Assignee: ${taskBrief.assignee}\n• Tags: ${taskBrief.tags.join(', ')}\n\n🎤 Created via Voice Task Manager with 3-Question Process`,
          priority: taskBrief.priority,
          category: taskBrief.category,
          deadline: taskBrief.deadline ? new Date(taskBrief.deadline).toISOString() : undefined
        };

        const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });

        if (response.ok) {
          setStep('success');
          speak("Perfect! Your structured task has been saved to the dashboard. Andries has been notified and can begin work immediately.", () => {
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

  const resetVoiceTaskManager = () => {
    setStep('idle');
    setTaskDescription('');
    setDetectedCategory('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTaskBrief(null);
    setLoading(false);
    stopSpeaking();
    stopListening();
    resetTranscript();
  };

  const getStepDescription = () => {
    switch (step) {
      case 'idle':
        return 'Ready to listen. Describe your task to begin the 3-question process.';
      case 'listening':
        return 'Listening... Speak clearly about what you need done.';
      case 'categorizing':
        return 'Identifying category and generating 3 clarifying questions...';
      case 'questions':
        return `Question ${currentQuestionIndex + 1} of 3 - ${questions[currentQuestionIndex]?.category}`;
      case 'compiling':
        return 'Compiling complete task brief with structure...';
      case 'presenting':
        return 'Presenting structured task brief...';
      case 'confirming':
        return 'Waiting for your confirmation to save...';
      case 'success':
        return 'Task successfully structured and saved!';
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Task Structured!</h2>
        <p className="text-gray-600 mb-6">
          Your task has been processed through the 3-question system and is now perfectly structured for Andries.
        </p>
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-semibold text-purple-800">3-Question Voice Process Complete</p>
          </div>
          <p className="text-sm text-purple-800">
            🎤 Voice → 📝 Category → ❓ 3 Questions → 📊 Structure → ✅ Dashboard
          </p>
        </div>
        <button
          onClick={resetVoiceTaskManager}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Structure Another Task
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Features Not Supported</h2>
        <p className="text-gray-600 mb-6">
          Your browser doesn't support voice input. Please use Chrome, Edge, or Safari for the full voice experience.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Mic className="h-8 w-8 text-purple-600" />
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <Brain className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Task Manager</h2>
        <p className="text-gray-600">3-Question Process → Complete Task Structure → Dashboard Ready</p>
      </div>

      {/* Skills Reminder Banner */}
      {skillReminder && step === 'idle' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-6 border border-blue-200">
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Delegation Tip</span>
          </div>
          <p className="text-sm text-purple-800">{skillReminder}</p>
        </div>
      )}

      {speechError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{speechError}</span>
        </div>
      )}

      {/* Status Display */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Process Status:</span>
          <span className="text-sm text-gray-600">{getStepDescription()}</span>
        </div>
        
        {transcript && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Voice Input:</p>
            <p className="text-sm text-blue-800">"{transcript}"</p>
          </div>
        )}

        {taskDescription && step !== 'idle' && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-1">Task Description:</p>
            <p className="text-sm text-purple-800">"{taskDescription}"</p>
            {detectedCategory && (
              <p className="text-xs text-purple-600 mt-1">Category: {detectedCategory}</p>
            )}
          </div>
        )}

        {step === 'questions' && questions.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">
              Question {currentQuestionIndex + 1} of 3 ({questions[currentQuestionIndex]?.category}):
            </p>
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
            {loading ? <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" /> : <Mic className="h-8 w-8 text-gray-400" />}
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
            <span className="text-sm font-medium text-gray-700">3-Question Process:</span>
            <span className="text-sm text-gray-600">
              {step === 'categorizing' ? 'Analyzing...' : 
               step === 'questions' ? `${currentQuestionIndex}/3 questions` :
               step === 'compiling' ? 'Structuring...' :
               step === 'presenting' ? 'Presenting...' :
               step === 'confirming' ? 'Awaiting confirmation' :
               step === 'success' ? 'Complete!' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: step === 'categorizing' ? '15%' :
                       step === 'questions' ? `${15 + (currentQuestionIndex / 3) * 50}%` :
                       step === 'compiling' ? '75%' :
                       step === 'presenting' ? '85%' :
                       step === 'confirming' ? '95%' :
                       step === 'success' ? '100%' : '0%'
              }}
            />
          </div>
        </div>
      )}

      {/* Task Brief Preview */}
      {taskBrief && (step === 'presenting' || step === 'confirming') && (
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Structured Task Brief:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Title:</strong> {taskBrief.title}</p>
            <p><strong>Category:</strong> {taskBrief.category}</p>
            <p><strong>Priority:</strong> {taskBrief.priority} | <strong>Impact:</strong> {taskBrief.impact}</p>
            <p><strong>Subtasks:</strong> {taskBrief.subtasks.length} structured steps</p>
            <p><strong>Assignee:</strong> {taskBrief.assignee}</p>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {step !== 'idle' && step !== 'success' && (
        <div className="text-center">
          <button
            onClick={resetVoiceTaskManager}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Process Guide */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span>3-Question Voice Process:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-purple-900">1. Context</div>
            <div className="text-purple-700">Who/What/Where details</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-blue-900">2. Deadline</div>
            <div className="text-blue-700">Urgency and timing</div>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <div className="font-semibold text-green-900">3. Scope</div>
            <div className="text-green-700">Deliverables and outcomes</div>
          </div>
        </div>
      </div>
    </div>
  );
};