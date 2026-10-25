import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, TrendingUp, Star, Award, Brain, Zap, Target, Users, Briefcase, Lightbulb, Calendar, Settings } from 'lucide-react';

interface Capability {
  id: string;
  category: string;
  icon: string;
  capabilities: string;
  exampleTasks: string[];
  stats: string[];
  wins: string[];
  suggestedTemplate: {
    title: string;
    description: string;
    category: string;
    priority: string;
  };
}

interface AndriesCapabilitiesProps {
  onCreateTask?: (template: any) => void;
}

export const AndriesCapabilities: React.FC<AndriesCapabilitiesProps> = ({ onCreateTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch capabilities from backend agent
  const fetchCapabilities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/taskade/webhooks/01K57CY3RGC9S6YNG1TZQKX251/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'capabilities_guide',
          instruction: 'Generate delegation guide with categories, capabilities, example tasks, stats/wins, and suggested task templates based on Andries knowledge base'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const capabilitiesData = JSON.parse(data.body.capabilities || data.body.bannerData);
          if (capabilitiesData.categories && Array.isArray(capabilitiesData.categories)) {
            setCapabilities(capabilitiesData.categories);
          } else {
            setCapabilities(generateFallbackCapabilities());
          }
        } catch (parseError) {
          setCapabilities(generateFallbackCapabilities());
        }
      } else {
        setCapabilities(generateFallbackCapabilities());
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      setCapabilities(generateFallbackCapabilities());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackCapabilities = (): Capability[] => {
    return [
      {
        id: 'sales',
        category: 'Sales',
        icon: 'TrendingUp',
        capabilities: 'Lead generation, pitch design, CRM strategy, client relationship building, deal closing, proposal creation',
        exampleTasks: [
          'Draft pitch deck for new retail client',
          'Design lead generation campaign',
          'Create CRM workflow for prospects',
          'Prepare client presentation materials'
        ],
        stats: ['R8.3M+ in annual sales', '127% of Q3 target achieved', '98% client satisfaction'],
        wins: ['Closed R2.5M deal in Q3', 'Launched AI-powered sales process', 'Built relationship with 50+ key clients'],
        suggestedTemplate: {
          title: 'Sales Strategy Development',
          description: 'Develop comprehensive sales strategy including lead generation, pitch materials, and CRM optimization',
          category: 'sales',
          priority: 'high'
        }
      },
      {
        id: 'marketing',
        category: 'Marketing',
        icon: 'Target',
        capabilities: 'SEO optimization, branding strategy, campaign management, content creation, market research, digital marketing',
        exampleTasks: [
          'Audit website SEO performance',
          'Design brand positioning strategy',
          'Create social media campaign',
          'Develop content marketing plan'
        ],
        stats: ['4 divisions rebranded successfully', '300%+ ROI on campaigns', '50+ marketing assets created'],
        wins: ['Launched successful product rebrand', 'Increased organic traffic by 200%', 'Created viral marketing campaign'],
        suggestedTemplate: {
          title: 'Marketing Campaign Strategy',
          description: 'Design and execute comprehensive marketing campaign including SEO, content, and brand positioning',
          category: 'marketing',
          priority: 'medium'
        }
      },
      {
        id: 'business-growth',
        category: 'Business Growth',
        icon: 'Briefcase',
        capabilities: 'Modular business systems, venture onboarding, strategic planning, process optimization, growth strategy',
        exampleTasks: [
          'Plan onboarding for new brand division',
          'Design scalable business processes',
          'Create growth strategy roadmap',
          'Optimize operational workflows'
        ],
        stats: ['3 ventures scaled in 12 months', '40% efficiency improvement', '25+ processes optimized'],
        wins: ['Successfully onboarded 3 new ventures', 'Built modular business framework', 'Achieved 150% growth target'],
        suggestedTemplate: {
          title: 'Business Growth Strategy',
          description: 'Develop comprehensive growth strategy including process optimization and scalable systems',
          category: 'business-growth',
          priority: 'high'
        }
      },
      {
        id: 'training',
        category: 'Training & Onboarding',
        icon: 'Users',
        capabilities: 'Employee onboarding, skills development, training program design, mentorship, knowledge transfer',
        exampleTasks: [
          'Design new employee onboarding program',
          'Create AI tools training curriculum',
          'Develop skills assessment framework',
          'Build mentorship program structure'
        ],
        stats: ['50+ team members trained', '95% training completion rate', '40% faster onboarding'],
        wins: ['Launched AI training program', 'Reduced onboarding time by 40%', 'Mentored 20+ professionals'],
        suggestedTemplate: {
          title: 'Training Program Development',
          description: 'Create comprehensive training program including curriculum design and assessment framework',
          category: 'training',
          priority: 'medium'
        }
      },
      {
        id: 'innovation',
        category: 'Innovation & AI',
        icon: 'Lightbulb',
        capabilities: 'AI system development, automation tools, internal process innovation, technology integration, prototype development',
        exampleTasks: [
          'Prototype AI lead generation tool',
          'Design automation workflow',
          'Build internal productivity tool',
          'Integrate AI into existing processes'
        ],
        stats: ['4 internal AI agents built', '60% process automation achieved', '10+ innovation projects'],
        wins: ['Built AI-powered onboarding system', 'Created automated lead scoring', 'Developed custom CRM integration'],
        suggestedTemplate: {
          title: 'AI Innovation Project',
          description: 'Develop AI-powered solution to automate and optimize business processes',
          category: 'ai-systems',
          priority: 'high'
        }
      },
      {
        id: 'events',
        category: 'Events & Experiences',
        icon: 'Calendar',
        capabilities: 'Event strategy, experience design, ROI-driven planning, stakeholder management, execution oversight',
        exampleTasks: [
          'Design corporate event strategy',
          'Plan client experience journey',
          'Create event ROI framework',
          'Coordinate multi-stakeholder events'
        ],
        stats: ['300%+ average event ROI', '15+ successful events', '500+ attendees managed'],
        wins: ['Delivered record-breaking conference', 'Created signature client experience', 'Achieved 400% ROI on launch event'],
        suggestedTemplate: {
          title: 'Event Strategy & Execution',
          description: 'Plan and execute high-impact event with focus on ROI and stakeholder engagement',
          category: 'events',
          priority: 'medium'
        }
      }
    ];
  };

  useEffect(() => {
    if (isExpanded && capabilities.length === 0) {
      fetchCapabilities();
    }
  }, [isExpanded]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'TrendingUp': <TrendingUp className="h-5 w-5" />,
      'Target': <Target className="h-5 w-5" />,
      'Briefcase': <Briefcase className="h-5 w-5" />,
      'Users': <Users className="h-5 w-5" />,
      'Lightbulb': <Lightbulb className="h-5 w-5" />,
      'Calendar': <Calendar className="h-5 w-5" />,
      'Star': <Star className="h-5 w-5" />,
      'Award': <Award className="h-5 w-5" />,
      'Zap': <Zap className="h-5 w-5" />
    };
    return iconMap[iconName] || <Briefcase className="h-5 w-5" />;
  };

  const handleCreateTask = (capability: Capability) => {
    if (onCreateTask) {
      onCreateTask({
        taskTitle: capability.suggestedTemplate.title,
        taskDescription: `${capability.suggestedTemplate.description}\n\n📋 Andries' Capabilities in ${capability.category}:\n${capability.capabilities}\n\n💡 Example deliverables:\n${capability.exampleTasks.map(task => `• ${task}`).join('\n')}\n\n🏆 Proven track record:\n${capability.stats.map(stat => `• ${stat}`).join('\n')}\n\n✨ Created from Andries Capabilities Guide`,
        priority: capability.suggestedTemplate.priority,
        category: capability.suggestedTemplate.category
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Toggle Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-2 rounded-xl">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">What Andries Can Do</h3>
                <p className="text-gray-400 text-sm">Delegation guide & capabilities overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3">
          {loading ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur"></div>
              <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Loading Andries' capabilities...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Refresh Button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchCapabilities}
                  disabled={loading}
                  className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Refresh from Knowledge Base</span>
                  </div>
                </button>
              </div>

              {/* Categories */}
              {capabilities.map((capability) => (
                <div key={capability.id} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-xl blur"></div>
                  <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(capability.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-purple-500 p-2 rounded-lg">
                          <div className="text-white">
                            {getIconComponent(capability.icon)}
                          </div>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-white">{capability.category}</h4>
                          <p className="text-gray-400 text-sm truncate max-w-xs">
                            {capability.capabilities.split(',').slice(0, 3).join(', ')}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {capability.exampleTasks.length} tasks
                        </span>
                        {expandedCategories.has(capability.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Category Content */}
                    {expandedCategories.has(capability.id) && (
                      <div className="border-t border-gray-700 p-4 space-y-4">
                        {/* Capabilities Summary */}
                        <div>
                          <h5 className="font-semibold text-cyan-400 mb-2">🎯 Capabilities</h5>
                          <p className="text-gray-300 text-sm">{capability.capabilities}</p>
                        </div>

                        {/* Example Tasks */}
                        <div>
                          <h5 className="font-semibold text-purple-400 mb-2">💡 Example Tasks</h5>
                          <div className="space-y-1">
                            {capability.exampleTasks.map((task, index) => (
                              <div key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Stats & Wins */}
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <h5 className="font-semibold text-green-400 mb-2">📊 Stats</h5>
                            <div className="space-y-1">
                              {capability.stats.map((stat, index) => (
                                <div key={index} className="text-green-300 text-sm flex items-center space-x-2">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{stat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-yellow-400 mb-2">🏆 Recent Wins</h5>
                            <div className="space-y-1">
                              {capability.wins.map((win, index) => (
                                <div key={index} className="text-yellow-300 text-sm flex items-center space-x-2">
                                  <Award className="h-3 w-3" />
                                  <span>{win}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Create Task Button */}
                        <div className="pt-3 border-t border-gray-700">
                          <button
                            onClick={() => handleCreateTask(capability)}
                            className="w-full relative overflow-hidden bg-gradient-to-r from-green-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                            <div className="relative flex items-center justify-center space-x-2">
                              <Plus className="h-4 w-4" />
                              <span>Create {capability.category} Task</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Footer Info */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-blue-500/10 rounded-xl blur"></div>
                <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Dynamic Knowledge Base</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    This guide updates automatically when Andries adds new skills, achievements, or capabilities to his knowledge base. 
                    All task templates are pre-filled with relevant context and proven approaches.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};