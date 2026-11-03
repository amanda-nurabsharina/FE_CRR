"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { offlineDb } from "@/lib/db";
import {
  Mic,
  Square,
  Radio,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface WebRecorderModalProps {
  courtSessionId: string;
  sessionTitle: string;
  onClose: () => void;
  onFinished: (evidence: any) => void;
}

export default function WebRecorderModal({
  courtSessionId,
  sessionTitle,
  onClose,
  onFinished,
}: WebRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [evidence, setEvidence] = useState<any | null>(null);
  const [syncedChunks, setSyncedChunks] = useState(0);
  const [offlineChunksCount, setOfflineChunksCount] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [finalResult, setFinalResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const sequenceRef = useRef(1);

  // Monitor Network
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineChunks();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [evidence]);

  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch (e) {
      console.warn("WakeLock not available:", e);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMsg("");
    try {
      const initRes = await api.initRecording({
        court_session_id: courtSessionId,
        source_type: isOnline ? "browser_mic_online" : "browser_mic_offline",
        mime_type: "audio/webm;codecs=opus",
      });

      const currentEvidence = initRes.data;
      setEvidence(currentEvidence);
      sequenceRef.current = 1;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      drawVisualizer();

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          const currentSeq = sequenceRef.current++;
          await handleAudioChunk(currentEvidence.id, currentSeq, e.data);
        }
      };

      recorder.start(4000); // 4 seconds chunk
      mediaRecorderRef.current = recorder;

      setIsRecording(true);
      await acquireWakeLock();

      setElapsedSec(0);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengakses mikrofon atau memulai sesi rekaman");
    }
  };

  const activeUploadsRef = useRef<Promise<any>[]>([]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const b64 = res.split(",")[1] || "";
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAudioChunk = async (evidenceId: string, seq: number, blob: Blob) => {
    const uploadTask = (async () => {
      try {
        const b64 = await blobToBase64(blob);
        const crc = "00000000";

        await offlineDb.chunks.add({
          evidenceId,
          sequenceNumber: seq,
          crc32Checksum: crc,
          base64Data: b64,
          isSynced: false,
          createdAt: Date.now(),
        });

        if (navigator.onLine) {
          await api.uploadChunk({
            evidence_id: evidenceId,
            sequence_number: seq,
            crc32_checksum: crc,
            base64_data: b64,
          });

          await offlineDb.chunks
            .where({ evidenceId, sequenceNumber: seq })
            .modify({ isSynced: true });

          setSyncedChunks((prev) => prev + 1);
        } else {
          setOfflineChunksCount((prev) => prev + 1);
        }
      } catch (err) {
        console.warn("Chunk upload pending offline sync:", err);
        setOfflineChunksCount((prev) => prev + 1);
      }
    })();

    activeUploadsRef.current.push(uploadTask);
    await uploadTask;
  };

  const syncOfflineChunks = async () => {
    if (!evidence) return;
    try {
      const unsynced = await offlineDb.chunks
        .where({ evidenceId: evidence.id, isSynced: false })
        .toArray();

      for (const item of unsynced) {
        await api.uploadChunk({
          evidence_id: item.evidenceId,
          sequence_number: item.sequenceNumber,
          crc32_checksum: item.crc32Checksum,
          base64_data: item.base64Data,
        });
        await offlineDb.chunks.update(item.id!, { isSynced: true });
        setSyncedChunks((prev) => prev + 1);
        setOfflineChunksCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Auto-sync error:", e);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !evidence) return;

    setFinalizing(true);
    clearInterval(timerIntervalRef.current);
    releaseWakeLock();

    try {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      console.warn("Error stopping recorder tracks:", e);
    }

    setIsRecording(false);

    // Wait for all in-flight chunk uploads to complete
    setTimeout(async () => {
      try {
        await Promise.all(activeUploadsRef.current);
        await syncOfflineChunks();

        const totalChunks = Math.max(1, sequenceRef.current - 1);
        const res = await api.finalizeRecording(evidence.id, {
          total_chunks: totalChunks,
          estimated_duration_sec: Math.max(1, elapsedSec),
        });

        setFinalResult(res.data);
        onFinished(res.data);
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal menyatukan potongan audio master");
      } finally {
        setFinalizing(false);
      }
    }, 1000);
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isRecording) return;
      requestAnimationFrame(render);
      analyserRef.current?.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = "#d97706"; // amber-600
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Web Audio Recorder (Court Room)</h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px]">{sessionTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                <Wifi className="w-3 h-3 text-emerald-600" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-600" /> Offline (IDB Caching)
              </span>
            )}
            {!isRecording && !finalizing && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {finalResult ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">Rekaman Sidang Tersimpan & Tersegel!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Audio master telah dirangkai utuh dan nilai hash kriptografis SHA-256 berhasil dikalkulasi.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">SHA-256 Master Checksum:</span>
                <span className="font-mono text-amber-700 break-all text-[11px] font-semibold">
                  {finalResult.sha256_hash}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600 font-medium">
                <span>Durasi: {finalResult.duration_seconds} detik</span>
                <span>Ukuran: {(finalResult.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition text-sm cursor-pointer shadow-sm"
            >
              Lanjutkan ke Transkripsi / Berita Acara
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visualizer Canvas */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-36">
              {isRecording ? (
                <>
                  <canvas ref={canvasRef} width={280} height={70} className="w-full h-20 mb-2" />
                  <div className="flex items-center gap-2 text-red-600 text-xs font-mono font-bold tracking-widest animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    RECORDING LIVE • {formatTimer(elapsedSec)}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <Mic className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                  <div className="text-xs text-slate-500">
                    Siap merekam persidangan. Audio dipecah per chunk dan disimpan lokal di browser.
                  </div>
                </div>
              )}
            </div>

            {/* Offline Resilience Telemetry */}
            {isRecording && (
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">TERSIMPAN KE SERVER:</span>
                  <span className="font-bold text-emerald-700">{syncedChunks} chunks</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">CACHE OFFLINE (INDEXEDDB):</span>
                  <span className="font-bold text-amber-700">{offlineChunksCount} chunks</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={finalizing}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl shadow-sm transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  Mulai Rekam Persidangan
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  disabled={finalizing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-sm transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-current" />
                  {finalizing ? "Menyegel & Menghitung SHA-256..." : "Selesai & Kunci Rekaman"}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              *Didukung Screen WakeLock (mencegah laptop/layar tidur) & proteksi chunk IndexedDB jika koneksi ruang sidang terputus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
