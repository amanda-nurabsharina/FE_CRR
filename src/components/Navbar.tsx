"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getStoredUser, removeAuthToken } from "@/lib/api";
import { Scale, Clock, HardDrive, CreditCard, LogOut, CheckCircle2, UserCog, User } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [amount, setAmount] = useState("250000");
  const [bankSender, setBankSender] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u && u.role === "TENANT_OWNER") {
      fetchQuota();
    }
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await api.getCurrentSubscription();
      if (res.data) setQuota(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push("/");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      alert("Silakan unggah foto bukti transfer.");
      return;
    }
    setPayLoading(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("bank_destination", "BCA 123-456-7890 (PT Rekam Sidang Mandiri)");
      formData.append("bank_sender_name", bankSender);
      formData.append("transfer_date", transferDate);
      formData.append("proof_image", proofFile);

      await api.submitManualPayment(formData);
      setPaySuccess(true);
      setTimeout(() => {
        setPaySuccess(false);
        setShowPayModal(false);
      }, 2500);
    } catch (err: any) {
      alert(err.message || "Gagal mengajukan pembayaran");
    } finally {
      setPayLoading(false);
    }
  };

  if (!user) return null;

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <>
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2 rounded-xl text-white font-bold shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <Link href={isSuperAdmin ? "/admin" : "/dashboard"} className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  CourtRecord{" "}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                    v3.0
                  </span>
                </span>
                <span className="text-xs text-slate-500">Sistem Berita Acara & Rekaman Sidang</span>
              </Link>
            </div>

            {/* Middle: Quota Tracker (Tenant Only) */}
            {!isSuperAdmin && quota && (
              <div className="hidden md:flex items-center space-x-5 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 text-xs">
                {/* ASR Minutes */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-slate-600">
                    Transkripsi:{" "}
                    <strong className="text-slate-900">
                      {Math.max(
                        0,
                        Math.floor(
                          (quota.subscription.max_transcription_seconds -
                            quota.subscription.used_transcription_seconds) /
                            60
                        )
                      )}
                    </strong>{" "}
                    / {Math.floor(quota.subscription.max_transcription_seconds / 60)} mnt
                  </span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, quota.asr_used_percent)}%` }}
                    />
                  </div>
                </div>

                {/* Storage */}
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-600">
                    Storage:{" "}
                    <strong className="text-slate-900">
                      {(quota.subscription.used_storage_bytes / (1024 * 1024 * 1024)).toFixed(1)}
                    </strong>{" "}
                    / {(quota.subscription.max_storage_bytes / (1024 * 1024 * 1024)).toFixed(0)} GB
                  </span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, quota.storage_used_percent)}%` }}
                    />
                  </div>
                </div>

                {/* Upgrade Button */}
                <button
                  onClick={() => setShowPayModal(true)}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2.5 py-1 rounded-full text-xs shadow-xs transition cursor-pointer"
                >
                  <CreditCard className="w-3 h-3" />
                  Perpanjang / Kuota
                </button>
              </div>
            )}

            {/* Right: User Profile & Nav Links */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowProfileModal(true)}
                title="Klik untuk Edit Profil & Identitas Kantor Hukum"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition text-right group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-200 transition">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 flex items-center gap-1">
                    {user.full_name}
                    {isSuperAdmin && (
                      <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-1 py-0.2 rounded font-mono font-bold">
                        ADMIN
                      </span>
                    )}
                    <UserCog className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition ml-0.5" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {user.tenant?.name || user.email}
                  </div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdated={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
      )}

      {/* Manual Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Perpanjangan / Tambah Kuota</h3>
                <p className="text-xs text-slate-500">Pembayaran Transfer Bank Manual (Verifikasi Super Admin)</p>
              </div>
            </div>

            {paySuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center text-emerald-700">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
                <h4 className="font-bold text-base">Bukti Transfer Berhasil Dikirim!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Super Admin akan segera memverifikasi mutasi bank dan mengaktifkan kuota tambahan Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500">Rekening Tujuan Transfer:</div>
                  <div className="font-bold text-slate-900 text-sm">BCA 123-456-7890</div>
                  <div className="text-slate-600">a.n. PT Rekam Sidang Mandiri (Kantor Pusat Jakarta)</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilihan Paket Langganan</label>
                  <select
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="250000">Pro Advocate (Rp 250.000) — +300 Mnt Transkrip, +20 GB</option>
                    <option value="500000">Enterprise Solo (Rp 500.000) — +800 Mnt Transkrip, +60 GB</option>
                    <option value="150000">Booster Audio (Rp 150.000) — +200 Mnt Transkrip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pemilik Rekening Pengirim</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={bankSender}
                    onChange={(e) => setBankSender(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transfer</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unggah Struk / Bukti Transfer</label>
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={payLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition shadow-sm text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {payLoading ? "Mengunggah Bukti..." : "Kirim Bukti Pembayaran"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
