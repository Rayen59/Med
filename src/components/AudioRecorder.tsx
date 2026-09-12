import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Volume2, AlertCircle } from 'lucide-react';
import { Attachment } from '../types';

interface AudioRecorderProps {
  onAudioReady: (attachment: Attachment) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setAudioUrl(base64Data);
        };
        reader.readAsDataURL(audioBlob);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setMicError("Impossible d'accéder au microphone. Veuillez autoriser l'accès au micro dans votre navigateur.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleValidate = () => {
    if (audioUrl) {
      onAudioReady({
        id: 'aud_' + Date.now(),
        name: `Vocal_Medical_${new Date().toLocaleTimeString('fr-FR').replace(/:/g, '-')}.webm`,
        type: 'audio',
        url: audioUrl,
        duration: recordingSeconds || 5,
      });
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center space-x-1.5">
          <Volume2 className="w-4 h-4 text-teal-600" />
          <span>Note Vocale Médicale</span>
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          Annuler
        </button>
      </div>

      {micError && (
        <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-100/80 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-teal-300 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
            </span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {formatTime(recordingSeconds)}
            </span>
            <span className="text-xs text-slate-500 italic">Enregistrement audio en cours...</span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Arrêter</span>
          </button>
        </div>
      )}

      {/* Finished Recording with Preview */}
      {!isRecording && audioUrl && (
        <div className="flex flex-col space-y-2 p-3 bg-white rounded-lg border border-teal-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <span className="text-xs font-medium text-slate-700">
                Aperçu audio ({formatTime(recordingSeconds)})
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => { setAudioUrl(null); setRecordingSeconds(0); }}
                className="p-1.5 text-slate-400 hover:text-red-500 transition"
                title="Recommencer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleValidate}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Joindre la note vocale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Idle state - Click to start */}
      {!isRecording && !audioUrl && (
        <div className="text-center py-3 bg-white rounded-lg border border-dashed border-teal-300">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Mic className="w-4 h-4" />
            <span>Démarrer l'enregistrement vocal</span>
          </button>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Idéal pour résumer un cours, un cas clinique ou poser une question orale.
          </p>
        </div>
      )}
    </div>
  );
};
