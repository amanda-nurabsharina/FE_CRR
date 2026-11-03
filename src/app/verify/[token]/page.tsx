"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Hash,
  Scale,
  Calendar,
  User,
  ArrowLeft,
  FileCheck,
} from "lucide-react";

export default function PublicVerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyToken();
  }, [resolvedParams.token]);

  const verifyToken = async () => {
    setLoading(true);
    try {
      const res = await api.publicVerify(resolvedParams.token);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-12 relative text-slate-900">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6 relative z-10">
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">CourtRecord Verification Ledger</div>
              <div className="text-[11px] text-slate-500">Portal Validasi Keaslian Berita Acara Sidang</div>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200">
            UU ITE COMPLIANT
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Memverifikasi tanda tangan digital...</div>
        ) : !data || !data.is_valid ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Tanda Tangan Tidak Ditemukan / Tidak Valid</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Kode verifikasi token tidak terdaftar pada ledger kriptografis atau berkas telah mengalami perubahan.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Valid Badge */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Dokumen Terotentikasi & Sah</h2>
              <p className="text-xs text-emerald-700 font-medium">
                Integritas Dokumen & Bukti Audio Terikat Secara Kriptografis
              </p>
            </div>

            {/* Verification Metadata Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" /> Penandatangan Sah:
                </span>
                <span className="font-bold text-slate-900 text-sm">{data.signer_name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">Kapasitas / Peran:</span>
                <span className="font-semibold text-slate-800">{data.signer_role}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" /> Stempel Waktu (WIB):
                </span>
                <span className="font-mono text-slate-800">
                  {new Date(data.signed_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">SHA-256 KONTEN BERITA ACARA SIDANG:</span>
                <span className="font-mono text-slate-900 break-all text-[11px] block bg-white p-2.5 rounded-lg border border-slate-200">
                  {data.document_sha256}
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">SHA-256 MASTER REKAMAN PERSIDANGAN:</span>
                <span className="font-mono text-amber-800 break-all text-[11px] block bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                  {data.source_audio_sha256}
                </span>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold block mb-0.5">Keterangan Yuridis:</strong>
              {data.legal_notice} Dokumen ini membuktikan bahwa Berita Acara Jalannya Sidang tidak mengalami manipulasi sejak saat ditandatangani.
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda CourtRecord
          </Link>
        </div>
      </div>
    </div>
  );
}
