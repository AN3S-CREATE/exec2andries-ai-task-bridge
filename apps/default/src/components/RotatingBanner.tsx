import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Award, Brain, Zap, Target } from 'lucide-react';

interface BannerItem {
  type: 'skill' | 'stat' | 'win';
  content: string;
  icon: React.ReactNode;
  color: string;
}

export const RotatingBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultBannerItems: BannerItem[] = [
    {
      type: 'skill',
      content: 'Andries can design ROI-driven event strategies with 300%+ average returns.',
      icon: <Target className="h-4 w-4" />,
      color: 'from-cyan-400 to-blue-500'
    },
    {
      type: 'stat',
      content: 'Delivered $8.3M+ in sales over 11 years with 98% client satisfaction.',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'from-green-400 to-cyan-500'
    },
    {
      type: 'win',
      content: 'Launched AI-powered onboarding system reducing time by 40%.',
      icon: <Award className="h-4 w-4" />,
      color: 'from-purple-400 to-pink-500'
    },
    {
      type: 'skill',
      content: 'Expert in B2B relationship building with 127% target achievement rate.',
      icon: <Star className="h-4 w-4" />,
      color: 'from-orange-400 to-red-500'
    },
    {
      type: 'win',
      content: 'Trained 50+ team members on AI tools with 95% retention success.',
      icon: <Zap className="h-4 w-4" />,
      color: 'from-indigo-400 to-purple-500'
    },
    {
      type: 'stat',
      content: 'Average response time: 2.3 hours with 98% task completion rate.',
      icon: <Brain className="h-4 w-4" />,
      color: 'from-pink-400 to-rose-500'
    }
  ];

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
        try {
          const bannerData = JSON.parse(data.body.bannerData);
          
          const aiGeneratedItems: BannerItem[] = [];
          
          if (bannerData.skillTips && Array.isArray(bannerData.skillTips)) {
            bannerData.skillTips.forEach((tip: any) => {
              aiGeneratedItems.push({
                type: 'skill',
                content: tip.description || tip.title,
                icon: getIconForType(tip.icon || 'target'),
                color: tip.color || 'from-cyan-400 to-blue-500'
              });
            });
          }

          if (bannerData.recentWins && Array.isArray(bannerData.recentWins)) {
            bannerData.recentWins.forEach((win: string) => {
              aiGeneratedItems.push({
                type: 'win',
                content: win,
                icon: <Award className="h-4 w-4" />,
                color: 'from-purple-400 to-pink-500'
              });
            });
          }

          if (bannerData.quickStats) {
            const stats = bannerData.quickStats;
            if (stats.successRate) {
              aiGeneratedItems.push({
                type: 'stat',
                content: `Maintains ${stats.successRate} task success rate with exceptional quality.`,
                icon: <TrendingUp className="h-4 w-4" />,
                color: 'from-green-400 to-cyan-500'
              });
            }
            if (stats.avgResponseTime) {
              aiGeneratedItems.push({
                type: 'stat',
                content: `Average response time: ${stats.avgResponseTime} with priority handling.`,
                icon: <Zap className="h-4 w-4" />,
                color: 'from-orange-400 to-red-500'
              });
            }
            if (stats.clientSatisfaction) {
              aiGeneratedItems.push({
                type: 'stat',
                content: `Client satisfaction: ${stats.clientSatisfaction} with consistent excellence.`,
                icon: <Star className="h-4 w-4" />,
                color: 'from-pink-400 to-rose-500'
              });
            }
          }

          if (aiGeneratedItems.length > 0) {
            setBannerItems(aiGeneratedItems);
          } else {
            setBannerItems(defaultBannerItems);
          }
        } catch (parseError) {
          console.error('Error parsing AI banner data:', parseError);
          setBannerItems(defaultBannerItems);
        }
      } else {
        setBannerItems(defaultBannerItems);
      }
    } catch (error) {
      console.error('Error fetching banner data:', error);
      setBannerItems(defaultBannerItems);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (iconName: string): React.ReactNode => {
    switch (iconName.toLowerCase()) {
      case 'target':
        return <Target className="h-4 w-4" />;
      case 'trending':
      case 'trendingup':
        return <TrendingUp className="h-4 w-4" />;
      case 'star':
        return <Star className="h-4 w-4" />;
      case 'award':
        return <Award className="h-4 w-4" />;
      case 'zap':
        return <Zap className="h-4 w-4" />;
      case 'brain':
        return <Brain className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchBannerData();
    const refreshInterval = setInterval(fetchBannerData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (bannerItems.length === 0) return;

    const rotateInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
    }, 8000);

    return () => clearInterval(rotateInterval);
  }, [bannerItems.length]);

  if (loading || bannerItems.length === 0) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-400 border-t-transparent"></div>
            <div>
              <h3 className="font-semibold text-white text-sm">Loading Andries' Knowledge...</h3>
              <p className="text-xs text-gray-400">Fetching latest skills and achievements</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = bannerItems[currentIndex];

  return (
    <div className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${currentItem.color} opacity-20 rounded-2xl blur animate-pulse`}></div>
      <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 transition-all duration-1000 ease-in-out">
        <div className="flex items-start space-x-3">
          <div className={`bg-gradient-to-r ${currentItem.color} p-2 rounded-xl flex-shrink-0 shadow-lg`}>
            <div className="text-white">
              {currentItem.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Brain className="h-3 w-3 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {currentItem.type === 'skill' ? 'Expertise' : 
                 currentItem.type === 'stat' ? 'Performance' : 'Recent Win'}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-white">
              {currentItem.content}
            </p>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex space-x-1 mt-4">
          {bannerItems.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentIndex 
                  ? `bg-gradient-to-r ${currentItem.color} flex-1` 
                  : 'bg-gray-600 w-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Subtle animation indicator */}
      <div className="absolute top-2 right-2">
        <div className="bg-gray-700/50 rounded-full p-1">
          <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};