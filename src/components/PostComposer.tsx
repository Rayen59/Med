import React, { useState } from 'react';
import { User, Attachment } from '../types';
import { api, fileToDataUrl } from '../lib/api';
import { AudioRecorder } from './AudioRecorder';
import { FileText, Mic, Video, Image, Send, X, Tag, Paperclip, AlertCircle } from 'lucide-react';

interface PostComposerProps {
  currentUser: User;
  onPostCreated: () => void;
}

const MEDICAL_TAGS = [
  'Anatomie',
  'Physiologie',
  'Sémiologie',
  'Cardiologie',
  'Pédiatrie',
  'Chirurgie',
  'Pharmacologie',
  'Gynécologie',
  'Urgences',
  'Stage CHU Sfax',
  'Annales & QCM',
];

export const PostComposer: React.FC<PostComposerProps> = ({ currentUser, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Document upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError("Le document ne doit pas dépasser 25 Mo.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const newAtt: Attachment = {
        id: 'doc_' + Date.now(),
        name: file.name,
        type: 'document',
        url: dataUrl,
        size: file.size,
      };
      setAttachments((prev) => [...prev, newAtt]);
      e.target.value = '';
    } catch {
      setError("Échec de la lecture du document.");
    }
  };

  // Handle Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 35 * 1024 * 1024) {
      setError("La vidéo ne doit pas dépasser 35 Mo.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const newAtt: Attachment = {
        id: 'vid_' + Date.now(),
        name: file.name,
        type: 'video',
        url: dataUrl,
        size: file.size,
      };
      setAttachments((prev) => [...prev, newAtt]);
      e.target.value = '';
    } catch {
      setError("Échec de la lecture de la vidéo.");
    }
  };

  // Handle Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 15 Mo.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const newAtt: Attachment = {
        id: 'img_' + Date.now(),
        name: file.name,
        type: 'image',
        url: dataUrl,
        size: file.size,
      };
      setAttachments((prev) => [...prev, newAtt]);
      e.target.value = '';
    } catch {
      setError("Échec de la lecture de l'image.");
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 4) {
        setSelectedTags((prev) => [...prev, tag]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) {
      setError("Veuillez rédiger un message ou ajouter une pièce jointe avant de publier.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await api.posts.create({
        content: content.trim(),
        attachments,
        tags: selectedTags,
      });

      setContent('');
      setAttachments([]);
      setSelectedTags([]);
      setShowAudioRecorder(false);
      onPostCreated();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
      <form onSubmit={handleSubmit} className="p-5">
        
        {/* Author Header */}
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.prenom}
            className="w-10 h-10 rounded-full object-cover border border-teal-600 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-bold text-slate-800 text-sm">
              {currentUser.prenom} {currentUser.nom}
            </span>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-semibold border border-teal-100">
                {currentUser.promo}
              </span>
              <span>• Partager avec la communauté médicale</span>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          id="post-content-input"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partager un cours, une question de stage, une fiche de synthèse, un cas clinique ou un document..."
          className="w-full text-slate-800 placeholder:text-slate-400 text-sm border-none focus:outline-none focus:ring-0 resize-none"
        />

        {/* Audio Recorder Module */}
        {showAudioRecorder && (
          <div className="mt-3 mb-3">
            <AudioRecorder
              onAudioReady={(attachment) => {
                setAttachments((prev) => [...prev, attachment]);
                setShowAudioRecorder(false);
              }}
              onCancel={() => setShowAudioRecorder(false)}
            />
          </div>
        )}

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 mb-3">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <div className="flex items-center space-x-2 truncate pr-2">
                  {att.type === 'document' && <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  {att.type === 'audio' && <Mic className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                  {att.type === 'video' && <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                  {att.type === 'image' && <Image className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  <span className="truncate font-medium text-slate-700">{att.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Medical Tags Selector */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2">
            <Tag className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold">Matière ou Module FMS :</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MEDICAL_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1 sm:space-x-2">
            
            {/* Document button */}
            <label className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer transition flex items-center space-x-1.5 text-xs font-medium" title="Joindre un document (PDF, Word...)">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Document</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleDocumentUpload}
                className="hidden"
              />
            </label>

            {/* Vocal note button */}
            <button
              type="button"
              onClick={() => setShowAudioRecorder((prev) => !prev)}
              className={`p-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-medium ${
                showAudioRecorder
                  ? 'bg-teal-100 text-teal-800'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
              }`}
              title="Enregistrer un vocal"
            >
              <Mic className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Vocal</span>
            </button>

            {/* Video button */}
            <label className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer transition flex items-center space-x-1.5 text-xs font-medium" title="Joindre une vidéo">
              <Video className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Vidéo</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>

            {/* Image button */}
            <label className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer transition flex items-center space-x-1.5 text-xs font-medium" title="Joindre une image / cas clinique">
              <Image className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit button */}
          <button
            id="publish-btn"
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Publier</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
