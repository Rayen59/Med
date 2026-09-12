import React from 'react';
import { User, AppNotification } from '../types';
import {
  Stethoscope,
  Radio,
  MessageSquare,
  BookOpen,
  BarChart3,
  Bookmark,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  Files
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { SlidingPanel } from './SlidingPanel';

interface HeaderProps {
  currentUser: User;
  activeTab: 'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin';
  onTabChange: (tab: 'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin') => void;
  onLogout: () => void;
  isLiveConnected: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDocSearch: () => void;
  // Notifications
  notifications: AppNotification[];
  onNotificationsChange: (notifications: AppNotification[]) => void;
  notificationsEnabled: boolean;
  onToggleNotificationsEnabled: () => void;
  latestPushNotification: AppNotification | null;
  onDismissPushNotification: () => void;
  // Sliding panel
  isSlidingPanelOpen: boolean;
  onToggleSlidingPanel: () => void;
  onCloseSlidingPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  isLiveConnected,
  darkMode,
  onToggleDarkMode,
  onOpenDocSearch,
  notifications,
  onNotificationsChange,
  notificationsEnabled,
  onToggleNotificationsEnabled,
  latestPushNotification,
  onDismissPushNotification,
  isSlidingPanelOpen,
  onToggleSlidingPanel,
  onCloseSlidingPanel,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    { id: 'feed', label: 'Accueil & Partage', icon: Stethoscope },
    { id: 'forums', label: 'Forums Médicaux', icon: MessageSquare },
    { id: 'quizzes', label: 'Quiz & Classement', icon: BookOpen },
    { id: 'polls', label: 'Sondages', icon: BarChart3 },
    { id: 'spaces', label: 'Mes Espaces', icon: Bookmark },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white shadow-xl transition-colors">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-1.5 sm:gap-3">
            
            {/* Left: Logo & Faculty Emblem */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none min-w-0 shrink-0"
              onClick={() => onTabChange('feed')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-sm shrink-0">
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-base sm:text-xl tracking-tight text-white whitespace-nowrap">
                    Médecine <span className="text-teal-400">Sfax</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-800 shrink-0">
                    FMS
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block font-medium truncate">
                  Faculté de Médecine de Sfax • Portail Académique
                </p>
              </div>
            </div>

            {/* Middle: Desktop Navigation links */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-950/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  id="nav-btn-admin"
                  onClick={() => onTabChange('admin')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                    activeTab === 'admin'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                      : 'text-purple-300 hover:text-white hover:bg-purple-950/50 border border-purple-500/40'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Modération</span>
                </button>
              )}
            </nav>

            {/* Right: Notification Box + Document Search + Dark Mode + Profile + 3-Tirets Menu Button */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              
              {/* Notification Center (Push banners & Dropdown box) */}
              <NotificationCenter
                currentUser={currentUser}
                notifications={notifications}
                onNotificationsChange={onNotificationsChange}
                onNavigateTab={onTabChange}
                notificationsEnabled={notificationsEnabled}
                onToggleNotificationsEnabled={onToggleNotificationsEnabled}
                latestPushNotification={latestPushNotification}
                onDismissPushNotification={onDismissPushNotification}
              />

              {/* Quick Document Search button */}
              <button
                onClick={onOpenDocSearch}
                className="p-2 text-slate-300 hover:text-teal-300 hover:bg-slate-800/80 rounded-xl transition flex items-center space-x-1 text-xs font-semibold shrink-0"
                title="Rechercher des documents, cours, vocaux"
              >
                <Files className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-teal-400" />
                <span className="hidden 2xl:inline">Documents</span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                id="theme-toggle-btn"
                onClick={onToggleDarkMode}
                className="p-2 text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 rounded-xl transition shrink-0"
                title={darkMode ? "Passer en mode clair" : "Activer le mode sombre"}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-300" />
                )}
              </button>

              {/* Current Student Profile chip (compact on small screens) */}
              <div
                onClick={onToggleSlidingPanel}
                className="hidden sm:flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-900 border border-slate-700 hover:border-teal-500/50 cursor-pointer py-1 px-2.5 rounded-xl transition shrink-0"
                title="Ouvrir le profil et le panneau coulissant"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.prenom}
                  className="w-7 h-7 rounded-full object-cover border border-teal-500 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left min-w-0 max-w-[110px]">
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {currentUser.prenom}
                  </div>
                  <div className="text-[10px] text-teal-300 font-medium truncate">
                    {currentUser.promo}
                  </div>
                </div>
              </div>

              {/* THE 3-TIRETS (HAMBURGER) BUTTON FOR SLIDING PANEL - Always visible & inside view */}
              <button
                id="mobile-sliding-panel-btn"
                onClick={onToggleSlidingPanel}
                className="p-2 sm:px-2.5 sm:py-2 text-white bg-slate-800 hover:bg-teal-600 border border-slate-700 hover:border-teal-500 rounded-xl transition flex items-center space-x-1.5 shrink-0 shadow-sm"
                title="Ouvrir le panneau coulissant FMS (Menu)"
                aria-label="Menu coulissant"
              >
                <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-teal-400" />
                <span className="hidden sm:inline text-xs font-bold text-slate-200">
                  Menu
                </span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* THE SLIDING PANEL (DRAWER) */}
      <SlidingPanel
        isOpen={isSlidingPanelOpen}
        onClose={onCloseSlidingPanel}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        notificationsEnabled={notificationsEnabled}
        onToggleNotificationsEnabled={onToggleNotificationsEnabled}
        onOpenDocSearch={onOpenDocSearch}
      />
    </>
  );
};
