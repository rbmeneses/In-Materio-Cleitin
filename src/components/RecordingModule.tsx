import React, { useState, useRef, useEffect } from 'react';
import { Video, Square, Download, Camera, CheckCircle2, Film } from 'lucide-react';

interface RecordingModuleProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const RecordingModule: React.FC<RecordingModuleProps> = ({ canvasRef }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Timer effect for recording duration
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start video recording from canvas
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas não disponível para gravação.');
      return;
    }

    try {
      recordedChunksRef.current = [];
      const stream = canvas.captureStream(30); // 30 FPS stream

      // Supported mimeType check
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);

        // Auto download
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `cleitin_simulacao_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      recorder.start(100); // 100ms chunk slices
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Falha ao iniciar gravador de vídeo do canvas:', err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Snapshot capture (PNG)
  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cleitin_snapshot_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 3000);
    } catch (err) {
      console.error('Falha ao capturar snapshot', err);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-pink-950/50 border border-pink-500/30 flex items-center justify-center text-pink-400">
          <Film className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-200">
            Gravação de Vídeo & Snapshots do Silício
          </div>
          <p className="text-[11px] text-slate-400">
            Grave o fluxo contínuo de pacotes fotônicos e pulsos da matriz (WebM 30 FPS)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isRecording ? (
          <div className="flex items-center gap-3 bg-rose-950/60 border border-rose-500/50 px-3.5 py-1.5 rounded-lg text-xs font-mono text-rose-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>REC {formatTime(recordSeconds)}</span>
            <button
              onClick={stopRecording}
              className="flex items-center gap-1 ml-2 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs cursor-pointer font-bold"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Parar & Salvar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-pink-400" />
            <span>Gravar Vídeo</span>
          </button>
        )}

        {/* Snapshot button */}
        <button
          onClick={takeSnapshot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>{snapshotSuccess ? 'Salvo!' : 'Snapshot'}</span>
        </button>

        {recordedVideoUrl && !isRecording && (
          <a
            href={recordedVideoUrl}
            download="cleitin_video_ultimo.webm"
            className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-mono"
          >
            <Download className="w-3 h-3" />
            <span>Último Vídeo</span>
          </a>
        )}
      </div>
    </div>
  );
};
