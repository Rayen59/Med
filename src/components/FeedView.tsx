import React, { useState } from 'react';
import { Post, User } from '../types';
import { api } from '../lib/api';
import { PostComposer } from './PostComposer';
import { EditPostModal } from './EditPostModal';
import { SaveToSpaceModal } from './SaveToSpaceModal';
import { DocumentSearchModal } from './DocumentSearchModal';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
  Download,
  Volume2,
  Film,
  Search,
  Send,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  Files
} from 'lucide-react';

interface FeedViewProps {
  currentUser: User;
  posts: Post[];
  onRefresh: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ currentUser, posts, onRefresh }) => {
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [savingPost, setSavingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [showDocSearch, setShowDocSearch] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 4000);
  };

  // Like toggle
  const handleLike = async (postId: string) => {
    if (currentUser.isRestricted) {
      showErrorToast("Votre compte est en mode lecture seule : interactions désactivées.");
      return;
    }
    try {
      await api.posts.toggleLike(postId);
      onRefresh();
    } catch (err: any) {
      showErrorToast(err.message || "Erreur lors du 'J'aime'");
    }
  };

  // Confirm delete post
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await api.posts.delete(postToDelete.id);
      setPostToDelete(null);
      setOpenMenuPostId(null);
      onRefresh();
    } catch (err: any) {
      console.error('Delete failed', err);
      showErrorToast(err.message || 'Impossible de supprimer cette publication');
    } finally {
      setDeleting(false);
    }
  };

  // Submit comment
  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.isRestricted) {
      showErrorToast("Votre compte est en mode lecture seule : les commentaires sont désactivés.");
      return;
    }

    const text = commentText[postId]?.trim();
    if (!text) return;

    setSubmittingComment(postId);
    try {
      await api.posts.addComment(postId, text);
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      onRefresh();
    } catch (err: any) {
      showErrorToast(err.message || 'Erreur lors de l\'envoi du commentaire');
    } finally {
      setSubmittingComment(null);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTagFilter || p.tags?.includes(selectedTagFilter);

    return matchesSearch && matchesTag;
  });

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Toast Error Alert */}
      {toastError && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xl flex items-center space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4" />
          <span>{toastError}</span>
        </div>
      )}

      {/* Restriction Alert for Read-Only Users */}
      {currentUser.isRestricted && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start space-x-3 shadow-xs">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Mode Lecture Seule Activé (Décision Administrative)
            </h4>
            <p className="text-xs mt-0.5 leading-relaxed">
              Vos interactions ont été limitées par l'administration de la Faculté de Médecine de Sfax. Vous pouvez consulter les cours, publications et télécharger les documents, mais la création de publications et de commentaires est restreinte.
            </p>
          </div>
        </div>
      )}

      {/* Search & Document Explorer Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par mot-clé, matière, enseignant ou carabin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
          />
        </div>

        {/* Global Document Search Button */}
        <button
          onClick={() => setShowDocSearch(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-xs transition flex-shrink-0"
        >
          <Files className="w-4 h-4" />
          <span>Recherche Documents</span>
        </button>

        {selectedTagFilter && (
          <button
            onClick={() => setSelectedTagFilter(null)}
            className="flex-shrink-0 flex items-center space-x-1 px-3 py-2 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold rounded-xl hover:bg-teal-200 transition"
          >
            <span>Filtre: {selectedTagFilter}</span>
            <span className="ml-1 text-teal-600 font-bold">×</span>
          </button>
        )}
      </div>

      {/* Main Publication Composer (disabled or warned if restricted) */}
      {!currentUser.isRestricted ? (
        <PostComposer currentUser={currentUser} onPostCreated={onRefresh} />
      ) : (
        <div className="mb-6 p-5 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-center text-slate-500 dark:text-slate-400 text-xs">
          🔒 Vous ne pouvez pas publier de nouveau contenu en raison de la limitation administrative en mode lecture seule.
        </div>
      )}

      {/* Posts Stream */}
      <div className="space-y-6 mt-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Aucune publication trouvée</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Aucune publication ne correspond à vos critères de recherche."
                : "Soyez le premier carabin à partager un cours, une fiche ou une note clinique pour votre promotion !"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isAuthor = post.authorId === currentUser.id;
            const isAdmin = currentUser.role === 'admin';
            const canManage = isAuthor || isAdmin;
            const isMenuOpen = openMenuPostId === post.id;
            const hasLiked = post.likes.includes(currentUser.id);
            const areCommentsOpen = activeCommentsPostId === post.id;

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Post Header */}
                <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {post.authorName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900">
                          {post.authorPromo}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDate(post.createdAt)}
                        {post.updatedAt && <span className="ml-1 italic">(modifié)</span>}
                      </span>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuPostId(isMenuOpen ? null : post.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs">
                        <button
                          onClick={() => {
                            setSavingPost(post);
                            setOpenMenuPostId(null);
                          }}
                          className="w-full flex items-center space-x-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-teal-600" />
                          <span>Classer dans un espace</span>
                        </button>

                        {canManage && (
                          <>
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full flex items-center space-x-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>
                                {isAuthor ? "Modifier le texte" : "Modifier (Admin)"}
                              </span>
                            </button>
                            
                            {/* Delete button (opens custom in-app confirmation modal) */}
                            <button
                              onClick={() => {
                                setPostToDelete(post);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full flex items-center space-x-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>
                                {isAuthor ? "Supprimer le post" : "Supprimer (Modération Admin)"}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content Text */}
                {post.content && (
                  <div className="px-5 py-2 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </div>
                )}

                {/* Medical Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="px-5 py-2 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTagFilter(tag)}
                        className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 px-2.5 py-0.5 rounded-md transition"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Attachments Section */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="px-5 py-3 space-y-3">
                    {post.attachments.map((att) => {
                      if (att.type === 'document') {
                        return (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                          >
                            <div className="flex items-center space-x-3 truncate pr-2">
                              <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{att.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Document académique FMS</p>
                              </div>
                            </div>
                            <a
                              href={att.url}
                              download={att.name}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-teal-600 hover:text-white hover:border-teal-600 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Télécharger</span>
                            </a>
                          </div>
                        );
                      }

                      if (att.type === 'audio') {
                        return (
                          <div
                            key={att.id}
                            className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-2xl flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2 text-xs font-bold text-teal-900 dark:text-teal-200">
                              <Volume2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                              <span>{att.name || 'Enregistrement vocal médical'}</span>
                            </div>
                            <audio controls src={att.url} className="w-full h-9 rounded-lg" />
                          </div>
                        );
                      }

                      if (att.type === 'video') {
                        return (
                          <div key={att.id} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                            <video controls src={att.url} className="w-full max-h-96 object-contain" />
                            <div className="p-2.5 bg-slate-900 text-white text-xs flex items-center space-x-2">
                              <Film className="w-4 h-4 text-purple-400" />
                              <span className="truncate">{att.name}</span>
                            </div>
                          </div>
                        );
                      }

                      if (att.type === 'image') {
                        return (
                          <div key={att.id} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    {/* Like button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1.5 font-semibold transition ${
                        hasLiked ? 'text-rose-600 dark:text-rose-400' : 'hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-600 dark:text-rose-400' : ''}`} />
                      <span>{post.likes.length}</span>
                      <span className="hidden sm:inline">J'aime</span>
                    </button>

                    {/* Comments toggle */}
                    <button
                      onClick={() => setActiveCommentsPostId(areCommentsOpen ? null : post.id)}
                      className="flex items-center space-x-1.5 font-semibold hover:text-teal-700 dark:hover:text-teal-400 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments?.length || 0}</span>
                      <span className="hidden sm:inline">Commentaires</span>
                    </button>
                  </div>

                  {/* Bookmark / Classify in space */}
                  <button
                    onClick={() => setSavingPost(post)}
                    className="flex items-center space-x-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 px-2.5 py-1.5 rounded-xl transition"
                    title="Enregistrer et classer dans un espace"
                  >
                    <Bookmark className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Classer dans un espace</span>
                  </button>
                </div>

                {/* Comments Section */}
                {areCommentsOpen && (
                  <div className="bg-slate-50/70 dark:bg-slate-950/40 p-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-3">
                        {post.comments.map((com) => (
                          <div key={com.id} className="flex items-start space-x-2.5">
                            <img
                              src={com.userAvatar}
                              alt={com.userName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 mt-0.5"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{com.userName}</span>
                                <span className="text-[10px] text-slate-400">{formatDate(com.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{com.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">
                        Aucun commentaire. Soyez le premier carabin à réagir !
                      </p>
                    )}

                    {/* New Comment Input */}
                    {!currentUser.isRestricted ? (
                      <form
                        onSubmit={(e) => handleCommentSubmit(post.id, e)}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="text"
                          placeholder="Écrire une réponse médicale ou poser une question..."
                          value={commentText[post.id] || ''}
                          onChange={(e) =>
                            setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment === post.id || !commentText[post.id]?.trim()}
                          className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition disabled:opacity-40"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center py-1">
                        🔒 Commentaire désactivé (mode lecture seule)
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* IN-APP DELETE POST CONFIRMATION MODAL (No window.confirm!) */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Supprimer cette publication ?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Êtes-vous sûr de vouloir supprimer définitivement cette publication et toutes ses pièces jointes ? Cette action est irréversible.
            </p>

            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={() => {
            setEditingPost(null);
            onRefresh();
          }}
        />
      )}

      {/* Save / Classify Post Modal */}
      {savingPost && (
        <SaveToSpaceModal
          post={savingPost}
          onClose={() => setSavingPost(null)}
          onSaved={() => {
            setSavingPost(null);
            onRefresh();
          }}
        />
      )}

      {/* Global Document Search Modal */}
      <DocumentSearchModal
        isOpen={showDocSearch}
        onClose={() => setShowDocSearch(false)}
        posts={posts}
      />

    </div>
  );
};
