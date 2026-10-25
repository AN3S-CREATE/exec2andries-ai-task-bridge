import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle, Brain, Sparkles, Settings, Clock, Users, Target } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputEnhancedProps {
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
    skillsUsed?: string[];
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

type VoiceStep = 'idle' | 'listening' | 'processing' | 'questions' | 'compiling' | 'structuring' | 'confirming' | 'success';

export const VoiceInputEnhanced: React.FC<VoiceInputEnhancedProps> = ({ onTaskCreated }) => {
  const [step, setStep] = useState<VoiceStep>('idle');
  const [taskInput, setTaskInput] = useState('');
  const [detectedCategory, setDetectedCategory] = useState('');
  const [questions, setQuestions] = useState<VoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [taskBrief, setTaskBrief] = useState<TaskBrief | null>(null);
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
      // Initial task description - trigger A. 3-Question Generation
      setTaskInput(result);
      setStep('processing');
      setLoading(true);

      speak(`I heard: "${result}". Let me identify the category and generate 3 clarifying questions based on Andries' expertise.`, async () => {
        await generateThreeQuestions(result);
      });
    } else if (step === 'questions') {
      // Handle question answers
      await handleQuestionAnswer(result);
    } else if (step === 'confirming') {
      // Handle confirmation
      const confirmation = result.toLowerCase();
      if (confirmation.includes('yes') || confirmation.includes('confirm') || confirmation.includes('save')) {
        await saveTaskToDashboard();
      } else if (confirmation.includes('no') || confirmation.includes('back') || confirmation.includes('change')) {
        speak("Understood. Let's go back to the questions to make changes.", () => {
          setStep('questions');
          setCurrentQuestionIndex(0);
          askCurrentQuestion();
        });
      } else {
        speak("I didn't catch that. Please say 'yes' to save the task or 'no' to make changes.", () => {
          setTimeout(() => startListening(), 1000);
        });
      }
    }
  };

  // A. 3-Question Generation Prompt Implementation
  const generateThreeQuestions = async (taskDescription: string) => {
    try {
      // Call AI backend with the specific 3-question generation prompt
      const response = await fetch('/api/taskade/webhooks/01K57CQXCGZ8VQA279H0JMW9SK/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription: taskDescription,
          promptType: 'three_question_generation',
          instruction: `Identify the category (Sales, Marketing, Business Growth, etc.) and generate exactly 3 clarifying questions relevant to that category and Andries' skills. Use multiple choice, yes/no, or short text for speed. Ensure questions cover: 1) Context (who/what/where), 2) Deadline or urgency, 3) Scope or deliverables.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const questionsData = JSON.parse(data.body.questions);
          if (questionsData.category) {
            setDetectedCategory(questionsData.category);
          }
          if (questionsData.questions && Array.isArray(questionsData.questions)) {
            const voiceQuestions = questionsData.questions.map((q: any, index: number) => ({
              ...q,
              category: index === 0 ? 'context' : index === 1 ? 'deadline' : 'scope',
              spokenOptions: q.options?.map((opt: string) => 
                opt.replace(/[^\w\s-]/g, '').toLowerCase()
              )
            }));
            setQuestions(voiceQuestions);
          } else {
            setQuestions(generateFallbackQuestions(taskDescription));
          }
        } catch (parseError) {
          setQuestions(generateFallbackQuestions(taskDescription));
        }
      } else {
        setQuestions(generateFallbackQuestions(taskDescription));
      }

      setStep('questions');
      setCurrentQuestionIndex(0);
      
      // Announce the detected category and start questions
      const categoryAnnouncement = detectedCategory 
        ? `I've identified this as a ${detectedCategory} task. Now I'll ask you 3 specific questions to optimize this for Andries.`
        : `I'll now ask you 3 questions to structure this task perfectly for Andries.`;
      
      speak(categoryAnnouncement, () => {
        setTimeout(() => askCurrentQuestion(), 1000);
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions(generateFallbackQuestions(taskDescription));
      setStep('questions');
      setCurrentQuestionIndex(0);
      setTimeout(() => askCurrentQuestion(), 1000);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackQuestions = (task: string): VoiceQuestion[] => {
    const taskLower = task.toLowerCase();
    let category = 'business-growth';
    
    if (taskLower.includes('sales') || taskLower.includes('client') || taskLower.includes('deal')) {
      category = 'sales';
    } else if (taskLower.includes('marketing') || taskLower.includes('campaign') || taskLower.includes('brand')) {
      category = 'marketing';
    } else if (taskLower.includes('training') || taskLower.includes('onboard') || taskLower.includes('teach')) {
      category = 'training';
    }
    
    setDetectedCategory(category);

    return [
      {
        id: 'context',
        question: 'Who is involved and what specific context should Andries know?',
        type: 'text',
        category: 'context'
      },
      {
        id: 'deadline',
        question: 'How urgent is this task?',
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
      // All questions answered - compile task brief
      compileTaskBrief();
      return;
    }

    const question = questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    const categoryLabel = question.category === 'context' ? 'Context' : 
                         question.category === 'deadline' ? 'Urgency' : 'Scope';
    
    let questionText = `Question ${questionNumber} - ${categoryLabel}: ${question.question}`;

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
      // Find matching option
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

    // Confirm the answer
    const confirmationText = question.type === 'yesno' 
      ? `Got it: ${processedAnswer ? 'Yes' : 'No'}`
      : `I recorded: ${processedAnswer}`;

    speak(confirmationText, () => {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeout(() => askCurrentQuestion(), 1000);
    });
  };

  // Compile complete task brief after all questions
  const compileTaskBrief = async () => {
    setStep('compiling');
    setLoading(true);

    speak("Perfect! I have all the information. Let me compile a complete task brief for Andries.", async () => {
      // This represents the "After answers, compile a complete task brief" step
      const briefData = {
        taskDescription: taskInput,
        category: detectedCategory,
        answers: answers,
        context: answers.context || '',
        deadline: answers.deadline || '',
        scope: answers.scope || ''
      };

      // Move to task structuring
      setTimeout(() => structureTask(briefData), 1000);
    });
  };

  // B. Task Structuring Prompt Implementation
  const structureTask = async (briefData: any) => {
    setStep('structuring');

    speak("Now I'll structure this task with all the details Andries needs.", async () => {
      try {
        const response = await fetch('/api/taskade/webhooks/01K57CWWSPHZE5ZCTBK2ZX3T6P/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskDescription: taskInput,
            taskAnswers: JSON.stringify(answers),
            category: detectedCategory,
            promptType: 'task_structuring',
            instruction: `Create: Title, Description, Subtasks, Category, Tags, Status, Assignee (Andries), Deadline, Priority, Impact. If similar tasks exist, suggest linking or merging.`
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const structuredData = JSON.parse(data.body.taskBreakdown);
            setTaskBrief(structuredData);
          } catch (parseError) {
            setTaskBrief(generateFallbackTaskBrief(briefData));
          }
        } else {
          setTaskBrief(generateFallbackTaskBrief(briefData));
        }

        setStep('confirming');
        setTimeout(() => presentTaskBrief(), 1000);
      } catch (error) {
        console.error('Error structuring task:', error);
        setTaskBrief(generateFallbackTaskBrief(briefData));
        setStep('confirming');
        setTimeout(() => presentTaskBrief(), 1000);
      } finally {
        setLoading(false);
      }
    });
  };

  const generateFallbackTaskBrief = (briefData: any): TaskBrief => {
    const priorityMap: Record<string, string> = {
      'Low - Can wait a week': 'low',
      'Medium - Within 3 days': 'medium',
      'High - Within 24 hours': 'high',
      'Urgent - ASAP': 'urgent'
    };

    return {
      title: taskInput,
      description: `Task: ${taskInput}\nContext: ${briefData.context}\nScope: ${briefData.scope}`,
      subtasks: [
        {
          title: 'Initial Assessment & Planning',
          description: 'Analyze requirements and create execution plan',
          estimatedTime: '2-3 hours'
        },
        {
          title: 'Core Execution',
          description: 'Complete main deliverables based on scope',
          estimatedTime: '4-6 hours'
        },
        {
          title: 'Review & Finalization',
          description: 'Quality check and prepare final deliverables',
          estimatedTime: '1-2 hours'
        }
      ],
      category: detectedCategory || 'business-growth',
      tags: ['executive-delegated', 'voice-created', 'structured'],
      status: 'pending',
      assignee: 'Andries',
      deadline: briefData.deadline,
      priority: priorityMap[briefData.deadline] || 'medium',
      impact: 'medium'
    };
  };

  const presentTaskBrief = () => {
    if (!taskBrief) return;

    const presentationText = `Excellent! I've structured your task completely. Here's what I've created:

    Title: "${taskBrief.title}"
    Category: ${taskBrief.category}
    Priority: ${taskBrief.priority}
    Impact: ${taskBrief.impact}
    
    I've broken this into ${taskBrief.subtasks.length} subtasks for Andries, assigned the appropriate tags, and set the status to pending.
    
    ${taskBrief.similarTasks ? `I also found similar tasks that could be linked: ${taskBrief.similarTasks.join(', ')}.` : ''}
    
    Would you like me to save this to Andries' dashboard? Say 'yes' to confirm or 'no' to make changes.`;

    speak(presentationText, () => {
      setTimeout(() => startListening(), 1000);
    });
  };

  const saveTaskToDashboard = async () => {
    if (!taskBrief) return;

    setLoading(true);
    speak("Saving your structured task to Andries' dashboard now...", async () => {
      try {
        const taskData = {
          taskTitle: taskBrief.title,
          taskDescription: `🎤 Voice-Created Task with Complete Brief\n\n📋 ${taskBrief.description}\n\n🎯 Subtasks:\n${taskBrief.subtasks.map((subtask, index) => 
            `${index + 1}. ${subtask.title} (${subtask.estimatedTime})\n     ${subtask.description}`
          ).join('\n\n')}\n\n📊 Task Details:\n• Category: ${taskBrief.category}\n• Priority: ${taskBrief.priority}\n• Impact: ${taskBrief.impact}\n• Assignee: ${taskBrief.assignee}\n• Tags: ${taskBrief.tags.join(', ')}\n\n🎤 Created via Enhanced Voice Input with 3-Question Flow`,
          priority: taskBrief.priority,
          category: taskBrief.category,
          deadline: taskBrief.deadline ? new Date(taskBrief.deadline).toISOString() : undefined
        };

        const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (response.ok) {
          setStep('success');
          speak("Perfect! Your task has been saved to the dashboard with complete structure. Andries has been notified and can begin work immediately.", () => {
            onTaskCreated();
          });
        } else {
          speak("I encountered an error saving the task. Please try again or use the text input method.");
        }
      } catch (error) {
        console.error('Error saving task:', error);
        speak("I encountered an error saving the task. Please try again or use the text input method.");
      } finally {
        setLoading(false);
      }
    });
  };

  const resetVoiceInput = () => {
    setStep('idle');
    setTaskInput('');
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
        return 'Ready to listen. Describe your task to begin the 3-question flow.';
      case 'listening':
        return 'Listening... Speak clearly about what you need done.';
      case 'processing':
        return 'Identifying category and generating 3 clarifying questions...';
      case 'questions':
        return `Question ${currentQuestionIndex + 1} of 3 - ${questions[currentQuestionIndex]?.category || 'Processing'}`;
      case 'compiling':
        return 'Compiling complete task brief...';
      case 'structuring':
        return 'Structuring task with title, subtasks, priority, and impact...';
      case 'confirming':
        return 'Presenting structured task - awaiting your confirmation...';
      case 'success':
        return 'Task successfully created and saved to dashboard!';
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Task Successfully Created!</h2>
        <p className="text-gray-600 mb-6">
          Your task has been fully structured using the 3-question method and saved to Andries' dashboard.
        </p>
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-semibold text-purple-800">Complete Voice Workflow</p>
          </div>
          <p className="text-sm text-purple-800">
            🎤 Voice → 🧠 Category Detection → ❓ 3 Questions → 📋 Task Brief → 🏗️ Structure → 💾 Dashboard
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Voice Task Delegation</h2>
        <p className="text-gray-600">Complete 3-question workflow: Category Detection → Context → Urgency → Scope → Structure</p>
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

      {/* Enhanced Status Display */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className="text-sm text-gray-600">{getStepDescription()}</span>
        </div>
        
        {detectedCategory && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">Detected Category:</p>
            <p className="text-sm text-green-800 capitalize">{detectedCategory}</p>
          </div>
        )}

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
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {questions[currentQuestionIndex]?.category === 'context' && <Users className="h-4 w-4 text-yellow-600" />}
              {questions[currentQuestionIndex]?.category === 'deadline' && <Clock className="h-4 w-4 text-yellow-600" />}
              {questions[currentQuestionIndex]?.category === 'scope' && <Target className="h-4 w-4 text-yellow-600" />}
              <p className="text-sm font-medium text-yellow-900">
                Question {currentQuestionIndex + 1} of 3 - {questions[currentQuestionIndex]?.category?.toUpperCase()}:
              </p>
            </div>
            <p className="text-sm text-yellow-800">{questions[currentQuestionIndex]?.question}</p>
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

      {/* Enhanced Progress Indicator */}
      {step !== 'idle' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">3-Question Workflow Progress:</span>
            <span className="text-sm text-gray-600">
              {step === 'processing' ? 'Analyzing & Generating Questions...' : 
               step === 'questions' ? `Question ${currentQuestionIndex + 1}/3` :
               step === 'compiling' ? 'Compiling Task Brief...' :
               step === 'structuring' ? 'Structuring Task...' :
               step === 'confirming' ? 'Awaiting Confirmation' :
               step === 'success' ? 'Complete!' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: step === 'processing' ? '15%' :
                       step === 'questions' ? `${15 + (currentQuestionIndex / 3) * 45}%` :
                       step === 'compiling' ? '70%' :
                       step === 'structuring' ? '85%' :
                       step === 'confirming' ? '95%' :
                       step === 'success' ? '100%' : '0%'
              }}
            />
          </div>
        </div>
      )}

      {/* Task Brief Preview */}
      {taskBrief && (step === 'confirming' || step === 'structuring') && (
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Complete Task Structure:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Title:</strong> {taskBrief.title}</p>
            <p><strong>Category:</strong> {taskBrief.category}</p>
            <p><strong>Priority:</strong> {taskBrief.priority} | <strong>Impact:</strong> {taskBrief.impact}</p>
            <p><strong>Subtasks:</strong> {taskBrief.subtasks.length} structured steps</p>
            <p><strong>Assignee:</strong> {taskBrief.assignee}</p>
            {taskBrief.similarTasks && (
              <p><strong>Similar Tasks Found:</strong> {taskBrief.similarTasks.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {step !== 'idle' && step !== 'success' && (
        <div className="text-center mb-6">
          <button
            onClick={resetVoiceInput}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span>Enhanced 3-Question Voice Workflow:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-purple-900 mb-1">A. Question Generation:</p>
            <ul className="space-y-1">
              <li>• Category identification</li>
              <li>• 3 targeted questions</li>
              <li>• Context, urgency, scope</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-purple-900 mb-1">B. Task Structuring:</p>
            <ul className="space-y-1">
              <li>• Complete task brief</li>
              <li>• Subtasks & priorities</li>
              <li>• Similar task detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};