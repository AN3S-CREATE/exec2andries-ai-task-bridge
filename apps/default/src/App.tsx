import React, { useState, useEffect } from 'react';
import { TaskCreationInterface } from './components/TaskCreationInterface';
import { RotatingBanner } from './components/RotatingBanner';
import { Dashboard } from './components/Dashboard';
import { ExecutiveFollowUp } from './components/ExecutiveFollowUp';
import { VoiceFollowUp } from './components/VoiceFollowUp';
import { AndriesCapabilities } from './components/AndriesCapabilities';
import { AdminKnowledgeManager } from './components/AdminKnowledgeManager';
import { MobileInstallPrompt } from './components/MobileInstallPrompt';
import { MobileQuickActions } from './components/MobileQuickActions';
import { MobileOfflineIndicator } from './components/MobileOfflineIndicator';
import { MobileSplashScreen } from './components/MobileSplashScreen';
import { Brain, Zap, ArrowRight, BarChart3, MessageSquare, Volume2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'create' | 'dashboard' | 'followup' | 'voice-followup' | 'admin'>('create');
  const [refreshKey, setRefreshKey] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskCreation, setShowTaskCreation] = useState(false);
  const [prefilledTask, setPrefilledTask] = useState<any>(null);
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Check for first launch and show splash screen on mobile
  useEffect(() => {
    const isFirstLaunch = !localStorage.getItem('app-launched');
    const isMobile = window.innerWidth < 768;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if ((isFirstLaunch || isStandalone) && isMobile) {
      setShowSplash(true);
      localStorage.setItem('app-launched', 'true');
    }
  }, []);

  // Check for admin access (simple URL parameter check)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setShowAdminAccess(true);
    }
  }, []);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowTaskCreation(false);
    setPrefilledTask(null);
  };

  const handleCreateTaskFromTemplate = (template: any) => {
    setPrefilledTask(template);
    setShowTaskCreation(true);
    setActiveView('create');
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/taskade/projects/QLy4pjACoDeGcxXH/nodes');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.payload.nodes || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'dashboard' || activeView === 'followup' || activeView === 'voice-followup') {
      fetchTasks();
    }
  }, [activeView, refreshKey]);

  // Admin Knowledge Manager View
  if (activeView === 'admin') {
    return <AdminKnowledgeManager />;
  }

  const handleQuickTask = (taskType: string) => {
    // Handle quick task creation based on type
    switch (taskType) {
      case 'voice':
        setActiveView('voice-followup');
        break;
      case 'urgent':
        setShowTaskCreation(true);
        setPrefilledTask({ priority: 'urgent' });
        setActiveView('create');
        break;
      case 'note':
        setShowTaskCreation(true);
        setActiveView('create');
        break;
      case 'scan':
        // Could trigger camera API in future
        setShowTaskCreation(true);
        setActiveView('create');
        break;
    }
  };

  // Show splash screen
  if (showSplash) {
    return <MobileSplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <MobileInstallPrompt />
      <MobileOfflineIndicator />
      <MobileQuickActions onQuickTask={handleQuickTask} />
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-0.5 rounded-2xl animate-pulse">
              <div className="bg-black p-4 rounded-2xl">
                <div className="flex items-center justify-center space-x-2 text-white">
                  <Zap className="h-6 w-6 text-cyan-400" />
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Exec2Andries
          </h1>
          <p className="text-gray-400 text-sm">AI Task Bridge</p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur animate-pulse"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-3">
              <div className={`grid ${showAdminAccess ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                <button
                  onClick={() => setActiveView('create')}
                  className={`relative overflow-hidden px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeView === 'create'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  {activeView === 'create' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-20 animate-pulse"></div>
                  )}
                  <div className="relative flex items-center justify-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Create</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`relative overflow-hidden px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeView === 'dashboard'
                      ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  {activeView === 'dashboard' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 opacity-20 animate-pulse"></div>
                  )}
                  <div className="relative flex items-center justify-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Tasks</span>
                  </div>
                </button>

                {showAdminAccess && (
                  <button
                    onClick={() => setActiveView('admin')}
                    className={`relative overflow-hidden px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      activeView === 'admin'
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                    }`}
                  >
                    {activeView === 'admin' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 opacity-20 animate-pulse"></div>
                    )}
                    <div className="relative flex items-center justify-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setActiveView('followup')}
                  className={`relative overflow-hidden px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeView === 'followup'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  {activeView === 'followup' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
                  )}
                  <div className="relative flex items-center justify-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Follow-Up</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveView('voice-followup')}
                  className={`relative overflow-hidden px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeView === 'voice-followup'
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  {activeView === 'voice-followup' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-red-400 opacity-20 animate-pulse"></div>
                  )}
                  <div className="relative flex items-center justify-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <span>Voice</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'create' && (
          <>
            {/* Rotating Banner */}
            <div className="mb-6" key={refreshKey}>
              <RotatingBanner />
            </div>

            {/* Andries Capabilities Guide */}
            <div className="mb-6">
              <AndriesCapabilities onCreateTask={handleCreateTaskFromTemplate} />
            </div>

            {/* Task Creation Interface */}
            <TaskCreationInterface 
              onTaskCreated={handleTaskCreated}
              prefilledTask={prefilledTask}
            />
          </>
        )}

        {activeView === 'dashboard' && (
          <>
            {/* Andries Capabilities Guide on Dashboard */}
            <div className="mb-6">
              <AndriesCapabilities onCreateTask={handleCreateTaskFromTemplate} />
            </div>
            
            <Dashboard 
              tasks={tasks} 
              loading={loading} 
              onRefresh={fetchTasks}
            />
          </>
        )}

        {activeView === 'followup' && (
          <ExecutiveFollowUp 
            tasks={tasks} 
            onRefresh={fetchTasks}
          />
        )}

        {activeView === 'voice-followup' && (
          <VoiceFollowUp 
            tasks={tasks} 
            onRefresh={fetchTasks}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur"></div>
            <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">AI-Powered Task Bridge</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Intelligent delegation with voice follow-up
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800/50 p-2 rounded-lg border border-cyan-500/20">
                  <div className="font-semibold text-cyan-400">3-Question Flow</div>
                  <div className="text-gray-400">Smart AI Questions</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded-lg border border-purple-500/20">
                  <div className="font-semibold text-purple-400">Voice Follow-Up</div>
                  <div className="text-gray-400">Hands-free Updates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;