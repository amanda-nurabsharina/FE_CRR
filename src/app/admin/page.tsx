"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api, getStoredUser } from "@/lib/api";
import {
  Shield,
  Users,
  HardDrive,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Check,
  X,
  AlertCircle,
  Activity,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal inspection
  const [inspectPayment, setInspectPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Quota Adjust Modal
  const [quotaTargetTenant, setQuotaTargetTenant] = useState<any | null>(null);
  const [addMinutes, setAddMinutes] = useState(120);
  const [addStorageGB, setAddStorageGB] = useState(10);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "SUPER_ADMIN") {
      router.push("/");
      return;
    }
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, tRes, pRes] = await Promise.all([
        api.getAdminMetrics(),
        api.listTenants(),
        api.listPendingPayments(),
      ]);
      setMetrics(mRes.data);
      setTenants(tRes.data || []);
      setPendingPayments(pRes.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (id: string) => {
    if (!confirm("Setujui pembayaran ini dan aktifkan paket langganan tenant?")) return;
    try {
      await api.approvePayment(id);
      alert("Pembayaran disetujui. Kuota dan masa aktif tenant telah diperbarui!");
      setInspectPayment(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Gagal menyetujui pembayaran");
    }
  };

  const handleRejectPayment = async () => {
    if (!inspectPayment) return;
    try {
      await api.rejectPayment(inspectPayment.id, rejectReason || "Bukti transfer tidak valid/mutasi tidak ditemukan");
      alert("Pembayaran berhasil ditolak.");
      setShowRejectModal(false);
      setInspectPayment(null);
      setRejectReason("");
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Gagal menolak pembayaran");
    }
  };

  const handleToggleTenantStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await api.updateTenantStatus(id, newStatus);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status tenant");
    }
  };

  const handleAdjustQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaTargetTenant) return;
    setAdjusting(true);
    try {
      await api.adjustQuota(quotaTargetTenant.id, addMinutes, addStorageGB);
      alert("Kuota berhasil disuntikkan ke tenant!");
      setQuotaTargetTenant(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Gagal menyesuaikan kuota");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
              <Shield className="w-4 h-4" />
              <span>Platform Operator & Subscription Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Page Admin: Manajemen Tenant & Approval Pembayaran
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Verifikasi transfer bank manual, kontrol kuota ASR/storage, dan pemantauan tenant.
            </p>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-mono">
            Zero-Access: Audio rekaman perkara tetap 100% terisolasi dari admin.
          </div>
        </div>

        {/* Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{metrics.total_tenants}</div>
                <div className="text-xs text-slate-500">Total Ruang Kerja Tenant</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{metrics.pending_payments}</div>
                <div className="text-xs text-red-600 font-semibold">Menunggu Verifikasi Bank</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 border border-sky-200 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {metrics.total_asr_minutes_used} mnt
                </div>
                <div className="text-xs text-slate-500">Total Durasi ASR Dipakai</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {metrics.total_storage_used_gb.toFixed(2)} GB
                </div>
                <div className="text-xs text-slate-500">Storage Master Audio</div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Manual Payments Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Antrean Verifikasi Bukti Transfer Manual
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {pendingPayments.length} Permintaan
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs shadow-sm">
              Tidak ada bukti transfer yang menunggu verifikasi saat ini.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-4">Invoice / Tenant</th>
                      <th className="p-4">Nominal</th>
                      <th className="p-4">Bank Pengirim</th>
                      <th className="p-4">Tanggal Transfer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pendingPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          <div className="font-mono font-bold text-slate-900">{p.invoice_number}</div>
                          <div className="text-slate-600 font-medium">{p.tenant?.name || "-"}</div>
                        </td>
                        <td className="p-4 font-semibold text-emerald-700 text-sm">
                          Rp {p.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-slate-700">
                          <div>{p.bank_sender_name}</div>
                          <div className="text-[11px] text-slate-500">{p.bank_destination}</div>
                        </td>
                        <td className="p-4 text-slate-600">{p.transfer_date}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            PENDING REVIEW
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setInspectPayment(p)}
                            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-2xs"
                          >
                            Periksa Resi
                          </button>
                          <button
                            onClick={() => handleApprovePayment(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs"
                          >
                            Approve & Aktifkan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Tenants Management Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Daftar Tenant Advokat & Ruang Kerja
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-4">Nama Kantor / Advokat</th>
                    <th className="p-4">Email & WhatsApp</th>
                    <th className="p-4">Masa Aktif Paket</th>
                    <th className="p-4">Penggunaan Kuota</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tenants.map((t) => {
                    const sub = t.subscription;
                    const isActive = t.status === "active";

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">ID: {t.id.slice(0, 8)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800">{t.owner_email}</div>
                          <div className="text-[11px] text-slate-500">{t.phone_number}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 capitalize">
                            {sub?.tier_name || "Free Trial"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            s/d {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString("id-ID") : "-"}
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="text-[11px] text-slate-700">
                            ASR: {sub ? Math.floor(sub.used_transcription_seconds / 60) : 0} /{" "}
                            {sub ? Math.floor(sub.max_transcription_seconds / 60) : 0} mnt
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Storage: {sub ? (sub.used_storage_bytes / (1024 * 1024 * 1024)).toFixed(1) : 0} /{" "}
                            {sub ? (sub.max_storage_bytes / (1024 * 1024 * 1024)).toFixed(0) : 0} GB
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setQuotaTargetTenant(t)}
                            title="Suntik / Sesuaikan Kuota"
                            className="bg-white hover:bg-slate-50 border border-slate-300 text-amber-700 font-medium px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5 inline mr-1" />
                            Kuota
                          </button>
                          <button
                            onClick={() => handleToggleTenantStatus(t.id, t.status)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isActive
                                ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {isActive ? "Suspend" : "Aktifkan"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Inspect Payment Modal */}
      {inspectPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                Verifikasi Pembayaran: {inspectPayment.invoice_number}
              </h3>
              <button
                onClick={() => setInspectPayment(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant:</span>
                <span className="font-semibold text-slate-900">{inspectPayment.tenant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Transfer:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  Rp {inspectPayment.amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pengirim (Rekening):</span>
                <span className="text-slate-800">{inspectPayment.bank_sender_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Transfer:</span>
                <span className="text-slate-800">{inspectPayment.transfer_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan:</span>
                <span className="text-slate-800">{inspectPayment.bank_destination}</span>
              </div>
            </div>

            {/* Proof image display */}
            <div>
              <span className="text-xs text-slate-600 block mb-1">Foto Bukti Transfer:</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center h-48 text-center overflow-hidden">
                <div className="text-xs text-slate-500 font-mono">
                  [File Path: {inspectPayment.proof_image_storage_path}]
                  <div className="mt-2 text-slate-700 font-sans">
                    Struk / Resi Transfer Terverifikasi di Private Storage
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Tolak Pembayaran
              </button>
              <button
                onClick={() => handleApprovePayment(inspectPayment.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                Approve & Aktifkan Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Alasan Penolakan Pembayaran</h3>
            <textarea
              rows={3}
              placeholder="Contoh: Nominal transfer tidak sesuai dengan invoice atau mutasi belum masuk..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRejectPayment}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Adjust Modal */}
      {quotaTargetTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                Suntik Kuota: {quotaTargetTenant.name}
              </h3>
              <button
                onClick={() => setQuotaTargetTenant(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustQuota} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tambah Kuota Menit Transkripsi (ASR)
                </label>
                <input
                  type="number"
                  required
                  value={addMinutes}
                  onChange={(e) => setAddMinutes(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tambah Kuota Storage Master (GB)
                </label>
                <input
                  type="number"
                  required
                  value={addStorageGB}
                  onChange={(e) => setAddStorageGB(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setQuotaTargetTenant(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  {adjusting ? "Menyuntikkan..." : "Terapkan Tambahan Kuota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
