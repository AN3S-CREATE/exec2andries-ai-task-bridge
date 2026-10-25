import React, { useState, useEffect } from 'react';
import { Brain, Plus, Save, Upload, RefreshCw, CheckCircle, AlertCircle, Sparkles, TrendingUp, Award, Target, Users, Lightbulb, Calendar, Settings, FileText, Database } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  tags: string;
  date: string;
  proficiencyLevel?: number;
}

export const KnowledgeUpdateInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'browse' | 'bulk'>('add');
  const [updateText, setUpdateText] = useState('');
  const [updateType, setUpdateType] = useState<'skill' | 'achievement' | 'experience' | 'stat' | 'preference' | 'expertise'>('skill');
  const [category, setCategory] = useState<'sales' | 'marketing' | 'business-growth' | 'training' | 'ai-systems' | 'leadership' | 'general'>('general');
  const [tags, setTags] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Fetch existing knowledge entries
  const fetchKnowledgeEntries = async () => {
    setLoadingEntries(true);
    try {
      const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes');
      if (response.ok) {
        const data = await response.json();
        const entries = data.payload.nodes.map((node: any) => ({
          id: node.id,
          title: node.fieldValues['/text'] || 'Untitled',
          type: node.fieldValues['/attributes/@type1'] || 'general',
          category: node.fieldValues['/attributes/@cat02'] || 'general',
          description: node.fieldValues['/attributes/@desc2'] || '',
          tags: node.fieldValues['/attributes/@tags2'] || '',
          date: node.fieldValues['/attributes/@date1'] || new Date().toISOString(),
          proficiencyLevel: node.fieldValues['/attributes/@lvl01'] || 5
        }));
        setKnowledgeEntries(entries);
      }
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchKnowledgeEntries();
    }
  }, [activeTab]);

  const handleUpdateKnowledge = async () => {
    if (!updateText.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          '/text': updateText,
          '/attributes/@type1': updateType,
          '/attributes/@cat02': category,
          '/attributes/@date1': new Date().toISOString(),
          '/attributes/@desc2': `Updated via Knowledge Interface on ${new Date().toLocaleDateString()}`,
          '/attributes/@tags2': tags || 'user-updated, recent',
          '/attributes/@lvl01': updateType === 'skill' || updateType === 'expertise' ? proficiencyLevel : undefined
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setUpdateText('');
        setTags('');
        setTimeout(() => setSuccess(false), 3000);
        
        // Refresh the banner data to reflect changes
        await refreshBannerData();
      } else {
        setError('Failed to update knowledge base');
      }
    } catch (error) {
      console.error('Error updating knowledge:', error);
      setError('Error updating knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const refreshBannerData = async () => {
    try {
      await fetch('/api/taskade/webhooks/01K57CY3RGC9S6YNG1TZQKX251/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.log('Banner refresh completed');
    }
  };

  const handleBulkImport = async (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    let successCount = 0;
    
    setLoading(true);
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              '/text': line.trim(),
              '/attributes/@type1': updateType,
              '/attributes/@cat02': category,
              '/attributes/@date1': new Date().toISOString(),
              '/attributes/@desc2': `Bulk imported on ${new Date().toLocaleDateString()}`,
              '/attributes/@tags2': 'bulk-import, recent'
            }),
          });
          successCount++;
        } catch (error) {
          console.error('Error importing line:', line, error);
        }
      }
    }
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    await refreshBannerData();
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'skill': <Target className="h-4 w-4" />,
      'achievement': <Award className="h-4 w-4" />,
      'experience': <Lightbulb className="h-4 w-4" />,
      'stat': <TrendingUp className="h-4 w-4" />,
      'preference': <Settings className="h-4 w-4" />,
      'expertise': <Brain className="h-4 w-4" />
    };
    return iconMap[type] || <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'sales': 'bg-green-500/20 text-green-400 border-green-500/30',
      'marketing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'business-growth': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'training': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'ai-systems': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'leadership': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'general': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colorMap[category] || colorMap['general'];
  };

  const quickTemplates = [
    {
      type: 'achievement' as const,
      category: 'sales' as const,
      text: 'Achieved 150% of quarterly sales target with R2.5M in new business',
      tags: 'sales-performance, quarterly-results'
    },
    {
      type: 'skill' as const,
      category: 'marketing' as const,
      text: 'Advanced expertise in AI-powered marketing automation and lead scoring',
      tags: 'ai-marketing, automation, lead-generation'
    },
    {
      type: 'experience' as const,
      category: 'leadership' as const,
      text: 'Successfully led cross-functional team of 15 people through digital transformation',
      tags: 'leadership, digital-transformation, team-management'
    },
    {
      type: 'stat' as const,
      category: 'training' as const,
      text: 'Trained 50+ professionals with 95% completion rate and 4.8/5 satisfaction',
      tags: 'training-stats, professional-development'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur animate-pulse"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-2 rounded-xl">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Update Andries Knowledge Base</h2>
                <p className="text-gray-400 text-sm">Add new skills, achievements, and expertise</p>
              </div>
            </div>
            <button
              onClick={refreshBannerData}
              className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh AI</span>
              </div>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Knowledge</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Browse ({knowledgeEntries.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === 'bulk'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Bulk Import</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-xl blur"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-300 font-medium">Knowledge base updated successfully! AI brain re-indexed.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'add' && (
        <div className="space-y-4">
          {/* Quick Templates */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Quick Templates</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {quickTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setUpdateText(template.text);
                      setUpdateType(template.type);
                      setCategory(template.category);
                      setTags(template.tags);
                    }}
                    className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600 hover:border-cyan-400/50 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getTypeIcon(template.type)}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{template.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add Knowledge Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Knowledge Type</label>
                  <select
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value as any)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  >
                    <option value="skill">Skill</option>
                    <option value="achievement">Achievement</option>
                    <option value="experience">Experience</option>
                    <option value="stat">Statistic</option>
                    <option value="preference">Preference</option>
                    <option value="expertise">Expertise Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  >
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="business-growth">Business Growth</option>
                    <option value="training">Training</option>
                    <option value="ai-systems">AI Systems</option>
                    <option value="leadership">Leadership</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Knowledge Entry</label>
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="e.g., Advanced expertise in AI-powered sales automation with 50% efficiency improvement"
                  className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {updateText.length}/500 characters
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., ai-automation, sales-tools, efficiency"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  />
                </div>

                {(updateType === 'skill' || updateType === 'expertise') && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Proficiency Level ({proficiencyLevel}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={proficiencyLevel}
                      onChange={(e) => setProficiencyLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpdateKnowledge}
                disabled={!updateText.trim() || loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                {loading ? (
                  <div className="relative flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Updating AI Brain...</span>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center space-x-2">
                    <Save className="h-5 w-5" />
                    <span>Update Knowledge & Re-index AI</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'browse' && (
        <div className="space-y-4">
          {loadingEntries ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur"></div>
              <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Loading knowledge entries...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledgeEntries.length === 0 ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-blue-500/10 rounded-xl blur"></div>
                  <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                    <Database className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-white mb-2">No knowledge entries found</h3>
                    <p className="text-gray-400 text-sm">Start by adding some knowledge in the Add Knowledge tab.</p>
                  </div>
                </div>
              ) : (
                knowledgeEntries.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-xl blur"></div>
                    <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(entry.type)}
                          <h4 className="font-medium text-white">{entry.title}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(entry.category)}`}>
                            {entry.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {entry.description && (
                        <p className="text-gray-300 text-sm mb-2">{entry.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {entry.tags && (
                            <div className="flex flex-wrap gap-1">
                              {entry.tags.split(',').slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {entry.proficiencyLevel && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">Level:</span>
                            <div className="flex space-x-1">
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < entry.proficiencyLevel! ? 'bg-cyan-400' : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Upload className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold text-white">Bulk Import Knowledge</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Default Type</label>
                <select
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value as any)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                >
                  <option value="skill">Skill</option>
                  <option value="achievement">Achievement</option>
                  <option value="experience">Experience</option>
                  <option value="stat">Statistic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Default Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                >
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="business-growth">Business Growth</option>
                  <option value="training">Training</option>
                  <option value="ai-systems">AI Systems</option>
                  <option value="leadership">Leadership</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Knowledge Entries (one per line)
              </label>
              <textarea
                placeholder="Advanced sales automation expertise&#10;Completed AI certification program&#10;Led team of 15 developers&#10;Achieved 150% of quarterly targets"
                className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                rows={8}
                onChange={(e) => setUpdateText(e.target.value)}
              />
            </div>

            <button
              onClick={() => handleBulkImport(updateText)}
              disabled={!updateText.trim() || loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              {loading ? (
                <div className="relative flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Importing...</span>
                </div>
              ) : (
                <div className="relative flex items-center justify-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Bulk Import Knowledge</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Features Info */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl blur"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-purple-400 mb-2 flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Re-indexing Features:</span>
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong className="text-cyan-400">Instant Updates:</strong> Changes reflect immediately in task generation and capabilities guide</li>
            <li>• <strong className="text-purple-400">Smart Categorization:</strong> AI automatically uses new information for better task matching</li>
            <li>• <strong className="text-pink-400">Dynamic Banners:</strong> New achievements and skills appear in rotating tips</li>
            <li>• <strong className="text-green-400">Enhanced Delegation:</strong> Updated knowledge improves AI question generation and task structuring</li>
          </ul>
        </div>
      </div>
    </div>
  );
};