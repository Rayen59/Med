import React, { useState, useEffect } from 'react';
import { User, Post, AppNotification } from './types';
import { api, getStoredToken, subscribeToLiveUpdates } from './lib/api';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { FeedView } from './components/FeedView';
import { ForumsView } from './components/ForumsView';
import { QuizView } from './components/QuizView';
import { PollsView } from './components/PollsView';
import { SpacesView } from './components/SpacesView';
import { AdminView } from './components/AdminView';
import { DocumentSearchModal } from './components/DocumentSearchModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestPushNotification, setLatestPushNotification] = useState<AppNotification | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [showGlobalDocSearch, setShowGlobalDocSearch] = useState(false);
  const [isSlidingPanelOpen, setIsSlidingPanelOpen] = useState(false);

  // Notifications preference (persistent in localStorage)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fms_notifications_enabled');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const toggleNotificationsEnabled = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('fms_notifications_enabled', String(next));
      return next;
    });
  };

  // Executable Dark Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fms_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fms_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Check existing session token on startup
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setAuthChecking(false);
      return;
    }

    try {
      const res = await api.auth.getMe();
      setCurrentUser(res.user);
      if (res.user.role === 'admin') {
        setActiveTab('admin');
      }
    } catch {
      api.auth.logout();
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  // Fetch posts for feed
  const loadPosts = async () => {
    try {
      const res = await api.posts.getAll();
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load posts', err);
    }
  };

  // Fetch notifications for user
  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPosts();
      loadNotifications();

      // Subscribe to Server-Sent Events for instant updates
      const unsubscribe = subscribeToLiveUpdates((event, payload) => {
        setIsLiveConnected(true);

        if (event === 'NEW_POST') {
          setPosts((prev) => {
            if (prev.some((p) => p.id === payload.id)) return prev;
            return [payload, ...prev];
          });
        } else if (event === 'UPDATE_POST') {
          setPosts((prev) => prev.map((p) => (p.id === payload.id ? payload : p)));
        } else if (event === 'DELETE_POST') {
          setPosts((prev) => prev.filter((p) => p.id !== payload.id));
        } else if (event === 'LIKE_POST') {
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.postId ? { ...p, likes: payload.likes } : p))
          );
        } else if (event === 'COMMENT_POST') {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === payload.postId
                ? { ...p, comments: [...(p.comments || []), payload.comment] }
                : p
            )
          );
        } else if (event === 'NEW_NOTIFICATION') {
          // If notification is intended for current logged in student/doctor
          if (payload.recipientId === currentUser.id) {
            setNotifications((prev) => [payload, ...prev]);

            // Show mobile phone-like push banner
            setLatestPushNotification(payload);

            // Auto dismiss after 5 seconds
            setTimeout(() => {
              setLatestPushNotification((curr) => (curr?.id === payload.id ? null : curr));
            }, 5000);
          }
        } else if (event === 'USER_STATUS_CHANGED' && payload.userId === currentUser.id) {
          // If the current user got banned or restricted, refresh profile
          api.auth.getMe().then((res) => setCurrentUser(res.user)).catch(() => {
            handleLogout();
          });
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setActiveTab('feed');
    setIsSlidingPanelOpen(false);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-teal-500 border-t-transparent mb-4" />
        <p className="text-teal-400 font-bold text-sm">Faculté de Médecine de Sfax...</p>
      </div>
    );
  }

  // MANDATORY REQUIREMENT: If not logged in, display the login/registration page first and automatically
  if (!currentUser) {
    return (
      <AuthModal
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('feed');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Faculty Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsSlidingPanelOpen(false);
        }}
        onLogout={handleLogout}
        isLiveConnected={isLiveConnected}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenDocSearch={() => setShowGlobalDocSearch(true)}
        notifications={notifications}
        onNotificationsChange={setNotifications}
        notificationsEnabled={notificationsEnabled}
        onToggleNotificationsEnabled={toggleNotificationsEnabled}
        latestPushNotification={latestPushNotification}
        onDismissPushNotification={() => setLatestPushNotification(null)}
        isSlidingPanelOpen={isSlidingPanelOpen}
        onToggleSlidingPanel={() => setIsSlidingPanelOpen((prev) => !prev)}
        onCloseSlidingPanel={() => setIsSlidingPanelOpen(false)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'feed' && (
          <FeedView
            currentUser={currentUser}
            posts={posts}
            onRefresh={loadPosts}
          />
        )}

        {activeTab === 'forums' && (
          <ForumsView currentUser={currentUser} />
        )}

        {activeTab === 'quizzes' && (
          <QuizView currentUser={currentUser} />
        )}

        {activeTab === 'polls' && (
          <PollsView currentUser={currentUser} />
        )}

        {activeTab === 'spaces' && (
          <SpacesView
            currentUser={currentUser}
            allPosts={posts}
            onRefresh={loadPosts}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView currentUser={currentUser} />
        )}
      </main>

      {/* Global Document Search Modal */}
      <DocumentSearchModal
        isOpen={showGlobalDocSearch}
        onClose={() => setShowGlobalDocSearch(false)}
        posts={posts}
      />

      {/* Modern Medical Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            © {new Date().getFullYear()} Faculté de Médecine de Sfax • Université de Sfax
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-[11px]">
            Plateforme académique carabin : Partage instantané, Modération officielle, Forums privés & QCM
          </p>
        </div>
      </footer>

    </div>
  );
}
