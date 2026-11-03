"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WebRecorderModal from "@/components/WebRecorderModal";
import MediaUploadModal from "@/components/MediaUploadModal";
import { api } from "@/lib/api";
import {
  Calendar,
  Mic,
  UploadCloud,
  FileText,
  Clock,
  ChevronLeft,
  Plus,
  Hash,
  Gavel,
  FileAudio,
} from "lucide-react";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [courtCase, setCourtCase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [activeRecorderSession, setActiveRecorderSession] = useState<any | null>(null);
  const [activeUploadSession, setActiveUploadSession] = useState<any | null>(null);

  // New Session Form
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchCaseDetails();
  }, [resolvedParams.id]);

  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getCase(resolvedParams.id);
      setCourtCase(res.data);
    } catch (err: any) {
      alert(err.message || "Gagal memuat detail perkara");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSession(resolvedParams.id, {
        session_title: sessionTitle,
        session_date: sessionDate,
      });
      setShowAddSessionModal(false);
      setSessionTitle("");
      fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || "Gagal menambah jadwal sidang");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="p-12 text-center text-slate-500 text-sm">Memuat data perkara sidang...</div>
      </div>
    );
  }

  if (!courtCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="p-12 text-center text-slate-500">Perkara tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Daftar Perkara
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    {courtCase.case_category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {courtCase.id.slice(0, 8)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {courtCase.case_number}
                </h1>
                <div className="text-sm text-slate-500 mt-1 font-medium">{courtCase.court_name}</div>
              </div>

              <button
                onClick={() => setShowAddSessionModal(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Jadwal Sidang
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">KLIEN / PEMOHON:</span>
                <span className="font-semibold text-slate-900">{courtCase.client_name}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">LAWAN / PENUNTUT:</span>
                <span className="font-semibold text-slate-900">
                  {courtCase.counter_party_name || "-"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">MAJELIS HAKIM:</span>
                <span className="text-slate-700 truncate block">
                  {courtCase.judge_panel_names || "-"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">PANITERA PENGGANTI:</span>
                <span className="text-slate-700">{courtCase.clerk_name || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Sesi & Agenda Persidangan
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Total {courtCase.sessions?.length || 0} Agenda Terdaftar
            </span>
          </div>

          {courtCase.sessions?.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Belum ada jadwal sesi sidang. Silakan klik "Tambah Jadwal Sidang" di atas.
            </div>
          ) : (
            <div className="space-y-4">
              {courtCase.sessions?.map((s: any, idx: number) => {
                const validAudios = (s.audio_evidences || []).filter(
                  (a: any) => a.file_size_bytes > 0
                );
                const hasAudio = validAudios.length > 0;

                return (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            SIDANG #{idx + 1}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(s.session_date).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{s.session_title}</h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Record or Upload Button */}
                        <button
                          onClick={() => setActiveRecorderSession(s)}
                          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5 text-amber-600" />
                          Rekam di Sidang
                        </button>

                        <button
                          onClick={() => setActiveUploadSession(s)}
                          className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                          Unggah Audio / MP4
                        </button>

                        <Link
                          href={`/sessions/${s.id}/report?caseId=${courtCase.id}`}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          <Gavel className="w-3.5 h-3.5 text-emerald-600" />
                          Berita Acara (BAS)
                        </Link>
                      </div>
                    </div>

                    {/* Audio Evidence Status - Multiple Items List */}
                    {hasAudio ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <FileAudio className="w-4 h-4 text-amber-600" />
                            Berkas Rekaman Sidang ({validAudios.length} Rekaman Terdaftar)
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Klik "Transkrip & Editor" pada rekaman yang ingin ditelaah
                          </span>
                        </div>

                        <div className="space-y-2">
                          {validAudios.map((audio: any, aIdx: number) => {
                            const isMp4 =
                              audio.original_filename?.toLowerCase().endsWith(".mp4") ||
                              audio.source_type === "extracted_mp4";

                            return (
                              <div
                                key={audio.id}
                                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-slate-300 transition"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs flex-wrap">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="font-bold text-slate-900">
                                      #{aIdx + 1}: {audio.original_filename || `Rekaman Audio #${aIdx + 1}`}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                      {audio.source_type || (isMp4 ? "MP4 Audio" : "Audio")}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-600 font-medium">
                                      {(audio.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                    {audio.duration_seconds > 0 && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-600 font-mono">
                                          {Math.floor(audio.duration_seconds / 60)}:
                                          {(audio.duration_seconds % 60).toString().padStart(2, "0")}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                    <Hash className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span className="truncate max-w-md">
                                      SHA-256: {audio.sha256_hash}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Link
                                    href={`/sessions/${s.id}/transcript?audioId=${audio.id}`}
                                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Transkrip & Editor
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                        Belum ada rekaman audio untuk sesi sidang ini. Klik <strong>"Unggah Audio / MP4"</strong> atau <strong>"Rekam di Sidang"</strong> di atas.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Tambah Jadwal Sesi Sidang</h3>
              <button
                onClick={() => setShowAddSessionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agenda Persidangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembuktian Saksi Ahli Pidana"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Sidang *
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Web Audio Recorder Modal */}
      {activeRecorderSession && (
        <WebRecorderModal
          courtSessionId={activeRecorderSession.id}
          sessionTitle={activeRecorderSession.session_title}
          onClose={() => setActiveRecorderSession(null)}
          onFinished={() => {
            fetchCaseDetails();
          }}
        />
      )}

      {/* Media Upload Modal */}
      {activeUploadSession && (
        <MediaUploadModal
          courtSessionId={activeUploadSession.id}
          sessionTitle={activeUploadSession.session_title}
          onClose={() => setActiveUploadSession(null)}
          onFinished={() => {
            setActiveUploadSession(null);
            fetchCaseDetails();
          }}
        />
      )}
    </div>
  );
}
