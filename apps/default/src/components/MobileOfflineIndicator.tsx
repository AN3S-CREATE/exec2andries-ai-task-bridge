import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';

export const MobileOfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showMessage && isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-up">
      <div className={`relative ${
        isOnline 
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' 
          : 'bg-gradient-to-r from-orange-500/20 to-red-500/20'
      } rounded-xl blur`}></div>
      <div className={`relative ${
        isOnline 
          ? 'bg-gray-900 border-green-500/30' 
          : 'bg-gray-900 border-orange-500/30'
      } border rounded-xl p-4 shadow-2xl`}>
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 ${
            isOnline 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-orange-500 to-red-500'
          } p-2 rounded-lg`}>
            {isOnline ? (
              <Wifi className="h-5 w-5 text-white" />
            ) : (
              <WifiOff className="h-5 w-5 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${
              isOnline ? 'text-green-400' : 'text-orange-400'
            }`}>
              {isOnline ? 'Back Online!' : 'No Connection'}
            </h3>
            <p className="text-xs text-gray-400">
              {isOnline 
                ? 'Your changes will now sync automatically' 
                : 'Working in offline mode - changes will sync when reconnected'
              }
            </p>
          </div>

          {!isOnline && (
            <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
          )}
        </div>

        {!isOnline && (
          <div className="mt-3 bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="flex-1">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
              <span>Offline Mode</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};