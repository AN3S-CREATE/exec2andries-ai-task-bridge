import React from 'react';
import { Award, Briefcase, GraduationCap, Star, TrendingUp, Users, Zap, Target, User } from 'lucide-react';

export const AndriesProfile: React.FC = () => {
  const skills = [
    { name: 'Sales Strategy', level: 95, icon: <Target className="h-4 w-4" /> },
    { name: 'Marketing Campaigns', level: 90, icon: <TrendingUp className="h-4 w-4" /> },
    { name: 'Business Growth', level: 88, icon: <Briefcase className="h-4 w-4" /> },
    { name: 'Team Leadership', level: 92, icon: <Users className="h-4 w-4" /> },
    { name: 'AI Systems', level: 85, icon: <Zap className="h-4 w-4" /> },
    { name: 'Training & Mentorship', level: 94, icon: <GraduationCap className="h-4 w-4" /> }
  ];

  const recentWins = [
    {
      title: 'Q3 Sales Target Exceeded',
      description: 'Led team to achieve 127% of quarterly sales target',
      date: '2024-09-15',
      impact: 'High'
    },
    {
      title: 'New Client Onboarding System',
      description: 'Implemented streamlined onboarding reducing time by 40%',
      date: '2024-08-28',
      impact: 'Medium'
    },
    {
      title: 'AI Training Workshop Series',
      description: 'Delivered 5-part AI training series to 50+ team members',
      date: '2024-08-10',
      impact: 'High'
    }
  ];

  const categories = [
    { name: 'Sales', count: 12, color: 'bg-green-100 text-green-800' },
    { name: 'Marketing', count: 8, color: 'bg-blue-100 text-blue-800' },
    { name: 'Business Growth', count: 15, color: 'bg-purple-100 text-purple-800' },
    { name: 'Training', count: 6, color: 'bg-red-100 text-red-800' },
    { name: 'AI Systems', count: 4, color: 'bg-indigo-100 text-indigo-800' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center space-x-6">
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <User className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Andries Liebenberg</h2>
            <p className="text-blue-100 text-lg">Marketing & Business Growth Executive</p>
            <p className="text-blue-200">Veralogix Group</p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">45</div>
            <div className="text-sm text-blue-100">Tasks Completed</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">98%</div>
            <div className="text-sm text-blue-100">Success Rate</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">4.9</div>
            <div className="text-sm text-blue-100">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Skills & Expertise */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span>Skills & Expertise</span>
        </h3>
        
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600">{skill.icon}</div>
                  <span className="font-medium text-gray-900">{skill.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">{skill.level}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${skill.level}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Categories */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <span>Task Categories</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <span className="font-medium text-gray-900">{category.name}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                  {category.count} tasks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Wins */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <span>Recent Wins</span>
        </h3>
        
        <div className="space-y-4">
          {recentWins.map((win, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{win.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  win.impact === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {win.impact} Impact
                </span>
              </div>
              <p className="text-gray-600 mb-2">{win.description}</p>
              <p className="text-sm text-gray-500">{new Date(win.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delegation Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border border-green-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span>Delegation Tips</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-gray-700">
              <strong>Marketing tasks:</strong> Andries excels at campaign strategy and execution. Give him creative freedom.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-gray-700">
              <strong>Training projects:</strong> He's great at breaking down complex topics. Perfect for onboarding tasks.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-1">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-gray-700">
              <strong>Business growth:</strong> Provide clear metrics and deadlines. He thrives with specific targets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};