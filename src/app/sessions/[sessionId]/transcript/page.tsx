"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { exportTranscriptToWord } from "@/lib/exportDocx";
import {
  FileText,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sparkles,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  Clock,
  Download,
  FileCheck,
  LayoutList,
  CheckCircle2,
  Gavel,
  Volume2,
} from "lucide-react";

export default function TranscriptPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const audioId = searchParams.get("audioId");
  const router = useRouter();

  const [transcript, setTranscript] = useState<any | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [courtCase, setCourtCase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [asrLoading, setAsrLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<"document" | "editor">("document");

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioStreamUrl, setAudioStreamUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioId) {
      setAudioStreamUrl(api.getStreamUrl(audioId));
      fetchTranscript();
    }
  }, [audioId]);

  useEffect(() => {
    if (audioRef.current && audioStreamUrl) {
      audioRef.current.load();
    }
  }, [audioStreamUrl]);

  // Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Space: Play/Pause
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      // Ctrl + ArrowLeft: Rewind 5s
      else if (e.ctrlKey && e.code === "ArrowLeft") {
        e.preventDefault();
        seekRelative(-5);
      }
      // Ctrl + ArrowRight: Forward 5s
      else if (e.ctrlKey && e.code === "ArrowRight") {
        e.preventDefault();
        seekRelative(5);
      }
      // Ctrl + Enter: Insert new segment at current time
      else if (e.ctrlKey && e.code === "Enter") {
        e.preventDefault();
        addNewSegment();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, isPlaying, segments]);

  const fetchTranscript = async () => {
    if (!audioId) return;
    setLoading(true);
    try {
      const res = await api.getTranscript(audioId);
      setTranscript(res.data);
      setSegments(res.data?.segments || []);

      // Also fetch real court case & session
      try {
        const casesRes = await api.listCases();
        if (casesRes.data && casesRes.data.length > 0) {
          for (const c of casesRes.data) {
            const foundSess = c.sessions?.find((s: any) => s.id === resolvedParams.sessionId);
            if (foundSess) {
              setCourtCase(c);
              setSessionData(foundSess);
              break;
            }
          }
          if (!courtCase) {
            setCourtCase(casesRes.data[0]);
            if (casesRes.data[0].sessions && casesRes.data[0].sessions.length > 0) {
              setSessionData(casesRes.data[0].sessions[0]);
            }
          }
        }
      } catch (caseErr) {
        console.warn("Fetch case error:", caseErr);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerASR = async () => {
    if (!audioId) return;
    setAsrLoading(true);
    try {
      const durSec = Math.floor(duration) > 0 ? Math.floor(duration) : 1050;
      const res = await api.triggerASR(audioId, durSec);
      setTranscript(res.data);
      setSegments(res.data.segments || []);
      setViewMode("document");
    } catch (err: any) {
      alert(err.message || "Gagal menjalankan transkripsi ASR");
    } finally {
      setAsrLoading(false);
    }
  };

  const handleSaveSegments = async () => {
    if (!transcript) return;
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.saveTranscriptSegments(transcript.id, segments);
      setTranscript(res.data);
      setSegments(res.data.segments || []);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan transkrip");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExportWord = () => {
    if (segments.length === 0) {
      alert("Transkrip masih kosong. Jalankan 'Transkripsi AI Otomatis' terlebih dahulu.");
      return;
    }

    exportTranscriptToWord({
      caseNumber: courtCase?.case_number || "51/Pid.B/2026/PN.Tlm",
      courtName: courtCase?.court_name || "Pengadilan Negeri Tilamuta (Kabupaten Boalemo)",
      sessionTitle: sessionData?.session_title || "Pemeriksaan Keterangan Terdakwa (Pencurian Sepeda Motor Yamaha X-Ride)",
      sessionDate: new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      clientName: courtCase?.client_name || "Alim (Terdakwa)",
      counterPartyName: courtCase?.counter_party_name || "Jaksa Penuntut Umum Kejari Boalemo",
      judgePanelNames: courtCase?.judge_panel_names || "Dr. Wahyu Iman S.H., M.H. (Ketua), Siti Rahma S.H., Hendra S.H.",
      durationFormatted: formatSec(duration || 1050),
      segments: segments,
    });
  };

  // Player controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekRelative = (sec: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const seekTo = (sec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = sec;
    setCurrentTime(sec);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const addNewSegment = () => {
    const startMs = Math.floor(currentTime * 1000);
    const newSeg = {
      id: Math.random().toString(),
      speaker_tag: "Penasihat Hukum",
      start_time_ms: startMs,
      end_time_ms: startMs + 6000,
      text_content: "",
      sequence_order: segments.length + 1,
    };
    setSegments([...segments, newSeg]);
    setViewMode("editor");
  };

  const updateSegmentText = (index: number, text: string) => {
    const updated = [...segments];
    updated[index].text_content = text;
    setSegments(updated);
  };

  const updateSegmentSpeaker = (index: number, speaker: string) => {
    const updated = [...segments];
    updated[index].speaker_tag = speaker;
    setSegments(updated);
  };

  const removeSegment = (index: number) => {
    const updated = segments.filter((_, i) => i !== index);
    setSegments(updated);
  };

  const getSpeakerBadgeStyle = (speaker: string) => {
    switch (speaker) {
      case "Hakim Ketua":
      case "Hakim Anggota":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Jaksa Penuntut":
        return "bg-red-100 text-red-900 border-red-300";
      case "Penasihat Hukum":
        return "bg-sky-100 text-sky-900 border-sky-300";
      case "Terdakwa":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "Saksi Fakta":
      case "Saksi Ahli":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "Panitera":
        return "bg-indigo-100 text-indigo-900 border-indigo-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer mb-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-600" />
              Transkripsi & Automasi Berita Acara Sidang
            </h1>
            <p className="text-xs text-slate-600">
              Voice-to-Text cerdas berstempel waktu, speaker diarization, dan ekspor langsung ke Microsoft Word (.docx).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Switcher */}
            <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1 text-xs shadow-sm">
              <button
                onClick={() => setViewMode("document")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "document"
                    ? "bg-amber-500 text-white font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Format Naskah Word
              </button>
              <button
                onClick={() => setViewMode("editor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "editor"
                    ? "bg-amber-500 text-white font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Editor Timeline
              </button>
            </div>

            {/* Export Word Button */}
            <button
              onClick={handleExportWord}
              disabled={segments.length === 0}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Unduh Naskah Transkrip Lengkap Format Microsoft Word (.doc / .docx)"
            >
              <Download className="w-4 h-4" />
              Export Word (.docx)
            </button>

            {/* Auto AI Transcribe */}
            <button
              onClick={handleTriggerASR}
              disabled={asrLoading || !audioId}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {asrLoading ? "Mentranskripsi Full Rekaman..." : "Transkripsi AI Otomatis"}
            </button>
          </div>
        </div>

        {/* Audio Player Controller Bar (Sticky) */}
        {audioId && (
          <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-md space-y-3">
            <audio
              ref={audioRef}
              src={audioStreamUrl || undefined}
              preload="metadata"
              onError={(e) => {
                console.error("Audio playback error:", e);
              }}
              onTimeUpdate={() => {
                if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (audioRef.current) setDuration(audioRef.current.duration);
              }}
              onEnded={() => setIsPlaying(false)}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Playback Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => seekRelative(-5)}
                  title="Mundur 5 detik (Ctrl + Left)"
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  title="Play / Pause (Ctrl + Space)"
                  className="w-11 h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-md shadow-amber-500/25 transition cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => seekRelative(5)}
                  title="Maju 5 detik (Ctrl + Right)"
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="text-xs font-mono text-slate-600 ml-2">
                  <span className="text-slate-900 font-bold">{formatSec(currentTime)}</span> /{" "}
                  {formatSec(duration)}
                </div>
              </div>

              {/* Scrubber slider */}
              <div className="w-full sm:flex-1 mx-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                      playbackRate === rate
                        ? "bg-amber-500 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Hotkeys cheatsheet banner */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-[10px]">
                    Ctrl+Space
                  </kbd>{" "}
                  Play/Pause
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-[10px]">
                    Ctrl+← / →
                  </kbd>{" "}
                  Mundur/Maju 5s
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-[10px]">
                    Ctrl+Enter
                  </kbd>{" "}
                  Segmen Baru
                </span>
              </div>

              <span className="text-amber-700 font-medium hidden md:inline">
                *Klik stempel waktu pada segmen untuk melompat audio ke kalimat tersebut.
              </span>
            </div>
          </div>
        )}

        {/* CONTENT VIEW: Word Document Format OR Timeline Editor */}
        {segments.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Automasi Rekaman ke Naskah Sidang</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                Klik tombol <strong>"Transkripsi AI Otomatis"</strong> di atas. Sistem akan menganalisis rekaman suara secara menyeluruh, membagi dialog antar pembicara (Hakim, Jaksa, Advokat, Saksi, Terdakwa), dan menyusun naskah siap ekspor ke Microsoft Word (.docx).
              </p>
            </div>
            <button
              onClick={handleTriggerASR}
              disabled={asrLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {asrLoading ? "Memproses Full Rekaman..." : "Jalankan Transkripsi AI Sekarang"}
            </button>
          </div>
        ) : viewMode === "document" ? (
          /* TAMPILAN NASKAH WORD / DOKUMEN BERSIH */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Transkripsi Lengkap ({segments.length} Segmen Dialog)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Durasi: {formatSec(duration || 1050)}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Naskah Verbatim Persidangan</h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportWord}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Unduh File Word (.doc)
                </button>

                <Link
                  href={`/sessions/${resolvedParams.sessionId}/report`}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  <Gavel className="w-4 h-4" />
                  Buka Berita Acara (BAS)
                </Link>
              </div>
            </div>

            {/* Document Script View */}
            <div className="space-y-3.5 max-h-[650px] overflow-y-auto pr-2">
              {segments.map((seg, idx) => {
                const startSec = seg.start_time_ms / 1000;
                const isCurrent = currentTime >= startSec && currentTime <= seg.end_time_ms / 1000;

                return (
                  <div
                    key={seg.id || idx}
                    className={`p-4 rounded-2xl transition-all duration-150 border ${
                      isCurrent
                        ? "bg-amber-50/90 border-amber-300 shadow-sm ring-1 ring-amber-300"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Click to Seek */}
                        <button
                          onClick={() => seekTo(startSec)}
                          title="Klik untuk mendengarkan audio pada dialog ini"
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white hover:bg-amber-500 hover:text-white text-amber-700 border border-slate-200 text-[11px] font-mono transition cursor-pointer shadow-2xs"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {formatMs(seg.start_time_ms)} - {formatMs(seg.end_time_ms)}
                        </button>

                        {/* Speaker Badge */}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getSpeakerBadgeStyle(
                            seg.speaker_tag
                          )}`}
                        >
                          {seg.speaker_tag}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">#{idx + 1}</span>
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed font-serif text-justify pl-1">
                      {seg.text_content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* TAMPILAN TIMELINE / MANUAL EDITOR */
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-600">
                Mode Editor Timeline: Anda dapat menyunting kalimat atau mengubah nama pembicara jika diperlukan.
              </span>
              <button
                onClick={handleSaveSegments}
                disabled={saveLoading}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? "Menyimpan..." : saveSuccess ? "Tersimpan ✓" : "Simpan Perubahan"}
              </button>
            </div>

            {segments.map((seg, idx) => {
              const startSec = seg.start_time_ms / 1000;
              const isCurrent = currentTime >= startSec && currentTime <= seg.end_time_ms / 1000;

              return (
                <div
                  key={seg.id || idx}
                  className={`border rounded-2xl p-4 transition-all duration-200 ${
                    isCurrent
                      ? "bg-amber-50 border-amber-300 shadow-sm ring-1 ring-amber-300"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => seekTo(startSec)}
                        title="Putar dari detik ini"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-500 hover:text-white text-amber-700 border border-slate-200 text-xs font-mono transition cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        {formatMs(seg.start_time_ms)} - {formatMs(seg.end_time_ms)}
                      </button>

                      <select
                        value={seg.speaker_tag}
                        onChange={(e) => updateSegmentSpeaker(idx, e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-semibold shadow-2xs"
                      >
                        <option value="Hakim Ketua">Hakim Ketua</option>
                        <option value="Hakim Anggota">Hakim Anggota</option>
                        <option value="Jaksa Penuntut">Jaksa Penuntut</option>
                        <option value="Penasihat Hukum">Penasihat Hukum</option>
                        <option value="Terdakwa">Terdakwa</option>
                        <option value="Saksi Fakta">Saksi Fakta</option>
                        <option value="Saksi Ahli">Saksi Ahli</option>
                        <option value="Panitera">Panitera</option>
                      </select>
                    </div>

                    <button
                      onClick={() => removeSegment(idx)}
                      title="Hapus baris ini"
                      className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={seg.text_content}
                    onChange={(e) => updateSegmentText(idx, e.target.value)}
                    placeholder="Ketik isi ucapan pembicara di persidangan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed resize-y focus:bg-white transition"
                  />
                </div>
              );
            })}

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={addNewSegment}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                Tambah Baris Manual (Ctrl + Enter)
              </button>

              <button
                onClick={handleSaveSegments}
                disabled={saveLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? "Menyimpan Transkrip..." : "Simpan Seluruh Suntingan"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
