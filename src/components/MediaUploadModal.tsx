"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { UploadCloud, CheckCircle2, AlertCircle, FileVideo, FileAudio, Shield, Files, Check } from "lucide-react";

interface MediaUploadModalProps {
  courtSessionId: string;
  sessionTitle: string;
  onClose: () => void;
  onFinished: (evidences: any[]) => void;
}

export default function MediaUploadModal({
  courtSessionId,
  sessionTitle,
  onClose,
  onFinished,
}: MediaUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedResults, setUploadedResults] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setErrorMsg("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setErrorMsg("");
    const results: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentUploadIndex(i + 1);
        const f = files[i];

        const formData = new FormData();
        formData.append("court_session_id", courtSessionId);
        formData.append("media_file", f);

        const res = await api.uploadMediaFile(formData);
        results.push(res.data);
      }

      setUploadedResults(results);
      onFinished(results);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunggah beberapa berkas media");
      if (results.length > 0) {
        setUploadedResults(results);
        onFinished(results);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Unggah Berkas Rekaman Sidang</h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px]">{sessionTitle}</p>
            </div>
          </div>
          {!uploading && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              ✕
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {uploadedResults.length > 0 ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {uploadedResults.length} Berkas Berhasil Diunggah!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Audio persidangan telah terdaftar, terenkripsi AES-256, dan siap untuk ditranskripsi.
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {uploadedResults.map((result, idx) => (
                <div
                  key={result.id || idx}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1"
                >
                  <div className="flex justify-between items-center font-semibold text-slate-900">
                    <span className="truncate max-w-[220px]">{result.original_filename}</span>
                    <span className="text-slate-500 text-[11px]">
                      {(result.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    SHA-256: {result.sha256_hash}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition text-sm cursor-pointer shadow-xs"
            >
              Lihat Daftar Rekaman Sidang
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-6 text-center bg-slate-50 relative cursor-pointer">
              <input
                type="file"
                multiple
                required
                accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {files.length > 0 ? (
                <div className="flex flex-col items-center gap-2 text-slate-900">
                  <Files className="w-10 h-10 text-sky-600" />
                  <div className="text-xs font-semibold">
                    {files.length} Berkas Dipilih:
                  </div>
                  <div className="text-[11px] text-slate-600 max-h-24 overflow-y-auto w-full px-4 text-left space-y-0.5">
                    {files.map((f, i) => (
                      <div key={i} className="truncate">
                        • {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <UploadCloud className="w-10 h-10 text-slate-400" />
                  <div className="text-xs font-semibold text-slate-800">
                    Pilih Satu atau Beberapa Berkas Audio / Video (.MP4, .M4A, .MP3)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bisa pilih multiple file sekaligus (Maksimal 500 MB per berkas)
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                <strong>Multi-Rekaman Otomatis:</strong> Setiap sesi sidang dapat memuat lebih dari satu rekaman (misal: Rekaman Saksi #1, Rekaman Terdakwa, dll). Semua berkas tersimpan aman dan terdaftar di sesi terkait.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {uploading
                  ? `Mengunggah ${currentUploadIndex} dari ${files.length}...`
                  : files.length > 1
                  ? `Unggah ${files.length} Berkas Sekaligus`
                  : "Mulai Unggah Rekaman"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
