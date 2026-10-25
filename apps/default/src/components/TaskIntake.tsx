import React, { useState } from 'react';
import { Send, Sparkles, Clock, Target, AlertCircle } from 'lucide-react';

interface TaskIntakeProps {
  onTaskCreated: () => void;
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  type: 'multiple' | 'yesno' | 'text';
  options?: string[];
}

export const TaskIntake: React.FC<TaskIntakeProps> = ({ onTaskCreated }) => {
  const [taskInput, setTaskInput] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateQuestions = (task: string): ClarifyingQuestion[] => {
    // AI-powered question generation based on task content
    const baseQuestions: ClarifyingQuestion[] = [
      {
        id: 'priority',
        question: 'How urgent is this task?',
        type: 'multiple',
        options: ['Low - Can wait a week', 'Medium - Within 3 days', 'High - Within 24 hours', 'Urgent - ASAP']
      },
      {
        id: 'category',
        question: 'Which area does this task belong to?',
        type: 'multiple',
        options: ['Sales', 'Marketing', 'Business Growth', 'Training', 'Events', 'AI Systems']
      },
      {
        id: 'deadline',
        question: 'When should this be completed?',
        type: 'text'
      }
    ];

    // Smart question selection based on task content
    if (task.toLowerCase().includes('marketing') || task.toLowerCase().includes('campaign')) {
      baseQuestions[1].options = ['Marketing', 'Sales', 'Business Growth'];
    }
    
    if (task.toLowerCase().includes('urgent') || task.toLowerCase().includes('asap')) {
      baseQuestions[0].options = ['High - Within 24 hours', 'Urgent - ASAP'];
    }

    return baseQuestions;
  };

  const handleInitialSubmit = () => {
    if (!taskInput.trim()) return;
    
    const generatedQuestions = generateQuestions(taskInput);
    setQuestions(generatedQuestions);
    setShowQuestions(true);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Map answers to API format
      const priorityMap: Record<string, string> = {
        'Low - Can wait a week': 'low',
        'Medium - Within 3 days': 'medium',
        'High - Within 24 hours': 'high',
        'Urgent - ASAP': 'urgent'
      };

      const categoryMap: Record<string, string> = {
        'Sales': 'sales',
        'Marketing': 'marketing',
        'Business Growth': 'business-growth',
        'Training': 'training',
        'Events': 'events',
        'AI Systems': 'ai-systems'
      };

      const formData = {
        taskTitle: taskInput,
        taskDescription: `Executive delegated task with clarifications: ${JSON.stringify(answers)}`,
        priority: priorityMap[answers.priority] || 'medium',
        category: categoryMap[answers.category] || 'business-growth',
        deadline: answers.deadline ? new Date(answers.deadline).toISOString() : undefined
      };

      const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setTaskInput('');
          setShowQuestions(false);
          setAnswers({});
          setSuccess(false);
          onTaskCreated();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTaskInput('');
    setShowQuestions(false);
    setAnswers({});
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Task Created Successfully!</h3>
        <p className="text-gray-600 mb-4">Andries has been notified and the task is now in the dashboard.</p>
        <button
          onClick={resetForm}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Another Task
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Task Delegation</h2>
        <p className="text-gray-600">
          Describe what you need done. I'll ask 3 quick questions to make it perfect for Andries.
        </p>
      </div>

      {!showQuestions ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What needs to be done?
            </label>
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g., Review Q4 marketing strategy, Set up client onboarding process, Prepare sales presentation..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          
          <button
            onClick={handleInitialSubmit}
            disabled={!taskInput.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-5 w-5" />
            <span>Generate Smart Questions</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Task: {taskInput}</h3>
            <p className="text-blue-700 text-sm">Answer these 3 questions to optimize the task for Andries:</p>
          </div>

          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                  {index + 1}
                </span>
                {question.question}
              </label>
              
              {question.type === 'multiple' && question.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerChange(question.id, option)}
                      className={`p-3 text-left border rounded-lg transition-colors ${
                        answers[question.id] === option
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              
              {question.type === 'text' && (
                <input
                  type={question.id === 'deadline' ? 'date' : 'text'}
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={question.id === 'deadline' ? 'Select deadline' : 'Type your answer...'}
                />
              )}
            </div>
          ))}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={loading || Object.keys(answers).length < questions.length}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Create Task for Andries</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};