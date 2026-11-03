"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api, getStoredUser } from "@/lib/api";
import { exportReportToWord } from "@/lib/exportDocx";
import {
  Gavel,
  PenTool,
  Printer,
  CheckCircle2,
  ChevronLeft,
  Hash,
  ShieldCheck,
  QrCode,
  Save,
  RotateCcw,
  Download,
  Sparkles,
} from "lucide-react";

export default function CourtReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");
  const router = useRouter();

  const [courtCase, setCourtCase] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [signature, setSignature] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable report fields
  const [reportTitle, setReportTitle] = useState("Berita Acara Sidang (Pemeriksaan Keterangan Terdakwa)");
  const [caseSummary, setCaseSummary] = useState(
    "Pada hari ini telah diselenggarakan persidangan perkara pidana dengan agenda Pemeriksaan Keterangan Terdakwa atas nama Alim terkait dugaan tindak pidana pencurian 1 (satu) unit sepeda motor Yamaha X-Ride di Desa Momuo, Boalemo, Gorontalo. Terdakwa mengakui perbuatannya melarikan motor ke daerah Dumoga dan Lolak (Bolaang Mongondow), menggadaikan motor seharga Rp 1.000.000,- untuk ongkos perjalanan kapal ke Pelabuhan Semut Ternate, Maluku Utara, hingga akhirnya diamankan dan dibawa kembali oleh petugas Kepolisian."
  );
  const [objectionsNotes, setObjectionsNotes] = useState(
    "1. Penasihat Hukum mengonfirmasi perkara uang keluarga telah diselesaikan dan pihak keluarga telah memaafkan.\n2. Terdakwa mengambil motor secara spontan tanpa perencanaan awal saat panik dalam pelarian melihat kunci tergantung.\n3. Penasihat Hukum memohon kepada Majelis Hakim agar sikap kooperatif Terdakwa, pengakuan terus terang, dan penyesalan mendalam dicatat dalam Berita Acara sebagai pertimbangan hal-hal yang meringankan."
  );

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerIdentifier, setSignerIdentifier] = useState("");
  const [signerRole, setSignerRole] = useState("Penasihat Hukum / Advokat");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (u) {
      setSignerName(u.full_name || "");
      setSignerIdentifier(u.bar_number || "");
    }
    loadData();
  }, [resolvedParams.sessionId, caseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (caseId) {
        const caseRes = await api.getCase(caseId);
        setCourtCase(caseRes.data);
        const currentSess = caseRes.data.sessions?.find(
          (s: any) => s.id === resolvedParams.sessionId
        );
        setSession(currentSess);

        let existingReport: any = null;
        // Check if report already exists for this session
        if (currentSess?.reports && currentSess.reports.length > 0) {
          existingReport = currentSess.reports[0];
          setReport(existingReport);
          setReportTitle(existingReport.report_title);
          if (existingReport.case_summary) setCaseSummary(existingReport.case_summary);
          if (existingReport.objections_notes) setObjectionsNotes(existingReport.objections_notes);
          if (existingReport.signatures && existingReport.signatures.length > 0) {
            setSignature(existingReport.signatures[0]);
          }
        } else {
          // Create draft report
          const newRep = await api.createReport(
            resolvedParams.sessionId,
            "Berita Acara Jalannya Persidangan"
          );
          existingReport = newRep.data;
          setReport(existingReport);
        }

        // Auto-populate from AI Transcript if available to eliminate manual typing!
        const audio = currentSess?.audio_evidences?.[0];
        if (audio) {
          try {
            const tRes = await api.getTranscript(audio.id);
            const segs = tRes.data?.segments || [];
            if (segs.length > 0) {
              const lines = segs
                .map((s: any) => `[${s.speaker_tag}]:\n"${s.text_content}"`)
                .join("\n\n");
              const objLines = segs
                .filter(
                  (s: any) =>
                    s.speaker_tag === "Penasihat Hukum" &&
                    (s.text_content.toLowerCase().includes("keberatan") ||
                      s.text_content.toLowerCase().includes("bukti") ||
                      s.text_content.toLowerCase().includes("eksepsi"))
                )
                .map((s: any) => s.text_content)
                .join("\n\n");

              if (
                !existingReport?.case_summary ||
                existingReport.case_summary.startsWith("Pada hari ini telah diselenggarakan")
              ) {
                setCaseSummary(
                  `Berdasarkan rekaman suara persidangan yang ditranskrip secara otomatis (Voice-to-Report AI), jalannya pemeriksaan dan keterangan para pihak serta saksi tercatat sebagai berikut:\n\n${lines}`
                );
              }

              if (
                objLines &&
                (!existingReport?.objections_notes ||
                  existingReport.objections_notes.startsWith("Pihak Penasihat Hukum mengajukan keberatan"))
              ) {
                setObjectionsNotes(objLines);
              }
            }
          } catch (e) {
            console.warn("Auto-populate transcript into report:", e);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = () => {
    exportReportToWord({
      reportTitle: reportTitle,
      documentNumber: report?.document_number || "BAS/51.Pid.B/2026/PN.Tlm",
      caseNumber: courtCase?.case_number || "51/Pid.B/2026/PN.Tlm",
      courtName: courtCase?.court_name || "Pengadilan Negeri Tilamuta (Kabupaten Boalemo)",
      caseCategory: courtCase?.case_category || "Pencurian Kendaraan Bermotor (Pasal 362 KUHP)",
      sessionTitle: session?.session_title || "Pemeriksaan Keterangan Terdakwa (Pencurian Sepeda Motor Yamaha X-Ride)",
      sessionDate: session
        ? new Date(session.session_date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "-",
      clientName: courtCase?.client_name || "Alim (Terdakwa)",
      counterPartyName: courtCase?.counter_party_name || "Jaksa Penuntut Umum Kejari Boalemo",
      judgePanelNames:
        courtCase?.judge_panel_names || "Dr. Wahyu Iman S.H., M.H. (Ketua), Siti Rahma S.H., Hendra S.H.",
      caseSummary: caseSummary,
      objectionsNotes: objectionsNotes,
      sourceAudioSha256: audioEvidence ? audioEvidence.sha256_hash : "-",
      documentSha256: signature?.document_sha256 || "-",
      verificationToken: signature?.verification_token || "-",
      signerName: signerName,
      signerRole: signerRole,
      signerIdentifier: signerIdentifier,
      signedAtFormatted: signature?.signed_at
        ? new Date(signature.signed_at).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
      signatureImageBase64: signature?.signature_image_path || undefined,
    });
  };

  // Canvas drawing functions with black ink
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a"; // dark ink for light paper

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignDocument = async () => {
    if (!report) return;
    if (!hasDrawn && !signature) {
      alert("Silakan bubuhkan goresan tanda tangan Anda pada canvas.");
      return;
    }

    setSigning(true);
    try {
      let sigData = "";
      if (canvasRef.current) {
        sigData = canvasRef.current.toDataURL("image/png");
      }

      // First update report content
      await api.updateReport(report.id, {
        report_title: reportTitle,
        case_summary: caseSummary,
        objections_notes: objectionsNotes,
      });

      // Sign report
      const res = await api.signReport(report.id, {
        signer_name: signerName,
        signer_identifier: signerIdentifier,
        signer_role: signerRole,
        signature_image_data: sigData,
      });

      setSignature(res.data);
      alert("Berita Acara Sidang berhasil ditandatangani dan disegel secara kriptografis!");
    } catch (err: any) {
      alert(err.message || "Gagal menandatangani dokumen");
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const audioEvidence = session?.audio_evidences?.[0];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Action Bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Perkara
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportWord}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
              title="Unduh Berita Acara Sidang Resmi Format Microsoft Word (.doc)"
            >
              <Download className="w-4 h-4" />
              Export Word (.doc)
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* Legal Document Container (A4 Printable Layout) */}
        <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-md border border-slate-300/80 print:border-none print:shadow-none print:p-0 space-y-8 font-serif">
          {/* KOP / Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-lg font-bold tracking-wider uppercase font-sans">
              KANTOR ADVOKAT & KONSULTAN HUKUM
            </h2>
            <div className="text-xs text-slate-600 font-sans">
              Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan • Telp: (021) 555-0199 • Email: info@hukum.id
            </div>
            <div className="text-[10px] text-slate-500 font-sans tracking-widest pt-1 uppercase">
              Berita Acara Resmi Persidangan (Non-PSrE UU ITE Standard)
            </div>
          </div>

          {/* Title & Document Number */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold uppercase underline tracking-wide text-slate-950">
              {reportTitle}
            </h1>
            <div className="text-xs font-mono text-slate-600 font-sans">
              Nomor: {report?.document_number || "BAS/20261103/001"}
            </div>
          </div>

          {/* Case Identity Table */}
          <div className="space-y-2 text-xs">
            <div className="font-bold uppercase tracking-wider font-sans text-slate-900">
              I. IDENTITAS PERKARA & JADWAL SIDANG
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs font-sans">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/3 p-2 bg-slate-50 font-semibold text-slate-700">Nomor Register Perkara</td>
                  <td className="p-2 font-mono font-bold text-slate-950">
                    {courtCase?.case_number}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Pengadilan</td>
                  <td className="p-2">{courtCase?.court_name}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Klasifikasi Perkara</td>
                  <td className="p-2">{courtCase?.case_category}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Agenda Persidangan</td>
                  <td className="p-2 font-semibold text-slate-900">{session?.session_title}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Hari & Tanggal Sidang</td>
                  <td className="p-2">
                    {session
                      ? new Date(session.session_date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Klien / Terdakwa / Penggugat</td>
                  <td className="p-2 font-semibold text-slate-900">{courtCase?.client_name}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Pihak Lawan / Penuntut Umum</td>
                  <td className="p-2">{courtCase?.counter_party_name || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-50 font-semibold text-slate-700">Susunan Majelis Hakim</td>
                  <td className="p-2">{courtCase?.judge_panel_names || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section II: Summary of Trial */}
          <div className="space-y-2 text-xs">
            <div className="font-bold uppercase tracking-wider font-sans text-slate-900">
              II. RANGKUMAN JALANNYA PERSIDANGAN & KETERANGAN SAKSI
            </div>
            <textarea
              rows={5}
              value={caseSummary}
              onChange={(e) => setCaseSummary(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 text-xs leading-relaxed focus:outline-none focus:border-amber-500 font-serif print:border-none print:p-0"
            />
          </div>

          {/* Section III: Special Objections */}
          <div className="space-y-2 text-xs">
            <div className="font-bold uppercase tracking-wider font-sans text-slate-900">
              III. CATATAN KHUSUS & KEBERATAN PENASIHAT HUKUM
            </div>
            <textarea
              rows={3}
              value={objectionsNotes}
              onChange={(e) => setObjectionsNotes(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 text-xs leading-relaxed focus:outline-none focus:border-amber-500 font-serif print:border-none print:p-0"
            />
          </div>

          {/* Section IV: Cryptographic Forensic Manifest */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 text-xs font-sans">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              IV. MANIFEST INTEGRITAS FORENSIK DIGITAL (UU ITE & PP 71/2019)
            </div>
            <div className="space-y-1 text-[11px] text-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-semibold text-slate-800 w-48">SHA-256 Rekaman Master:</span>
                <span className="font-mono text-slate-950 break-all">
                  {audioEvidence ? audioEvidence.sha256_hash : "Menunggu penguncian audio"}
                </span>
              </div>
              {signature && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-semibold text-slate-800 w-48">SHA-256 Dokumen BAS:</span>
                    <span className="font-mono text-slate-950 break-all">
                      {signature.document_sha256}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-semibold text-slate-800 w-48">Kode Validasi Publik:</span>
                    <span className="font-mono text-amber-700 font-bold">
                      {signature.verification_token}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section V: Signature Block */}
          <div className="pt-6 grid grid-cols-2 gap-8 items-end font-sans">
            <div className="text-xs text-slate-600 space-y-1">
              <div>Dokumen Berita Acara ini dicatat dan disusun secara sah.</div>
              {signature && (
                <div className="flex items-center gap-2 pt-2">
                  <div className="p-2 border border-slate-300 rounded-lg bg-white">
                    <QrCode className="w-12 h-12 text-slate-900" />
                  </div>
                  <div className="text-[10px] text-slate-600">
                    <div className="font-bold text-slate-900">Scan QR untuk Verifikasi Keaslian</div>
                    <div>app.domainsidang.id/verify/{signature.verification_token}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <div className="text-xs text-slate-700">
                Jakarta,{" "}
                {new Date().toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-xs font-bold text-slate-900 uppercase">
                {signerRole || "Penasihat Hukum"}
              </div>

              {/* Signature Display or Canvas */}
              <div className="h-28 flex items-center justify-center">
                {signature?.signature_image_path ? (
                  <img
                    src={signature.signature_image_path}
                    alt="Tanda Tangan Digital"
                    className="max-h-24 max-w-full object-contain"
                  />
                ) : (
                  <div className="border border-dashed border-slate-400 rounded-lg p-1 w-64 h-24 relative bg-slate-50 print:hidden">
                    <canvas
                      ref={canvasRef}
                      width={240}
                      height={90}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="cursor-crosshair w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      title="Bersihkan tanda tangan"
                      className="absolute top-1 right-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-300"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs font-bold text-slate-900 underline">{signerName}</div>
              <div className="text-[11px] text-slate-600 font-mono">
                {signerIdentifier ? `NIA/NIK: ${signerIdentifier}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Sign Button (Hidden when printing or already signed) */}
        {!signature && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden shadow-sm">
            <div className="text-xs text-slate-600">
              Goreskan tanda tangan Anda pada kotak tanda tangan di atas, lalu klik "Kunci & Tanda Tangani Dokumen".
            </div>

            <button
              onClick={handleSignDocument}
              disabled={signing}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {signing ? "Menyegel Kriptografis..." : "Kunci & Tanda Tangani Dokumen (UU ITE)"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
