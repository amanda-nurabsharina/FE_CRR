"use client";

import { useState } from "react";
import { api, setStoredUser } from "@/lib/api";
import { User, Building, Phone, Hash, Lock, CheckCircle2, AlertCircle, X } from "lucide-react";

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdated: (updatedUser: any) => void;
}

export default function EditProfileModal({ user, onClose, onUpdated }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [lawFirmName, setLawFirmName] = useState(user?.tenant?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [barNumber, setBarNumber] = useState(user?.bar_number || "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: any = {
        full_name: fullName,
        phone_number: phoneNumber,
        bar_number: barNumber,
        lawFirm_name: lawFirmName,
      };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await api.updateProfile(payload);
      const updatedUser = res.data;

      // Update local storage
      setStoredUser(updatedUser);
      setSuccessMsg("Profil pengguna berhasil disimpan!");
      onUpdated(updatedUser);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil pengguna");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Profil & Identitas Advokat</h3>
              <p className="text-xs text-slate-500">
                Informasi ini otomatis disematkan pada kop Berita Acara (BAS) dan dokumen persidangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Email (Akun Utama)
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ""}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap & Gelar Advokat *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.H., M.H."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pl-9"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Law Firm Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kantor Hukum / Law Firm
            </label>
            <div className="relative">
              <input
                type="text"
                value={lawFirmName}
                onChange={(e) => setLawFirmName(e.target.value)}
                placeholder="Contoh: Budi Santoso & Partners Legal Office"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pl-9"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bar Number (NIA) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Advokat (NIA) / NIK
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="Contoh: 12.34567/PERADI/2020"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pl-9 font-mono"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pl-9"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Change Password (Optional) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pl-9"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? "Menyimpan Perubahan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

