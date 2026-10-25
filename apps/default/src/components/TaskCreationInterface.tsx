import React, { useState, useEffect } from 'react';
import { Send, Sparkles, CheckCircle, ArrowRight, Clock, Target, Users, Brain, AlertCircle, Camera, Scan } from 'lucide-react';
import { CameraDocumentScanner } from './CameraDocumentScanner';

interface Question {
  id: string;
  question: string;
  type: 'dropdown' | 'toggle' | 'text';
  options?: string[];
}

interface TaskCreationInterfaceProps {
  onTaskCreated?: () => void;
  prefilledTask?: {
    taskTitle: string;
    taskDescription: string;
    priority: string;
    category: string;
  } | null;
}

export const TaskCreationInterface: React.FC<TaskCreationInterfaceProps> = ({ onTaskCreated, prefilledTask }) => {
  const [step, setStep] = useState<'input' | 'questions' | 'creating' | 'success'>('input');
  const [taskInput, setTaskInput] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Handle prefilled task from capabilities guide
  useEffect(() => {
    if (prefilledTask) {
      setTaskInput(prefilledTask.taskTitle);
      // Auto-fill some answers based on the template
      setAnswers({
        priority: prefilledTask.priority === 'high' ? 'High - Within 24 hours' : 
                 prefilledTask.priority === 'urgent' ? 'Urgent - ASAP' : 'Medium - Within 3 days',
        category: prefilledTask.category
      });
    }
  }, [prefilledTask]);

  const handleCreateTask = async () => {
    if (!taskInput.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/taskade/webhooks/01K57CQXCGZ8VQA279H0JMW9SK/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription: taskInput
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const questionsData = JSON.parse(data.body.questions);
          if (questionsData.questions && Array.isArray(questionsData.questions)) {
            setQuestions(questionsData.questions);
            setStep('questions');
          } else {
            setQuestions(generateFallbackQuestions(taskInput));
            setStep('questions');
          }
        } catch (parseError) {
          setQuestions(generateFallbackQuestions(taskInput));
          setStep('questions');
        }
      } else {
        setQuestions(generateFallbackQuestions(taskInput));
        setStep('questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions(generateFallbackQuestions(taskInput));
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackQuestions = (task: string): Question[] => {
    const taskLower = task.toLowerCase();
    
    let questions: Question[] = [];

    questions.push({
      id: 'priority',
      question: 'How urgent is this task?',
      type: 'dropdown',
      options: ['Low - Can wait a week', 'Medium - Within 3 days', 'High - Within 24 hours', 'Urgent - ASAP']
    });

    if (taskLower.includes('marketing') || taskLower.includes('campaign') || taskLower.includes('brand')) {
      questions.push({
        id: 'category',
        question: 'Which marketing area does this focus on?',
        type: 'dropdown',
        options: ['Digital Marketing', 'Content Strategy', 'Brand Positioning', 'Campaign Management', 'Market Research']
      });
    } else if (taskLower.includes('sales') || taskLower.includes('client') || taskLower.includes('deal')) {
      questions.push({
        id: 'category',
        question: 'What type of sales activity is this?',
        type: 'dropdown',
        options: ['Lead Generation', 'Client Meetings', 'Proposal Creation', 'Deal Closing', 'Relationship Building']
      });
    } else {
      questions.push({
        id: 'category',
        question: 'Which area best describes this task?',
        type: 'dropdown',
        options: ['Sales', 'Marketing', 'Business Growth', 'Training', 'Events', 'AI Systems', 'General Business']
      });
    }

    if (taskLower.includes('meeting') || taskLower.includes('presentation') || taskLower.includes('client')) {
      questions.push({
        id: 'stakeholders',
        question: 'Will this involve external stakeholders?',
        type: 'toggle'
      });
    } else {
      questions.push({
        id: 'context',
        question: 'Any additional context or requirements?',
        type: 'text'
      });
    }

    return questions;
  };

  const handleAnswerChange = (questionId: string, value: string | boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswers = async () => {
    setStep('creating');
    setLoading(true);
    setError('');
    
    try {
      const structureResponse = await fetch('/api/taskade/webhooks/01K57CWWSPHZE5ZCTBK2ZX3T6P/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription: taskInput,
          taskAnswers: JSON.stringify(answers)
        }),
      });

      let taskBreakdown = null;
      if (structureResponse.ok) {
        const structureData = await structureResponse.json();
        try {
          taskBreakdown = JSON.parse(structureData.body.taskBreakdown);
        } catch (parseError) {
          console.log('Could not parse task breakdown, using fallback');
        }
      }

      const priorityMap: Record<string, string> = {
        'Low - Can wait a week': 'low',
        'Medium - Within 3 days': 'medium',
        'High - Within 24 hours': 'high',
        'Urgent - ASAP': 'urgent'
      };

      const categoryMap: Record<string, string> = {
        'Sales': 'sales',
        'Marketing': 'marketing',
        'Digital Marketing': 'marketing',
        'Content Strategy': 'marketing',
        'Brand Positioning': 'marketing',
        'Campaign Management': 'marketing',
        'Market Research': 'marketing',
        'Lead Generation': 'sales',
        'Client Meetings': 'sales',
        'Proposal Creation': 'sales',
        'Deal Closing': 'sales',
        'Relationship Building': 'sales',
        'Business Growth': 'business-growth',
        'Training': 'training',
        'Events': 'events',
        'AI Systems': 'ai-systems',
        'General Business': 'business-growth'
      };

      let taskDescription = prefilledTask ? prefilledTask.taskDescription : `📋 Task: ${taskInput}\n\n🤖 AI-Generated Clarifications:\n`;
      
      if (!prefilledTask) {
        questions.forEach((q, index) => {
          const answer = answers[q.id];
          taskDescription += `${index + 1}. ${q.question}\n   Answer: ${answer}\n\n`;
        });
      }

      if (taskBreakdown) {
        taskDescription += `🧠 AI Task Breakdown:\n`;
        if (taskBreakdown.subtasks && Array.isArray(taskBreakdown.subtasks)) {
          taskDescription += `Subtasks:\n`;
          taskBreakdown.subtasks.forEach((subtask: any, index: number) => {
            taskDescription += `${index + 1}. ${subtask.title} (${subtask.estimatedTime || 'TBD'})\n   ${subtask.description || ''}\n\n`;
          });
        }
        if (taskBreakdown.andriesStrengths) {
          taskDescription += `💪 Andries' Strengths: ${taskBreakdown.andriesStrengths}\n`;
        }
        if (taskBreakdown.recommendedApproach) {
          taskDescription += `🎯 Recommended Approach: ${taskBreakdown.recommendedApproach}\n`;
        }
      }

      taskDescription += `\n✨ Created via AI-Powered Task Creation Interface${prefilledTask ? ' (From Capabilities Guide)' : ''}`;

      const formData = {
        taskTitle: taskInput,
        taskDescription: taskDescription,
        priority: priorityMap[answers.priority as string] || prefilledTask?.priority || 'medium',
        category: categoryMap[answers.category as string] || prefilledTask?.category || 'business-growth',
        deadline: answers.deadline ? new Date(answers.deadline as string).toISOString() : undefined
      };

      const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStep('success');
        if (onTaskCreated) {
          onTaskCreated();
        }
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again.');
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('input');
    setTaskInput('');
    setQuestions([]);
    setAnswers({});
    setError('');
  };

  const allQuestionsAnswered = questions.every(q => 
    answers[q.id] !== undefined && answers[q.id] !== ''
  );

  if (step === 'success') {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full blur opacity-50 animate-pulse"></div>
            <div className="relative bg-gray-900 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-green-500/50">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Task Created!</h2>
          <p className="text-gray-300 mb-6 text-sm">
            {prefilledTask ? 'Capabilities-guided task saved to Andries\' dashboard' : 'AI processed your task and saved it to Andries\' dashboard'}
          </p>
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <p className="text-sm font-semibold text-cyan-400">AI Workflow Complete</p>
            </div>
            <p className="text-xs text-gray-400">
              {prefilledTask ? '🎯 Template → 🤖 AI Questions → 🧠 Structure → 📊 Dashboard' : '📝 Task → 🤖 3 Questions → 🧠 AI Structure → 📊 Dashboard'}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="relative overflow-hidden w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            <span className="relative">Create Another Task</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'creating') {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-50 animate-pulse"></div>
            <div className="relative bg-gray-900 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-blue-500/50">
              <Brain className="h-8 w-8 text-blue-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">AI Compiling...</h2>
          <p className="text-gray-300 mb-6 text-sm">
            Processing answers and creating structured task
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-blue-400 text-sm">Task: "{taskInput}"</h3>
            </div>
            <p className="text-gray-400 text-xs">
              {prefilledTask ? 'Capabilities-guided questions' : 'AI-generated questions based on Andries\' expertise'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur"></div>
              <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <label className="block text-sm font-semibold text-white mb-3">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 text-black px-2 py-1 rounded-full text-xs font-bold mr-2">
                    {index + 1}
                  </span>
                  {question.question}
                </label>
                
                {question.type === 'dropdown' && question.options && (
                  <select
                    value={answers[question.id] as string || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  >
                    <option value="">Select an option...</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                
                {question.type === 'toggle' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAnswerChange(question.id, true)}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                        answers[question.id] === true
                          ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-green-400'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswerChange(question.id, false)}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                        answers[question.id] === false
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-red-400'
                      }`}
                    >
                      No
                    </button>
                  </div>
                )}
                
                {question.type === 'text' && (
                  <input
                    type={question.id === 'deadline' ? 'date' : 'text'}
                    value={answers[question.id] as string || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder={question.id === 'deadline' ? 'Select deadline' : 'Type your answer...'}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={() => setStep('input')}
            className="flex-1 bg-gray-800 text-gray-300 py-3 px-4 rounded-xl font-semibold border border-gray-600 hover:border-gray-500 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmitAnswers}
            disabled={loading || !allQuestionsAnswered}
            className="flex-1 relative overflow-hidden bg-gradient-to-r from-green-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Compile Brief</span>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Brain className="h-6 w-6 text-purple-400" />
          <Target className="h-5 w-5 text-cyan-400" />
          <Clock className="h-5 w-5 text-green-400" />
          <Users className="h-5 w-5 text-pink-400" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          AI Task Creation
        </h2>
        <p className="text-gray-400 text-sm">
          {prefilledTask ? 'Capabilities-guided task creation' : 'Describe your task and let AI ask 3 clarifying questions'}
        </p>
      </div>

      {prefilledTask && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-cyan-500/10 to-blue-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Pre-filled from Capabilities Guide</span>
            </div>
            <p className="text-xs text-gray-300">Task template loaded with Andries' proven expertise and approach</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
          <label className="block text-sm font-semibold text-white mb-3">
            Describe the task in a few words...
          </label>
          <textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="e.g., Review Q4 marketing strategy, Set up client onboarding..."
            className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            rows={4}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-500 mt-2">
            {taskInput.length}/200 characters
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowScanner(true)}
          className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Scan Doc</span>
          </div>
        </button>
        
        <button
          onClick={handleCreateTask}
          disabled={!taskInput.trim() || loading}
          className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
          {loading ? (
            <div className="relative flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Create</span>
            </div>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl blur"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <h4 className="font-semibold text-white mb-2 flex items-center space-x-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span>How it works:</span>
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong className="text-cyan-400">Step 1:</strong> Describe your task or scan a document</li>
            <li>• <strong className="text-purple-400">Step 2:</strong> AI asks exactly 3 clarifying questions</li>
            <li>• <strong className="text-pink-400">Step 3:</strong> AI compiles full task brief and saves to dashboard</li>
          </ul>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraDocumentScanner
          onScanComplete={(extractedText) => {
            setTaskInput(extractedText);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};