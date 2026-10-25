import React, { useState } from 'react';
import { Brain, Plus, Save, Upload, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export const KnowledgeUpdate: React.FC = () => {
  const [updateText, setUpdateText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateKnowledge = async () => {
    if (!updateText.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Update knowledge base via direct API
      const response = await fetch('/api/taskade/projects/5wR2NLg3YGHm9vZJ/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          '/text': updateText,
          '/attributes/@type1': 'achievement',
          '/attributes/@cat02': 'general',
          '/attributes/@date1': new Date().toISOString(),
          '/attributes/@desc2': `Knowledge update: ${updateText}`,
          '/attributes/@tags2': 'self-update, recent'
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setUpdateText('');
        setTimeout(() => setSuccess(false), 3000);
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

  const quickUpdates = [
    'Completed new certification in AI Marketing',
    'Successfully closed $500K deal with major client',
    'Led team training session on sales automation',
    'Implemented new CRM workflow increasing efficiency by 25%',
    'Mentored 3 new team members this month'
  ];

  const handleQuickUpdate = (update: string) => {
    setUpdateText(update);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <span>Update Knowledge Base</span>
        </h3>
        <p className="text-gray-600">
          Add new skills, achievements, or update your expertise. The AI will instantly re-index this information.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Knowledge base updated successfully! AI brain re-indexed.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Quick Updates */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Quick Updates:</h4>
          <div className="grid grid-cols-1 gap-2">
            {quickUpdates.map((update, index) => (
              <button
                key={index}
                onClick={() => handleQuickUpdate(update)}
                className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{update}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Update */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Add New Achievement, Skill, or Update:
          </label>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="e.g., Completed advanced sales training course, Achieved 150% of monthly target, Learned new AI automation tool..."
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {updateText.length}/500 characters
          </div>
        </div>

        <button
          onClick={handleUpdateKnowledge}
          disabled={!updateText.trim() || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Updating AI Brain...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Update Knowledge & Re-index AI</span>
            </>
          )}
        </button>
      </div>

      {/* Upload Document */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Upload Structured Document</span>
        </h4>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Upload CV, portfolio, or structured document
          </p>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOC, TXT (AI will extract and structure the information)
          </p>
          <button className="mt-3 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Choose File
          </button>
        </div>
      </div>

      {/* AI Features Info */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center space-x-2">
          <Brain className="h-4 w-4" />
          <span>AI Re-indexing Features:</span>
        </h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• <strong>Instant Updates:</strong> Changes reflect immediately in task generation</li>
          <li>• <strong>Smart Categorization:</strong> AI automatically categorizes new information</li>
          <li>• <strong>Skill Matching:</strong> Updates improve task-to-skill matching accuracy</li>
          <li>• <strong>Banner Updates:</strong> New achievements appear in rotating tips</li>
        </ul>
      </div>
    </div>
  );
};