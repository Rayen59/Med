import React from 'react';
import { User } from '../types';
import {
  Stethoscope,
  MessageSquare,
  BookOpen,
  BarChart3,
  Bookmark,
  ShieldAlert,
  ShieldCheck,
  Files,
  Moon,
  Sun,
  Bell,
  BellOff,
  LogOut,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  activeTab: 'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin';
  onTabChange: (tab: 'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin') => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notificationsEnabled: boolean;
  onToggleNotificationsEnabled: () => void;
  onOpenDocSearch: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const SlidingPanel: React.FC<SlidingPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  darkMode,
  onToggleDarkMode,
  notificationsEnabled,
  onToggleNotificationsEnabled,
  onOpenDocSearch,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    { id: 'feed', label: 'Accueil & Fil de Partage', icon: Stethoscope, desc: 'Cas cliniques, cours, fiches' },
    { id: 'forums', label: 'Forums Médicaux', icon: MessageSquare, desc: 'Discussions & canaux privés' },
    { id: 'quizzes', label: 'Quiz & Classement', icon: BookOpen, desc: 'QCM ECN & classements' },
    { id: 'polls', label: 'Sondages Étudiants', icon: BarChart3, desc: 'Votes de promo & avis' },
    { id: 'spaces', label: 'Mes Espaces & Dossiers', icon: Bookmark, desc: 'Classement de vos révisions' },
  ] as const;

  return (
    <div
      className={`fixed inset-0 z-50 transition-visibility duration-300 ${
        isOpen ? 'visible' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sliding Drawer Container */}
      <div
        className={`fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-slate-900 dark:bg-slate-950 text-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Menu <span className="text-teal-400">FMS</span>
                </span>
                <span className="text-[10px] font-black uppercase bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-800">
                  Portail
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Faculté de Médecine de Sfax</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Fermer le panneau coulissant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-800/60 dark:bg-slate-900/60 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.prenom}
              className="w-11 h-11 rounded-full object-cover border-2 border-teal-500 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {currentUser.prenom} {currentUser.nom}
                </span>
                {isAdmin ? (
                  <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                    Admin
                  </span>
                ) : (
                  <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-teal-300 font-semibold truncate">
                {currentUser.promo}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {currentUser.email}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* Direct Boîte de Notifications Button */}
          {onOpenNotifications && (
            <button
              onClick={() => {
                onClose();
                onOpenNotifications();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-teal-950/60 hover:bg-teal-900/80 border border-teal-800/80 transition cursor-pointer text-left shadow-xs"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                    <span>Boîte de Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full shadow">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-teal-300/80 truncate">
                    Voir les alertes, réactions & sondages
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-400 flex-shrink-0" />
            </button>
          )}

          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation Principale
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-teal-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              </button>
            );
          })}

          {/* Admin moderation tab */}
          {isAdmin && (
            <button
              onClick={() => {
                onTabChange('admin');
                onClose();
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/60 border border-purple-800/70'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-extrabold truncate">Modération Admin</div>
                  <div className="text-[10px] text-purple-200/80 truncate">Gestion des comptes & sanctions</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300 flex-shrink-0" />
            </button>
          )}

          {/* Quick Document Search */}
          <div className="pt-3">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Ressources & Recherche
            </div>
            <button
              onClick={() => {
                onOpenDocSearch();
                onClose();
              }}
              className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-teal-300 hover:bg-slate-800/90 transition text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center flex-shrink-0">
                <Files className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold">Recherche Documents FMS</div>
                <div className="text-[10px] text-slate-400">PDF, polycopiés, vocaux, fiches</div>
              </div>
            </button>
          </div>

          {/* Preferences Section: Dark Mode & Push Notifications */}
          <div className="pt-3">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Préférences d'Affichage
            </div>

            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-300" />
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Mode Sombre</div>
                  <div className="text-[10px] text-slate-400">
                    {darkMode ? 'Activé (Dark)' : 'Désactivé (Clair)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  darkMode ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications Switch */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 mt-1.5">
              <div className="flex items-center space-x-2.5">
                {notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-teal-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Bannières Mobile</div>
                  <div className="text-[10px] text-slate-400">
                    {notificationsEnabled ? 'Actives (Discrètes)' : 'En sourdine'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleNotificationsEnabled}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  notificationsEnabled ? 'bg-teal-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Logout button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Se Déconnecter de la FMS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
