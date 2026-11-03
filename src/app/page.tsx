"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken, setStoredUser } from "@/lib/api";
import { Scale, Shield, CheckCircle2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("advokat.budi@hukum.id");
  const [password, setPassword] = useState("admin12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Register Fields
  const [fullName, setFullName] = useState("");
  const [lawFirmName, setLawFirmName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [barNumber, setBarNumber] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.login({ email, password });
      setAuthToken(res.data.token);
      setStoredUser(res.data.user);

      if (res.data.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk ke sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.register({
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber,
        law_firm_name: lawFirmName,
        bar_number: barNumber,
      });

      setAuthToken(res.data.token);
      setStoredUser(res.data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal mendaftarkan akun");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role: "lawyer" | "admin") => {
    if (role === "lawyer") {
      setEmail("advokat.budi@hukum.id");
      setPassword("admin12345");
    } else {
      setEmail("admin@court-record.id");
      setPassword("admin12345");
    }
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        {/* Left: Branding & Value Proposition */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            Zero-Leak Juridical Audio Platform
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Court Recording & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-700">
                Berita Acara Sidang
              </span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Platform perekaman sidang offline-first, transkripsi otomatis multi-pembicara, dan penyusunan Berita Acara Sidang (BAS) berstempel kriptografis SHA-256 untuk praktisi hukum mandiri di Indonesia.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Offline-Resilient Recording:</strong> Tetap rekam di ruang sidang tanpa sinyal via IndexedDB.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Ekstraksi MP4 Aman:</strong> Unggah rekaman video, audio diekstrak dan video segera dihapus permanen.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Tanda Tangan Forensik (UU ITE):</strong> Mengikat tanda tangan visual dengan SHA-256 master audio.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Data Residency 100% Indonesia:</strong> Data center lokal patuh UU Perlindungan Data Pribadi (UU PDP).</span>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2">Pilih Cepat Akun Demo (Pre-seeded DB):</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => quickFill("lawyer")}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-amber-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                Advokat Mandiri (Budi, S.H.)
              </button>
              <button
                type="button"
                onClick={() => quickFill("admin")}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-red-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-red-600" />
                Super Admin Console
              </button>
            </div>
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {isRegister ? "Registrasi Kantor Hukum" : "Masuk ke Ruang Kerja"}
            </h2>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-xs text-amber-600 font-semibold hover:underline cursor-pointer"
            >
              {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.H., M.H."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kantor Hukum / Praktik</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso & Partners"
                  value={lawFirmName}
                  onChange={(e) => setLawFirmName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Induk Advokat (NIA / Peradi)</label>
                <input
                  type="text"
                  placeholder="Contoh: PERADI/2020/09871 (Opsional)"
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@hukum.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="08123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? "Mendaftarkan..." : "Daftar & Mulai Trial 30 Hari"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? "Memverifikasi..." : "Masuk ke Portal"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Terproteksi isolasi data multi-tenant kedap & enkripsi AES-256
          </div>
        </div>
      </div>
    </div>
  );
}
