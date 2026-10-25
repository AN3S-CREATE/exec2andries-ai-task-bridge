import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const MobileInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show again for 7 days
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 10 seconds on mobile
      setTimeout(() => {
        if (window.innerWidth < 768) {
          setShowPrompt(true);
        }
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur"></div>
        <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-gradient-to-r from-cyan-500 to-purple-500 p-2 rounded-xl">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1 flex items-center space-x-2">
                <span>Install Exec2Andries</span>
                <Zap className="h-4 w-4 text-cyan-400" />
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Install our app for faster access, offline support, and a native mobile experience!
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleInstall}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Install</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div>
                <div className="text-cyan-400 font-semibold">⚡</div>
                <div className="text-gray-400">Faster</div>
              </div>
              <div>
                <div className="text-purple-400 font-semibold">📱</div>
                <div className="text-gray-400">Native Feel</div>
              </div>
              <div>
                <div className="text-pink-400 font-semibold">🔒</div>
                <div className="text-gray-400">Secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};