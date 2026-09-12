import React, { useState } from 'react';
import { User } from '../types';
import { api, fileToDataUrl } from '../lib/api';
import { ShieldAlert, Stethoscope, User as UserIcon, Mail, Lock, GraduationCap, Camera, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

const MEDICAL_PROMOS = [
  { value: 'PCEM1', label: 'PCEM 1 (Première année médecine)' },
  { value: 'PCEM2', label: 'PCEM 2 (Deuxième année)' },
  { value: 'DCEM1', label: 'DCEM 1 (Troisième année)' },
  { value: 'DCEM2', label: 'DCEM 2 (Quatrième année)' },
  { value: 'DCEM3', label: 'DCEM 3 (Cinquième année)' },
  { value: 'Interne', label: 'Internat (Stage hospitalier)' },
  { value: 'Resident', label: 'Résidanat de Médecine' },
  { value: 'Enseignant', label: 'Enseignant / Médecin Hospitalo-Universitaire' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813580-c1192e3416e9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Registration states
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [promo, setPromo] = useState('PCEM1');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 5 Mo.");
        return;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        setCustomAvatarPreview(dataUrl);
        setAvatarUrl(dataUrl);
      } catch {
        setError("Erreur lors de la lecture du fichier image.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        if (!email.trim() || !password.trim()) {
          setError("Veuillez renseigner votre adresse email et votre mot de passe.");
          setLoading(false);
          return;
        }
        const res = await api.auth.login({ email: email.trim(), password });
        onSuccess(res.user);
      } else {
        if (!nom.trim() || !prenom.trim() || !email.trim() || !password.trim()) {
          setError("Tous les champs obligatoires doivent être renseignés.");
          setLoading(false);
          return;
        }

        if (password.length < 5) {
          setError("Le mot de passe doit comporter au moins 5 caractères.");
          setLoading(false);
          return;
        }

        const res = await api.auth.register({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          password,
          avatarUrl: avatarUrl || PRESET_AVATARS[0],
          promo,
          bio: bio.trim(),
        });

        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all">
        
        {/* Header Banner with Faculty of Medicine Sfax Branding */}
        <div className="relative bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 px-8 py-8 text-white border-b border-teal-900/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-600/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                  FMS • Université de Sfax
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
                Faculté de Médecine de Sfax
              </h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Portail académique sécurisé réservé aux carabins, internes et enseignants de la FMS. Veuillez vous identifier pour accéder au réseau d'apprentissage.
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 mt-6 max-w-md">
            <button
              id="tab-login-btn"
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Connexion
            </button>
            <button
              id="tab-register-btn"
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Créer un compte
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-white">
          {error && (
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {!isLogin && (
            <>
              {/* Name and Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-prenom"
                      type="text"
                      required
                      placeholder="Ex: Yassine"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-nom"
                      type="text"
                      required
                      placeholder="Ex: Ben Salem"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Photo de profil (Custom upload + Quick Presets) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Photo de profil <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-teal-600 shadow-md bg-slate-100 flex-shrink-0">
                    <img
                      src={customAvatarPreview || avatarUrl}
                      alt="Aperçu profil"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition">
                      <Camera className="w-4 h-4 text-teal-600" />
                      <span>Téléverser ma photo</span>
                      <input
                        id="input-avatar-file"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Ou choisir :</span>
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset);
                            setCustomAvatarPreview(null);
                          }}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                            avatarUrl === preset && !customAvatarPreview
                              ? 'border-teal-600 scale-110 shadow-sm'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo / Année d'étude médicale */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Année d'étude / Statut médical <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="select-promo"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    className="w-full pl-11 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                  >
                    {MEDICAL_PROMOS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email (Strictly unique) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Adresse Email Universitaire ou Personnelle <span className="text-red-500">*</span>
              </label>
              {!isLogin && (
                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium">
                  Usage unique garanti
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-email"
                type="email"
                required
                placeholder="etudiant@medecinesfax.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bio / Spécialité ou intérêt clinique (optionnel)
              </label>
              <textarea
                id="input-bio"
                rows={2}
                placeholder="Ex: Intéressé par la cardiologie interventionnelle et la sémiologie..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all resize-none"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>{isLogin ? 'Accéder à mon espace FMS' : 'Finaliser mon inscription'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Faculty Footer Assurance */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Faculté de Médecine de Sfax — Espace vérifié et confidentiel</span>
          </div>
        </form>
      </div>
    </div>
  );
};
