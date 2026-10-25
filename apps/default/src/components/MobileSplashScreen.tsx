import React, { useEffect, useState } from 'react';
import { Brain, Zap } from 'lucide-react';

export const MobileSplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      <div className="text-center space-y-8 px-6">
        {/* Logo Animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative bg-black p-8 rounded-3xl border border-gray-800">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="h-12 w-12 text-cyan-400 animate-pulse" />
              <Brain className="h-12 w-12 text-purple-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>

        {/* App Name */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Exec2Andries
          </h1>
          <p className="text-gray-400 text-sm">AI Task Bridge</p>
        </div>

        {/* Loading Progress */}
        <div className="space-y-3">
          <div className="relative w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {progress < 30 ? 'Initializing AI Brain...' :
             progress < 60 ? 'Loading Knowledge Base...' :
             progress < 90 ? 'Connecting to Systems...' :
             'Ready!'}
          </p>
        </div>

        {/* Version Info */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-gray-600">
            Version 2.0 • Mobile Optimized
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Powered by Andries Knowledge Brain
          </p>
        </div>
      </div>
    </div>
  );
};