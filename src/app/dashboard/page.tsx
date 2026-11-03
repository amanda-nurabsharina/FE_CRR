"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api, getStoredUser } from "@/lib/api";
import {
  Scale,
  Plus,
  Search,
  FolderLock,
  Calendar,
  FileText,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Gavel,
  Mic,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState<any | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [purging, setPurging] = useState(false);

  // New Case Form
  const [caseNumber, setCaseNumber] = useState("");
  const [courtName, setCourtName] = useState("Pengadilan Negeri Jakarta Selatan");
  const [caseCategory, setCaseCategory] = useState("Pidana Khusus");
  const [clientName, setClientName] = useState("");
  const [counterPartyName, setCounterPartyName] = useState("");
  const [judgePanelNames, setJudgePanelNames] = useState("");
  const [clerkName, setClerkName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.push("/");
      return;
    }
    if (u.role === "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }
    setUser(u);
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.listCases(search);
      setCases(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCase({
        case_number: caseNumber,
        court_name: courtName,
        case_category: caseCategory,
        client_name: clientName,
        counter_party_name: counterPartyName,
        judge_panel_names: judgePanelNames,
        clerk_name: clerkName,
        notes: notes,
      });

      setShowCreateModal(false);
      setCaseNumber("");
      setClientName("");
      setCounterPartyName("");
      fetchCases();
    } catch (err: any) {
      alert(err.message || "Gagal membuat perkara baru");
    }
  };

  const handleManualPurge = async () => {
    if (!purgeTarget) return;
    if (purgeConfirmText !== "HAPUS PERMANEN") {
      alert("Ketik 'HAPUS PERMANEN' untuk mengonfirmasi pemusnahan berkas perkara ini.");
      return;
    }

    setPurging(true);
    try {
      await api.manualPurgeCase(purgeTarget.id);
      alert("Berkas perkara dan seluruh arsip audio berhasil dimusnahkan permanen.");
      setPurgeTarget(null);
      setPurgeConfirmText("");
      fetchCases();
    } catch (err: any) {
      alert(err.message || "Gagal memusnahkan perkara");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Banner & Quick Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <FolderLock className="w-4 h-4 text-amber-600" />
              <span>Ruang Kerja Mandiri & Anti-Leak</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Perkara & Arsip Sidang
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Semua berkas sidang, rekaman master audio, dan Berita Acara terenkripsi dan terikat hash SHA-256.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs text-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Perkara Baru
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total Perkara Terdaftar</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {cases.reduce((acc, c) => acc + (c.sessions?.length || 0), 0)}
              </div>
              <div className="text-xs text-slate-500 font-medium">Jadwal Sesi Sidang</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {cases.reduce(
                  (acc, c) =>
                    acc +
                    (c.sessions?.reduce(
                      (sAcc: number, s: any) => sAcc + (s.reports?.length || 0),
                      0
                    ) || 0),
                  0
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Berita Acara Sidang (BAS)</div>
            </div>
          </div>
        </div>

        {/* Search & Case List */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor perkara, pengadilan, atau nama klien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCases()}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>
            <button
              onClick={fetchCases}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2.5 rounded-xl transition cursor-pointer font-semibold"
            >
              Cari
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Memuat daftar perkara...</div>
          ) : cases.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Belum Ada Perkara Sidang</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Daftarkan perkara pertama Anda untuk memulai perekaman sidang, transkripsi otomatis, dan pembuatan Berita Acara Sidang.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Daftarkan Perkara Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-5 shadow-xs transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {c.case_category || "Pidana"}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(c.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
                        {c.case_number}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">{c.court_name}</div>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <strong className="text-slate-500 font-normal">Klien:</strong>{" "}
                        <span className="font-semibold text-slate-900">{c.client_name}</span>
                      </div>
                      {c.counter_party_name && (
                        <div>
                          <strong className="text-slate-500 font-normal">Lawan / Penuntut:</strong>{" "}
                          <span>{c.counter_party_name}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center gap-2">
                        <Mic className="w-3 h-3 text-sky-600" />
                        <span>{c.sessions?.length || 0} Sesi Sidang</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setPurgeTarget(c)}
                      title="Pemusnahan Berkas Permanen (Manual Purge)"
                      className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Musnahkan
                    </button>

                    <Link
                      href={`/cases/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition"
                    >
                      Buka Berkas Perkara
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-600" />
                Daftarkan Perkara Sidang Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Perkara Persidangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 89/Pid.B/2026/PN JKT.PST"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Klasifikasi Perkara
                  </label>
                  <select
                    value={caseCategory}
                    onChange={(e) => setCaseCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pidana Khusus">Pidana Khusus</option>
                    <option value="Pidana Umum">Pidana Umum</option>
                    <option value="Perdata">Perdata</option>
                    <option value="Tata Usaha Negara (TUN)">Tata Usaha Negara (TUN)</option>
                    <option value="Kepailitan & Niaga">Kepailitan & Niaga</option>
                    <option value="Pengadilan Hubungan Industrial (PHI)">PHI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pengadilan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadilan Negeri Jakarta Selatan"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Klien / Pihak Didampingi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Wijaya (Terdakwa)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pihak Lawan / Penuntut
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: JPU Kejari Jaksel / PT ABC"
                    value={counterPartyName}
                    onChange={(e) => setCounterPartyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Susunan Majelis Hakim
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dr. Wahyu Iman S.H. (Ketua), Bambang S.H., Siti S.H."
                  value={judgePanelNames}
                  onChange={(e) => setJudgePanelNames(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Panitera Pengganti
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dewi Sartika, S.H."
                  value={clerkName}
                  onChange={(e) => setClerkName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pokok Perkara
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan pasal dakwaan atau materi gugatan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  Simpan Perkara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Purge Confirmation Modal */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Pemusnahan Berkas Mandiri</h3>
                <p className="text-xs text-red-600 font-medium">Tindakan ini permanen dan tidak dapat dibatalkan!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan memusnahkan perkara <strong className="text-slate-900">{purgeTarget.case_number}</strong> beserta seluruh rekaman master audio fisik, transkrip, dan Berita Acara Sidang dari server sesuai kebijakan kerahasiaan (*zero-leak cryptographic wipe*).
            </p>

            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-medium">
                Ketik <strong className="text-red-600">HAPUS PERMANEN</strong> di bawah ini:
              </label>
              <input
                type="text"
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
                placeholder="HAPUS PERMANEN"
                className="w-full bg-slate-50 border border-red-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPurgeTarget(null);
                  setPurgeConfirmText("");
                }}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleManualPurge}
                disabled={purging || purgeConfirmText !== "HAPUS PERMANEN"}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                {purging ? "Memusnahkan..." : "Musnahkan Berkas Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
