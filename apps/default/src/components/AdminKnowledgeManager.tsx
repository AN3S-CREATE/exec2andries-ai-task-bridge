import React, { useState, useEffect } from 'react';
import { Brain, Plus, Save, RefreshCw, Edit, Trash2, Search, Filter, Upload, Download, Settings, CheckCircle, AlertCircle, TrendingUp, Award, Users, Target, Lightbulb, Calendar } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@type1': 'skill' | 'achievement' | 'experience' | 'stat' | 'preference' | 'expertise';
    '/attributes/@cat02': 'sales' | 'marketing' | 'business-growth' | 'training' | 'ai-systems' | 'leadership' | 'general';
    '/attributes/@tags2'?: string;
    '/attributes/@desc2'?: string;
    '/attributes/@lvl01'?: number;
    '/attributes/@date1'?: string;
    '/attributes/note'?: string;
  };
}

interface NewKnowledgeEntry {
  title: string;
  type: 'skill' | 'achievement' | 'experience' | 'stat' | 'preference' | 'expertise';
  category: 'sales' | 'marketing' | 'business-growth' | 'training' | 'ai-systems' | 'leadership' | 'general';
  description: string;
  tags: string;
  proficiencyLevel?: number;
  note: string;
}

export const AdminKnowledgeManager: React.FC = () => {
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [newEntry, setNewEntry] = useState<NewKnowledgeEntry>({
    title: '',
    type: 'skill',
    category: 'general',
    description: '',
    tags: '',
    proficiencyLevel: 8,
    note: ''
  });

  // Fetch all knowledge entries
  const fetchKnowledgeEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeEntries(data.payload.nodes || []);
      } else {
        setError('Failed to fetch knowledge entries');
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error);
      setError('Error fetching knowledge entries');
    } finally {
      setLoading(false);
    }
  };

  // Create new knowledge entry
  const createKnowledgeEntry = async () => {
    setSaving(true);
    setError('');
    
    try {
      const payload = {
        '/text': newEntry.title,
        '/attributes/@type1': newEntry.type,
        '/attributes/@cat02': newEntry.category,
        '/attributes/@desc2': newEntry.description,
        '/attributes/@tags2': newEntry.tags,
        '/attributes/@lvl01': newEntry.proficiencyLevel,
        '/attributes/@date1': new Date().toISOString(),
        '/attributes/note': newEntry.note
      };

      const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess('Knowledge entry created successfully!');
        setNewEntry({
          title: '',
          type: 'skill',
          category: 'general',
          description: '',
          tags: '',
          proficiencyLevel: 8,
          note: ''
        });
        setShowAddForm(false);
        fetchKnowledgeEntries();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to create knowledge entry');
      }
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      setError('Error creating knowledge entry');
    } finally {
      setSaving(false);
    }
  };

  // Update existing knowledge entry
  const updateKnowledgeEntry = async (entry: KnowledgeEntry) => {
    setSaving(true);
    setError('');
    
    try {
      const payload = {
        '/text': entry.fieldValues['/text'],
        '/attributes/@type1': entry.fieldValues['/attributes/@type1'],
        '/attributes/@cat02': entry.fieldValues['/attributes/@cat02'],
        '/attributes/@desc2': entry.fieldValues['/attributes/@desc2'],
        '/attributes/@tags2': entry.fieldValues['/attributes/@tags2'],
        '/attributes/@lvl01': entry.fieldValues['/attributes/@lvl01'],
        '/attributes/@date1': new Date().toISOString(),
        '/attributes/note': entry.fieldValues['/attributes/note']
      };

      const response = await fetch(`/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes/${entry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess('Knowledge entry updated successfully!');
        setEditingEntry(null);
        fetchKnowledgeEntries();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update knowledge entry');
      }
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      setError('Error updating knowledge entry');
    } finally {
      setSaving(false);
    }
  };

  // Bulk import from JSON
  const handleBulkImport = async (jsonData: any[]) => {
    setSaving(true);
    setError('');
    
    try {
      let successCount = 0;
      for (const item of jsonData) {
        const payload = {
          '/text': item.title || item.name || 'Untitled',
          '/attributes/@type1': item.type || 'skill',
          '/attributes/@cat02': item.category || 'general',
          '/attributes/@desc2': item.description || '',
          '/attributes/@tags2': Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
          '/attributes/@lvl01': item.level || item.proficiency || 8,
          '/attributes/@date1': new Date().toISOString(),
          '/attributes/note': item.note || item.details || ''
        };

        const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          successCount++;
        }
      }

      setSuccess(`Successfully imported ${successCount} out of ${jsonData.length} entries!`);
      fetchKnowledgeEntries();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error bulk importing:', error);
      setError('Error during bulk import');
    } finally {
      setSaving(false);
    }
  };

  // Export knowledge base
  const exportKnowledgeBase = () => {
    const exportData = knowledgeEntries.map(entry => ({
      title: entry.fieldValues['/text'],
      type: entry.fieldValues['/attributes/@type1'],
      category: entry.fieldValues['/attributes/@cat02'],
      description: entry.fieldValues['/attributes/@desc2'],
      tags: entry.fieldValues['/attributes/@tags2'],
      proficiencyLevel: entry.fieldValues['/attributes/@lvl01'],
      note: entry.fieldValues['/attributes/note'],
      dateAdded: entry.fieldValues['/attributes/@date1']
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `andries-knowledge-base-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchKnowledgeEntries();
  }, []);

  // Filter entries
  const filteredEntries = knowledgeEntries.filter(entry => {
    const matchesSearch = entry.fieldValues['/text']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.fieldValues['/attributes/@desc2']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.fieldValues['/attributes/@tags2']?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || entry.fieldValues['/attributes/@type1'] === filterType;
    const matchesCategory = filterCategory === 'all' || entry.fieldValues['/attributes/@cat02'] === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill': return <TrendingUp className="h-4 w-4" />;
      case 'achievement': return <Award className="h-4 w-4" />;
      case 'experience': return <Users className="h-4 w-4" />;
      case 'stat': return <Target className="h-4 w-4" />;
      case 'preference': return <Settings className="h-4 w-4" />;
      case 'expertise': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'marketing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'business-growth': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'training': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ai-systems': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'leadership': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur animate-pulse"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-3 rounded-xl">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Knowledge Manager</h1>
                  <p className="text-gray-400">Update Andries' AI knowledge base</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportKnowledgeBase}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-green-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-green-500/25 flex items-center space-x-2 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Knowledge</span>
                </button>
                
                <button
                  onClick={fetchKnowledgeEntries}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-900/50 border border-green-500/50 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500/50 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-blue-500/10 rounded-xl blur"></div>
          <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search knowledge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                <option value="all">All Types</option>
                <option value="skill">Skills</option>
                <option value="achievement">Achievements</option>
                <option value="experience">Experience</option>
                <option value="stat">Statistics</option>
                <option value="preference">Preferences</option>
                <option value="expertise">Expertise</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                <option value="all">All Categories</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
                <option value="business-growth">Business Growth</option>
                <option value="training">Training</option>
                <option value="ai-systems">AI Systems</option>
                <option value="leadership">Leadership</option>
                <option value="general">General</option>
              </select>
              
              <div className="text-sm text-gray-400 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                {filteredEntries.length} of {knowledgeEntries.length} entries
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Entries */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading knowledge entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No knowledge entries found</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-xl blur"></div>
                <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="text-cyan-400">
                          {getTypeIcon(entry.fieldValues['/attributes/@type1'])}
                        </div>
                        <h3 className="font-semibold text-white">{entry.fieldValues['/text']}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(entry.fieldValues['/attributes/@cat02'])}`}>
                          {entry.fieldValues['/attributes/@cat02']}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {entry.fieldValues['/attributes/@type1']}
                        </span>
                      </div>
                      
                      {entry.fieldValues['/attributes/@desc2'] && (
                        <p className="text-gray-300 text-sm mb-2">{entry.fieldValues['/attributes/@desc2']}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        {entry.fieldValues['/attributes/@lvl01'] && (
                          <span>Level: {entry.fieldValues['/attributes/@lvl01']}/10</span>
                        )}
                        {entry.fieldValues['/attributes/@tags2'] && (
                          <span>Tags: {entry.fieldValues['/attributes/@tags2']}</span>
                        )}
                        {entry.fieldValues['/attributes/@date1'] && (
                          <span>Updated: {new Date(entry.fieldValues['/attributes/@date1']).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {(showAddForm || editingEntry) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingEntry ? 'Edit Knowledge Entry' : 'Add New Knowledge Entry'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingEntry(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingEntry ? editingEntry.fieldValues['/text'] : newEntry.title}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({
                          ...editingEntry,
                          fieldValues: {
                            ...editingEntry.fieldValues,
                            '/text': e.target.value
                          }
                        });
                      } else {
                        setNewEntry({ ...newEntry, title: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="e.g., Advanced Sales Negotiation"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={editingEntry ? editingEntry.fieldValues['/attributes/@type1'] : newEntry.type}
                      onChange={(e) => {
                        const value = e.target.value as any;
                        if (editingEntry) {
                          setEditingEntry({
                            ...editingEntry,
                            fieldValues: {
                              ...editingEntry.fieldValues,
                              '/attributes/@type1': value
                            }
                          });
                        } else {
                          setNewEntry({ ...newEntry, type: value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    >
                      <option value="skill">Skill</option>
                      <option value="achievement">Achievement</option>
                      <option value="experience">Experience</option>
                      <option value="stat">Statistic</option>
                      <option value="preference">Preference</option>
                      <option value="expertise">Expertise</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={editingEntry ? editingEntry.fieldValues['/attributes/@cat02'] : newEntry.category}
                      onChange={(e) => {
                        const value = e.target.value as any;
                        if (editingEntry) {
                          setEditingEntry({
                            ...editingEntry,
                            fieldValues: {
                              ...editingEntry.fieldValues,
                              '/attributes/@cat02': value
                            }
                          });
                        } else {
                          setNewEntry({ ...newEntry, category: value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={editingEntry ? editingEntry.fieldValues['/attributes/@desc2'] || '' : newEntry.description}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({
                          ...editingEntry,
                          fieldValues: {
                            ...editingEntry.fieldValues,
                            '/attributes/@desc2': e.target.value
                          }
                        });
                      } else {
                        setNewEntry({ ...newEntry, description: e.target.value });
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Detailed description of the knowledge entry..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editingEntry ? editingEntry.fieldValues['/attributes/@tags2'] || '' : newEntry.tags}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({
                          ...editingEntry,
                          fieldValues: {
                            ...editingEntry.fieldValues,
                            '/attributes/@tags2': e.target.value
                          }
                        });
                      } else {
                        setNewEntry({ ...newEntry, tags: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="e.g., negotiation, closing, b2b"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Proficiency Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingEntry ? editingEntry.fieldValues['/attributes/@lvl01'] || 8 : newEntry.proficiencyLevel}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (editingEntry) {
                        setEditingEntry({
                          ...editingEntry,
                          fieldValues: {
                            ...editingEntry.fieldValues,
                            '/attributes/@lvl01': value
                          }
                        });
                      } else {
                        setNewEntry({ ...newEntry, proficiencyLevel: value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
                  <textarea
                    value={editingEntry ? editingEntry.fieldValues['/attributes/note'] || '' : newEntry.note}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({
                          ...editingEntry,
                          fieldValues: {
                            ...editingEntry.fieldValues,
                            '/attributes/note': e.target.value
                          }
                        });
                      } else {
                        setNewEntry({ ...newEntry, note: e.target.value });
                      }
                    }}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Any additional context or notes..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingEntry(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingEntry) {
                      updateKnowledgeEntry(editingEntry);
                    } else {
                      createKnowledgeEntry();
                    }
                  }}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-500 to-cyan-500 text-white py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{editingEntry ? 'Update' : 'Create'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};