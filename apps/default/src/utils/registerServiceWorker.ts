// Service Worker Registration Utility
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[App] Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[App] New version available! Please refresh.');
              
              // Optionally show update notification
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[App] Service Worker registration failed:', error);
      return null;
    }
  }
  
  console.log('[App] Service Workers not supported');
  return null;
}

// Unregister service worker (for development/testing)
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    console.log('[App] Service Worker unregistered');
    return true;
  }
  
  return false;
}

// Check if app is installed
export function isAppInstalled(): boolean {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = (window.navigator as any).standalone === true;
  
  return isStandalone || isIosStandalone;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[App] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Send notification
export function sendNotification(title: string, options?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Background sync registration
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('[App] Background sync registered:', tag);
    } catch (error) {
      console.error('[App] Background sync registration failed:', error);
    }
  }
}

// Check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function addConnectivityListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}