import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Star, RefreshCw, Brain, Zap } from 'lucide-react';

interface SkillTip {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface BannerData {
  skillTips: SkillTip[];
  recentWins: string[];
  quickStats: {
    successRate: string;
    avgResponseTime: string;
    tasksThisMonth: string;
    clientSatisfaction: string;
  };
}

export const SkillReminder: React.FC = () => {
  const [currentTip, setCurrentTip] = useState(0);
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback data in case AI backend is unavailable
  const fallbackData: BannerData = {
    skillTips: [
      {
        title: 'Sales Excellence',
        description: 'Andries has closed 15+ major deals this quarter. Perfect for client negotiations and relationship building.',
        icon: 'TrendingUp',
        color: 'from-green-500 to-emerald-600'
      },
      {
        title: 'Marketing Strategy',
        description: 'Expert in digital campaigns and brand positioning. Ideal for content strategy and market analysis.',
        icon: 'Star',
        color: 'from-blue-500 to-cyan-600'
      },
      {
        title: 'Team Leadership',
        description: 'Successfully mentored 20+ team members. Great for training initiatives and team development.',
        icon: 'Lightbulb',
        color: 'from-purple-500 to-violet-600'
      },
      {
        title: 'AI Integration',
        description: 'Pioneered AI adoption in sales processes. Perfect for automation and tech implementation tasks.',
        icon: 'RefreshCw',
        color: 'from-orange-500 to-red-600'
      }
    ],
    recentWins: [
      'Exceeded Q3 sales target by 27%',
      'Launched successful product campaign',
      'Trained 50+ team members on AI tools',
      'Improved client retention by 35%'
    ],
    quickStats: {
      successRate: '98%',
      avgResponseTime: '2.3 hours',
      tasksThisMonth: '23',
      clientSatisfaction: '4.9/5'
    }
  };

  const fetchBannerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/taskade/webhooks/01K57CY3RGC9S6YNG1TZQKX251/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const aiBannerData = JSON.parse(data.body.bannerData);
        setBannerData(aiBannerData);
      } else {
        setBannerData(fallbackData);
      }
    } catch (error) {
      console.error('Error fetching AI banner data:', error);
      setBannerData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerData();
  }, []);

  useEffect(() => {
    if (bannerData?.skillTips) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % bannerData.skillTips.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [bannerData?.skillTips]);

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'TrendingUp': <TrendingUp className="h-5 w-5" />,
      'Star': <Star className="h-5 w-5" />,
      'Lightbulb': <Lightbulb className="h-5 w-5" />,
      'RefreshCw': <RefreshCw className="h-5 w-5" />,
      'Brain': <Brain className="h-5 w-5" />,
      'Zap': <Zap className="h-5 w-5" />
    };
    return iconMap[iconName] || <Star className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!bannerData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* AI-Powered Banner Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-4 border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">AI-Powered Insights</span>
        </div>
        <p className="text-xs text-purple-700">Live data from Andries Knowledge Base</p>
      </div>

      {/* Rotating Skill Tip */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">💡 Delegation Tip</h3>
          <div className="flex space-x-1">
            {bannerData.skillTips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentTip ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className={`bg-gradient-to-r ${bannerData.skillTips[currentTip].color} rounded-lg p-4 text-white`}>
          <div className="flex items-center space-x-2 mb-2">
            {getIconComponent(bannerData.skillTips[currentTip].icon)}
            <h4 className="font-semibold">{bannerData.skillTips[currentTip].title}</h4>
          </div>
          <p className="text-sm opacity-90">{bannerData.skillTips[currentTip].description}</p>
        </div>
      </div>

      {/* Recent Wins */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span>Recent Wins</span>
        </h3>
        
        <div className="space-y-3">
          {bannerData.recentWins.map((win, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-700">{win}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Success Rate</span>
            <span className="font-semibold text-green-600">{bannerData.quickStats.successRate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Response Time</span>
            <span className="font-semibold text-blue-600">{bannerData.quickStats.avgResponseTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tasks This Month</span>
            <span className="font-semibold text-purple-600">{bannerData.quickStats.tasksThisMonth}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Client Satisfaction</span>
            <span className="font-semibold text-yellow-600">{bannerData.quickStats.clientSatisfaction}</span>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💪 Best Practices</h3>
        
        <div className="space-y-3 text-sm">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-green-800">
              <strong>Clear deadlines</strong> help Andries prioritize and deliver exceptional results.
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-blue-800">
              <strong>Context matters</strong> - include background info for better task execution.
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-purple-800">
              <strong>Trust his expertise</strong> - give creative freedom for marketing and sales tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchBannerData}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh AI Insights</span>
        </button>
      </div>
    </div>
  );
};