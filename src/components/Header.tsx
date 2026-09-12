import React from 'react';
import { User } from '../types';
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
  Search,
  Files
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  activeTab: 'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin';
  onTabChange: (tab: 'feed' | 'forums' | 'quizzes' | 'polls' | 'spaces' | 'admin') => void;
  onLogout: () => void;
  isLiveConnected: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDocSearch: () => void;
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    { id: 'feed', label: 'Accueil & Partage', icon: Stethoscope },
    { id: 'forums', label: 'Forums Médicaux', icon: MessageSquare },
    { id: 'quizzes', label: 'Quiz & Classement', icon: BookOpen },
    { id: 'polls', label: 'Sondages', icon: BarChart3 },
    { id: 'spaces', label: 'Mes Espaces', icon: Bookmark },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white shadow-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Faculty Identification */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => onTabChange('feed')}
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-sm flex-shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                  Médecine <span className="text-teal-400">Sfax</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-800">
                  FMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Faculté de Médecine de Sfax • Portail Académique
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-950/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin navigation tab if user is Admin */}
            {isAdmin && (
              <button
                id="nav-btn-admin"
                onClick={() => onTabChange('admin')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/50 border border-purple-500/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-300" />
                <span>Modération Admin</span>
              </button>
            )}
          </nav>

          {/* Right Side: Document Search + Dark Mode + Live Badge + User Chip + Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Document Search button */}
            <button
              onClick={onOpenDocSearch}
              className="p-2 text-slate-300 hover:text-teal-300 hover:bg-slate-800/80 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
              title="Rechercher des documents, polycopiés, vocaux ou fiches"
            >
              <Files className="w-4 h-4 text-teal-400" />
              <span className="hidden xl:inline">Documents</span>
            </button>

            {/* DARK MODE TOGGLE BUTTON */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="p-2 text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 rounded-xl transition relative"
              title={darkMode ? "Passer en mode clair" : "Activer le mode sombre (Dark Mode)"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300 animate-in spin-in-180 duration-200" />
              )}
            </button>

            {/* Real-time SSE sync status */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isLiveConnected
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-700/60 text-amber-300'
              }`}
              title={isLiveConnected ? "Connecté en temps réel aux publications FMS" : "Reconnexion..."}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px]">En direct</span>
            </div>

            {/* Current Student Profile chip */}
            <div className="flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-900 border border-slate-700 py-1 px-2.5 rounded-xl">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.prenom}
                className="w-7 h-7 rounded-full object-cover border border-teal-500 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-100 flex items-center space-x-1">
                  <span className="truncate max-w-[120px]">
                    {currentUser.prenom} {currentUser.nom}
                  </span>
                  {isAdmin ? (
                    <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-950 px-1 py-0.2 rounded border border-purple-800">
                      Admin
                    </span>
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  )}
                </div>
                <div className="text-[10px] text-teal-300 font-medium">
                  {currentUser.promo}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 dark:bg-slate-950 border-t border-slate-800 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                onTabChange('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:bg-purple-950 hover:text-white border border-purple-800'
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <span>Modération Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              onOpenDocSearch();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-teal-300 hover:bg-slate-800"
          >
            <Files className="w-5 h-5" />
            <span>Recherche Documents FMS</span>
          </button>
        </div>
      )}
    </header>
  );
};
