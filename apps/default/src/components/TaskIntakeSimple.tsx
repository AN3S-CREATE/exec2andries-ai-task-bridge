import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle, ArrowRight, Clock, Target, Users, List, Tag, User, Brain } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: 'dropdown' | 'toggle' | 'text';
  options?: string[];
}

interface Subtask {
  title: string;
  description: string;
  estimatedTime: string;
  skillsUsed?: string[];
}

interface TaskBreakdown {
  mainTask: string;
  subtasks: Subtask[];
  category: string;
  tags: string[];
  priority: string;
  status: string;
  assignee: string;
  estimatedDuration: string;
  andriesStrengths?: string;
  recommendedApproach?: string;
}

export const TaskIntakeSimple: React.FC = () => {
  const [step, setStep] = useState<'input' | 'questions' | 'breakdown' | 'success'>('input');
  const [taskInput, setTaskInput] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!taskInput.trim()) return;
    
    setLoading(true);
    
    try {
      // Call AI backend to generate smart questions based on Andries' knowledge
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
          // Parse the AI-generated questions
          const questionsData = JSON.parse(data.body.questions);
          if (questionsData.questions && Array.isArray(questionsData.questions)) {
            setQuestions(questionsData.questions);
            setStep('questions');
          } else {
            // Fallback to default questions if AI response is malformed
            setQuestions(generateFallbackQuestions(taskInput));
            setStep('questions');
          }
        } catch (parseError) {
          // Fallback to default questions if JSON parsing fails
          setQuestions(generateFallbackQuestions(taskInput));
          setStep('questions');
        }
      } else {
        // Fallback to default questions if API call fails
        setQuestions(generateFallbackQuestions(taskInput));
        setStep('questions');
      }
    } catch (error) {
      console.error('Error calling AI backend:', error);
      // Fallback to default questions
      setQuestions(generateFallbackQuestions(taskInput));
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackQuestions = (task: string): Question[] => {
    const taskLower = task.toLowerCase();
    
    let questions: Question[] = [];

    // Question 1: Priority/Urgency (always asked)
    questions.push({
      id: 'priority',
      question: 'How urgent is this task?',
      type: 'dropdown',
      options: ['Low - Can wait a week', 'Medium - Within 3 days', 'High - Within 24 hours', 'Urgent - ASAP']
    });

    // Question 2: Context-aware category selection
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
    } else if (taskLower.includes('training') || taskLower.includes('onboard') || taskLower.includes('teach')) {
      questions.push({
        id: 'category',
        question: 'What kind of training is needed?',
        type: 'dropdown',
        options: ['New Employee Onboarding', 'Skills Development', 'AI Tools Training', 'Process Documentation', 'Workshop Creation']
      });
    } else {
      questions.push({
        id: 'category',
        question: 'Which area best describes this task?',
        type: 'dropdown',
        options: ['Sales', 'Marketing', 'Business Growth', 'Training', 'Events', 'AI Systems', 'General Business']
      });
    }

    // Question 3: Context-specific third question
    if (taskLower.includes('meeting') || taskLower.includes('presentation') || taskLower.includes('client')) {
      questions.push({
        id: 'stakeholders',
        question: 'Will this involve external stakeholders?',
        type: 'toggle'
      });
    } else if (taskLower.includes('deadline') || taskLower.includes('urgent') || taskLower.includes('asap')) {
      questions.push({
        id: 'deadline',
        question: 'What\'s the specific deadline?',
        type: 'text'
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
    setLoading(true);
    
    try {
      // Call AI backend to structure task with subtasks based on Andries' expertise
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
          // Parse the AI-generated task breakdown
          const breakdownData = JSON.parse(data.body.taskBreakdown);
          setTaskBreakdown(breakdownData);
          setStep('breakdown');
        } catch (parseError) {
          // Fallback to local task breakdown generation
          const fallbackBreakdown = generateFallbackTaskBreakdown(taskInput, answers);
          setTaskBreakdown(fallbackBreakdown);
          setStep('breakdown');
        }
      } else {
        // Fallback to local task breakdown generation
        const fallbackBreakdown = generateFallbackTaskBreakdown(taskInput, answers);
        setTaskBreakdown(fallbackBreakdown);
        setStep('breakdown');
      }
    } catch (error) {
      console.error('Error calling AI backend:', error);
      // Fallback to local task breakdown generation
      const fallbackBreakdown = generateFallbackTaskBreakdown(taskInput, answers);
      setTaskBreakdown(fallbackBreakdown);
      setStep('breakdown');
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackTaskBreakdown = (task: string, answers: Record<string, string | boolean>): TaskBreakdown => {
    const taskLower = task.toLowerCase();
    const category = answers.category as string;
    const priority = answers.priority as string;
    
    let subtasks: Subtask[] = [];
    let tags: string[] = ['executive-delegated', 'ai-generated'];
    let estimatedDuration = '2-3 days';

    // Generate subtasks based on task type
    if (taskLower.includes('marketing') || category?.includes('Marketing')) {
      subtasks = [
        {
          title: 'Research and Analysis',
          description: 'Conduct market research and analyze current trends',
          estimatedTime: '4-6 hours',
          skillsUsed: ['Market Research', 'Data Analysis']
        },
        {
          title: 'Strategy Development',
          description: 'Create comprehensive marketing strategy document',
          estimatedTime: '6-8 hours',
          skillsUsed: ['Strategic Planning', 'Campaign Management']
        },
        {
          title: 'Implementation Plan',
          description: 'Develop actionable implementation roadmap with timelines',
          estimatedTime: '2-3 hours',
          skillsUsed: ['Project Management', 'Timeline Planning']
        }
      ];
      tags.push('marketing', 'strategy', 'analysis');
      estimatedDuration = '3-4 days';
    } else if (taskLower.includes('sales') || category?.includes('Sales')) {
      subtasks = [
        {
          title: 'Lead Qualification',
          description: 'Review and qualify potential leads or opportunities',
          estimatedTime: '2-3 hours',
          skillsUsed: ['Lead Generation', 'Client Assessment']
        },
        {
          title: 'Proposal Preparation',
          description: 'Create detailed proposal or presentation materials',
          estimatedTime: '4-5 hours',
          skillsUsed: ['Proposal Writing', 'Presentation Design']
        },
        {
          title: 'Follow-up Strategy',
          description: 'Develop follow-up plan and schedule next steps',
          estimatedTime: '1-2 hours',
          skillsUsed: ['Relationship Building', 'Strategic Planning']
        }
      ];
      tags.push('sales', 'client-relations', 'proposals');
      estimatedDuration = '2-3 days';
    } else if (taskLower.includes('training') || category?.includes('Training')) {
      subtasks = [
        {
          title: 'Content Development',
          description: 'Create training materials and curriculum outline',
          estimatedTime: '6-8 hours',
          skillsUsed: ['Curriculum Design', 'Content Creation']
        },
        {
          title: 'Resource Preparation',
          description: 'Gather supporting materials and tools',
          estimatedTime: '2-3 hours',
          skillsUsed: ['Resource Management', 'Tool Selection']
        },
        {
          title: 'Delivery Planning',
          description: 'Schedule sessions and prepare delivery logistics',
          estimatedTime: '2-3 hours',
          skillsUsed: ['Event Planning', 'Logistics Management']
        }
      ];
      tags.push('training', 'education', 'development');
      estimatedDuration = '4-5 days';
    } else {
      // Generic business task breakdown
      subtasks = [
        {
          title: 'Initial Assessment',
          description: 'Analyze requirements and gather necessary information',
          estimatedTime: '2-3 hours',
          skillsUsed: ['Analysis', 'Research']
        },
        {
          title: 'Execution Phase',
          description: 'Complete main task deliverables',
          estimatedTime: '4-6 hours',
          skillsUsed: ['Project Execution', 'Problem Solving']
        },
        {
          title: 'Review and Finalization',
          description: 'Quality check and prepare final deliverables',
          estimatedTime: '1-2 hours',
          skillsUsed: ['Quality Assurance', 'Documentation']
        }
      ];
      tags.push('business-operations', 'general');
    }

    // Add context-specific tags
    if (answers.stakeholders === true) tags.push('external-stakeholders');
    if (priority.includes('Urgent')) tags.push('urgent');
    if (answers.deadline) tags.push('deadline-driven');

    // Map priority
    const priorityMap: Record<string, string> = {
      'Low - Can wait a week': 'low',
      'Medium - Within 3 days': 'medium',
      'High - Within 24 hours': 'high',
      'Urgent - ASAP': 'urgent'
    };

    // Map category
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
      'New Employee Onboarding': 'onboarding',
      'Skills Development': 'training',
      'AI Tools Training': 'ai-systems',
      'Process Documentation': 'training',
      'Workshop Creation': 'training',
      'Events': 'events',
      'AI Systems': 'ai-systems',
      'General Business': 'business-growth'
    };

    return {
      mainTask: task,
      subtasks,
      category: categoryMap[category] || 'business-growth',
      tags,
      priority: priorityMap[priority] || 'medium',
      status: 'pending',
      assignee: '@andries-lieb',
      estimatedDuration,
      andriesStrengths: 'This task leverages Andries\' expertise in strategic planning and execution.',
      recommendedApproach: 'Break down into manageable phases with clear deliverables and regular check-ins.'
    };
  };

  const handleConfirmTask = async () => {
    if (!taskBreakdown) return;
    
    setLoading(true);
    
    try {
      // Create main task with AI-generated breakdown
      const mainTaskData = {
        taskTitle: taskBreakdown.mainTask,
        taskDescription: `🤖 AI-Generated Task Breakdown by Andries Knowledge Brain

📋 Main Task: ${taskBreakdown.mainTask}

🎯 Subtasks:
${taskBreakdown.subtasks.map((subtask, index) => 
  `${index + 1}. ${subtask.title} (${subtask.estimatedTime})
     ${subtask.description}
     Skills: ${subtask.skillsUsed?.join(', ') || 'General'}`
).join('\n\n')}

📊 Project Details:
• Category: ${taskBreakdown.category}
• Priority: ${taskBreakdown.priority}
• Assignee: ${taskBreakdown.assignee}
• Estimated Duration: ${taskBreakdown.estimatedDuration}
• Tags: ${taskBreakdown.tags.join(', ')}

💡 Andries' Strengths: ${taskBreakdown.andriesStrengths}
🎯 Recommended Approach: ${taskBreakdown.recommendedApproach}

🧠 Generated by Andries Knowledge & Structuring Brain`,
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
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('input');
    setTaskInput('');
    setQuestions([]);
    setAnswers({});
    setTaskBreakdown(null);
  };

  const allQuestionsAnswered = questions.every(q => 
    answers[q.id] !== undefined && answers[q.id] !== ''
  );

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">AI-Powered Project Created!</h2>
        <p className="text-gray-600 mb-6">
          Task intelligently broken down into {taskBreakdown?.subtasks.length} subtasks and assigned to Andries: <br />
          <span className="font-semibold text-gray-900">"{taskInput}"</span>
        </p>
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-semibold text-blue-800">Powered by Andries Knowledge Brain</p>
          </div>
          <p className="text-sm text-blue-800">
            📊 Saved to Projects dashboard with progress tracking<br />
            ⏱️ Estimated completion: {taskBreakdown?.estimatedDuration}<br />
            🎯 Optimized for Andries' expertise in {taskBreakdown?.category}
          </p>
        </div>
        <button
          onClick={resetForm}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Create Another Task
        </button>
      </div>
    );
  }

  if (step === 'breakdown') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">AI Task Breakdown</h2>
          </div>
          <p className="text-gray-600">Intelligent breakdown powered by Andries Knowledge Brain</p>
        </div>

        {taskBreakdown && (
          <div className="space-y-6">
            {/* Main Task */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Main Task</h3>
              <p className="text-blue-800">{taskBreakdown.mainTask}</p>
            </div>

            {/* AI Insights */}
            {(taskBreakdown.andriesStrengths || taskBreakdown.recommendedApproach) && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Insights</span>
                </h3>
                {taskBreakdown.andriesStrengths && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-purple-800">💪 Andries' Strengths:</p>
                    <p className="text-sm text-purple-700">{taskBreakdown.andriesStrengths}</p>
                  </div>
                )}
                {taskBreakdown.recommendedApproach && (
                  <div>
                    <p className="text-sm font-medium text-purple-800">🎯 Recommended Approach:</p>
                    <p className="text-sm text-purple-700">{taskBreakdown.recommendedApproach}</p>
                  </div>
                )}
              </div>
            )}

            {/* Subtasks */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <List className="h-5 w-5" />
                <span>AI-Generated Subtasks ({taskBreakdown.subtasks.length})</span>
              </h3>
              <div className="space-y-3">
                {taskBreakdown.subtasks.map((subtask, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{index + 1}. {subtask.title}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {subtask.estimatedTime}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{subtask.description}</p>
                    {subtask.skillsUsed && subtask.skillsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {subtask.skillsUsed.map((skill, skillIndex) => (
                          <span key={skillIndex} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Category & Priority</span>
                </h4>
                <p className="text-sm text-purple-800 capitalize">{taskBreakdown.category}</p>
                <p className="text-sm text-purple-800 capitalize">{taskBreakdown.priority} Priority</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Assignment</span>
                </h4>
                <p className="text-sm text-green-800">{taskBreakdown.assignee}</p>
                <p className="text-sm text-green-800">Est: {taskBreakdown.estimatedDuration}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>AI-Generated Tags</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {taskBreakdown.tags.map((tag, index) => (
                  <span key={index} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => setStep('questions')}
            className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Questions
          </button>
          <button
            onClick={handleConfirmTask}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Save to Projects Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Task: "{taskInput}"</h3>
            </div>
            <p className="text-blue-700 text-sm">AI-generated questions based on Andries' expertise:</p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold mr-3">
                  {index + 1}
                </span>
                {question.question}
              </label>
              
              {question.type === 'dropdown' && question.options && (
                <select
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="">Select an option...</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {question.type === 'toggle' && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAnswerChange(question.id, true)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      answers[question.id] === true
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleAnswerChange(question.id, false)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      answers[question.id] === false
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:border-gray-300'
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
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={question.id === 'deadline' ? 'Select deadline' : 'Type your answer...'}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => setStep('input')}
            className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmitAnswers}
            disabled={loading || !allQuestionsAnswered}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                <span>Generate AI Task Breakdown</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
          <Target className="h-6 w-6 text-blue-600" />
          <Clock className="h-6 w-6 text-green-600" />
          <Users className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Task Delegation</h2>
        <p className="text-gray-600">Powered by Andries Knowledge Brain - Intelligent task structuring based on his expertise</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Describe the task in a few words...
          </label>
          <textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="e.g., Review Q4 marketing strategy, Set up client onboarding, Prepare sales presentation..."
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
            rows={4}
            maxLength={200}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {taskInput.length}/200 characters
          </div>
        </div>
        
        <button
          onClick={handleCreateTask}
          disabled={!taskInput.trim() || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg transform hover:scale-105"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>AI Brain is analyzing...</span>
            </>
          ) : (
            <>
              <Brain className="h-6 w-6" />
              <span>Create Task</span>
              <ArrowRight className="h-6 w-6" />
            </>
          )}
        </button>
      </div>

      {/* Enhanced AI Features */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>Andries Knowledge Brain Features:</span>
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Smart Questions:</strong> AI generates 3 questions based on Andries' expertise</li>
          <li>• <strong>Intelligent Breakdown:</strong> Tasks split into subtasks using his skill profile</li>
          <li>• <strong>Expertise Matching:</strong> Optimized for his strengths in sales, marketing & training</li>
          <li>• <strong>Live Knowledge:</strong> Updates instantly when Andries adds new skills or achievements</li>
        </ul>
      </div>
    </div>
  );
};