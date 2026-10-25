import React, { useState } from 'react';
import { Brain, Upload, Plus, Save, RefreshCw } from 'lucide-react';

export const KnowledgeUpdater: React.FC = () => {
  const [updateText, setUpdateText] = useState('');
  const [updateType, setUpdateType] = useState<'skill' | 'achievement' | 'stat' | 'preference'>('skill');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateKnowledge = async () => {
    if (!updateText.trim()) return;
    
    setLoading(true);
    try {
      // Create new knowledge entry directly in the knowledge base
      const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          '/text': updateText,
          '/attributes/@type1': updateType,
          '/attributes/@cat02': 'general',
          '/attributes/@date1': new Date().toISOString(),
          '/attributes/@desc2': `Updated by Andries on ${new Date().toLocaleDateString()}`,
          '/attributes/@tags2': 'user-updated, recent'
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setUpdateText('');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUpdateText(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>Update Knowledge Base</span>
        </h3>
        <p className="text-gray-600">Add new skills, achievements, or update your expertise</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-green-800">
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium">Knowledge base updated successfully!</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            The AI system will re-index this information instantly for better task delegation.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Type
          </label>
          <select
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value as any)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="skill">New Skill or Expertise</option>
            <option value="achievement">Recent Achievement</option>
            <option value="stat">Performance Statistic</option>
            <option value="preference">Work Preference</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Knowledge Update
          </label>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder={
              updateType === 'skill' ? 'e.g., Advanced expertise in AI-powered sales automation with 50% efficiency improvement' :
              updateType === 'achievement' ? 'e.g., Successfully launched new product line generating $2M revenue in Q4 2024' :
              updateType === 'stat' ? 'e.g., Client satisfaction score improved to 4.95/5 based on latest feedback' :
              'e.g., Prefers morning meetings for strategic discussions, works best with clear deadlines'
            }
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleUpdateKnowledge}
            disabled={!updateText.trim() || loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Update Knowledge</span>
              </>
            )}
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".txt,.md,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload File</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2">💡 Tips for Better AI Understanding:</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Be specific about skills and include measurable results</li>
          <li>• Mention tools, technologies, or methodologies you use</li>
          <li>• Include context about when and how you work best</li>
          <li>• Add recent achievements with dates and impact metrics</li>
        </ul>
      </div>
    </div>
  );
};