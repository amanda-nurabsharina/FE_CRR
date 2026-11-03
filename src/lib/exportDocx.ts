export interface DocxExportData {
  caseNumber?: string;
  courtName?: string;
  caseCategory?: string;
  sessionTitle?: string;
  sessionDate?: string;
  clientName?: string;
  counterPartyName?: string;
  judgePanelNames?: string;
  clerkName?: string;
  audioSha256?: string;
  durationFormatted?: string;
  segments: Array<{
    speaker_tag: string;
    start_time_ms: number;
    end_time_ms: number;
    text_content: string;
  }>;
}

export function exportTranscriptToWord(data: DocxExportData) {
  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const rows = data.segments
    .map(
      (s) => `
    <tr style="border-bottom: 1px solid #d1d5db;">
      <td style="width: 14%; padding: 8px 6px; font-family: 'Courier New', monospace; font-size: 10pt; color: #4b5563; vertical-align: top;">
        ${formatMs(s.start_time_ms)} - ${formatMs(s.end_time_ms)}
      </td>
      <td style="width: 22%; padding: 8px 6px; font-family: 'Times New Roman', serif; font-size: 11pt; font-weight: bold; color: #111827; vertical-align: top;">
        ${s.speaker_tag}
      </td>
      <td style="width: 64%; padding: 8px 6px; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #1f2937; text-align: justify; vertical-align: top;">
        ${s.text_content}
      </td>
    </tr>`
    )
    .join("\n");

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Transkrip Persidangan</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.3;
      color: #000;
    }
    .header-kop {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .title-doc {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 16px 0 6px 0;
      text-transform: uppercase;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10.5pt;
    }
    .meta-table td {
      padding: 4px 6px;
      vertical-align: top;
    }
    .meta-label {
      width: 30%;
      font-weight: bold;
    }
    .transcript-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .forensic-box {
      margin-top: 25px;
      padding: 10px;
      border: 1px solid #9ca3af;
      background-color: #f9fafb;
      font-size: 9pt;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="header-kop">
    <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">
      KANTOR ADVOKAT & PENASIHAT HUKUM
    </div>
    <div style="font-size: 9pt; font-family: Arial, sans-serif; color: #4b5563;">
      Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan • Telp: (021) 555-0199 • Email: official@hukum.id
    </div>
  </div>

  <div class="title-doc">TRANSKRIP PERCAKAPAN JALANNYA PERSIDANGAN</div>
  <div style="text-align: center; font-size: 10pt; font-family: Arial, sans-serif; margin-bottom: 16px;">
    (Naskah Catatan Verbatim Hasil Rekaman Suara Persidangan)
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Nomor Perkara</td>
      <td>: <strong>${data.caseNumber || "-"}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Pengadilan</td>
      <td>: ${data.courtName || "-"}</td>
    </tr>
    <tr>
      <td class="meta-label">Agenda Sidang</td>
      <td>: <strong>${data.sessionTitle || "Pemeriksaan Saksi & Pembuktian"}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Hari / Tanggal Sidang</td>
      <td>: ${data.sessionDate || "-"}</td>
    </tr>
    <tr>
      <td class="meta-label">Klien / Terdakwa / Pihak</td>
      <td>: ${data.clientName || "-"}</td>
    </tr>
    <tr>
      <td class="meta-label">Pihak Lawan / JPU</td>
      <td>: ${data.counterPartyName || "-"}</td>
    </tr>
    <tr>
      <td class="meta-label">Susunan Majelis Hakim</td>
      <td>: ${data.judgePanelNames || "-"}</td>
    </tr>
    <tr>
      <td class="meta-label">Total Durasi Rekaman</td>
      <td>: ${data.durationFormatted || "-"}</td>
    </tr>
  </table>

  <hr style="border: 0; border-top: 1px solid #000; margin: 10px 0;" />
  <div style="font-size: 11pt; font-weight: bold; margin: 12px 0 6px 0;">
    DIALOGUE TRANSCRIPT (KUTIPAN PEMBICARAAN):
  </div>

  <table class="transcript-table">
    <thead>
      <tr style="background-color: #f3f4f6; border-bottom: 2px solid #374151;">
        <th style="padding: 6px; text-align: left; font-size: 10pt; font-family: Arial, sans-serif;">WAKTU</th>
        <th style="padding: 6px; text-align: left; font-size: 10pt; font-family: Arial, sans-serif;">PEMBICARA</th>
        <th style="padding: 6px; text-align: left; font-size: 10pt; font-family: Arial, sans-serif;">ISI PERNYATAAN PERSIDANGAN</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="forensic-box">
    <strong>INTEGRITAS ARSIP & FORENSIK DIGITAL (UU ITE & PP No. 71/2019):</strong><br/>
    Master Audio SHA-256 Checksum: <span style="font-family: 'Courier New', monospace;">${data.audioSha256 || "-"}</span><br/>
    Naskah ini diekstrak secara otomatis dari master rekaman persidangan terverifikasi bebas manipulasi.
  </div>

  <table style="width: 100%; margin-top: 40px; font-size: 11pt;">
    <tr>
      <td style="width: 50%;"></td>
      <td style="width: 50%; text-align: center;">
        Jakarta, ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}<br/>
        <strong>Tim Notulis & Penasihat Hukum</strong><br/><br/><br/><br/>
        ( .............................................................. )
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanNum = (data.caseNumber || "Sidang").replace(/[^a-zA-Z0-9]/g, "_");
  a.href = url;
  a.download = `Transkrip_Sidang_${cleanNum}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ReportDocxData {
  reportTitle: string;
  documentNumber: string;
  caseNumber: string;
  courtName: string;
  caseCategory: string;
  sessionTitle: string;
  sessionDate: string;
  clientName: string;
  counterPartyName: string;
  judgePanelNames: string;
  caseSummary: string;
  objectionsNotes: string;
  sourceAudioSha256: string;
  documentSha256: string;
  verificationToken: string;
  signerName: string;
  signerRole: string;
  signerIdentifier: string;
  signedAtFormatted: string;
  signatureImageBase64?: string;
}

export function exportReportToWord(data: ReportDocxData) {
  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${data.reportTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000;
    }
    .header-kop {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin-bottom: 16px;
    }
    .title-doc {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      margin-top: 14px;
    }
    .num-doc {
      text-align: center;
      font-size: 10pt;
      font-family: Arial, sans-serif;
      margin-bottom: 16px;
    }
    .section-title {
      font-weight: bold;
      font-size: 11pt;
      text-transform: uppercase;
      margin-top: 16px;
      margin-bottom: 6px;
      font-family: Arial, sans-serif;
    }
    .table-meta {
      width: 100%;
      border-collapse: collapse;
      font-size: 11pt;
    }
    .table-meta td {
      padding: 4px 6px;
      border: 1px solid #9ca3af;
      vertical-align: top;
    }
    .meta-bg {
      background-color: #f3f4f6;
      font-weight: bold;
      width: 32%;
    }
    .narrative-box {
      border: 1px solid #cbd5e1;
      padding: 10px;
      background-color: #fafafa;
      text-align: justify;
      font-size: 11pt;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .forensic-box {
      border: 1px solid #64748b;
      padding: 8px 12px;
      background-color: #f8fafc;
      font-family: Arial, sans-serif;
      font-size: 9pt;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header-kop">
    <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; font-family: Arial, sans-serif;">
      KANTOR ADVOKAT & PENASIHAT HUKUM
    </div>
    <div style="font-size: 9pt; font-family: Arial, sans-serif; color: #4b5563;">
      Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan • Telp: (021) 555-0199 • Email: official@hukum.id
    </div>
  </div>

  <div class="title-doc">${data.reportTitle}</div>
  <div class="num-doc">Nomor: ${data.documentNumber}</div>

  <div class="section-title">I. IDENTITAS PERKARA & JADWAL SIDANG</div>
  <table class="table-meta">
    <tr>
      <td class="meta-bg">Nomor Register Perkara</td>
      <td><strong>${data.caseNumber}</strong></td>
    </tr>
    <tr>
      <td class="meta-bg">Pengadilan</td>
      <td>${data.courtName}</td>
    </tr>
    <tr>
      <td class="meta-bg">Klasifikasi Perkara</td>
      <td>${data.caseCategory}</td>
    </tr>
    <tr>
      <td class="meta-bg">Agenda Sidang</td>
      <td><strong>${data.sessionTitle}</strong></td>
    </tr>
    <tr>
      <td class="meta-bg">Hari / Tanggal Sidang</td>
      <td>${data.sessionDate}</td>
    </tr>
    <tr>
      <td class="meta-bg">Pihak Klien / Terdakwa</td>
      <td><strong>${data.clientName}</strong></td>
    </tr>
    <tr>
      <td class="meta-bg">Pihak Lawan / JPU</td>
      <td>${data.counterPartyName}</td>
    </tr>
    <tr>
      <td class="meta-bg">Susunan Majelis Hakim</td>
      <td>${data.judgePanelNames}</td>
    </tr>
  </table>

  <div class="section-title">II. RANGKUMAN JALANNYA PERSIDANGAN & KETERANGAN SAKSI</div>
  <div class="narrative-box">${data.caseSummary}</div>

  <div class="section-title">III. CATATAN KHUSUS & KEBERATAN PENASIHAT HUKUM</div>
  <div class="narrative-box">${data.objectionsNotes}</div>

  <div class="section-title">IV. MANIFEST FORENSIK DIGITAL (UU ITE & PP 71/2019)</div>
  <div class="forensic-box">
    <strong>Master Audio SHA-256 Checksum:</strong> <span style="font-family: 'Courier New', monospace;">${data.sourceAudioSha256 || "-"}</span><br/>
    <strong>Document SHA-256 Checksum:</strong> <span style="font-family: 'Courier New', monospace;">${data.documentSha256 || "-"}</span><br/>
    <strong>Kode Verifikasi Sah:</strong> <span style="color: #b45309; font-weight: bold;">${data.verificationToken || "-"}</span><br/>
    Status: <em>Tanda Tangan Elektronik Tidak Tersertifikasi memenuhi Pasal 11 UU ITE & PP No. 71/2019 PSTE.</em>
  </div>

  <table style="width: 100%; margin-top: 35px; font-size: 11pt;">
    <tr>
      <td style="width: 50%; font-size: 9pt; color: #64748b; vertical-align: bottom;">
        Validasi QR Code: app.domainsidang.id/verify/${data.verificationToken || ""}
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        Jakarta, ${data.signedAtFormatted || new Date().toLocaleDateString("id-ID")}<br/>
        <strong>${data.signerRole || "Penasihat Hukum"}</strong><br/><br/>
        ${data.signatureImageBase64 ? `<img src="${data.signatureImageBase64}" width="160" height="60" style="display:block; margin: 0 auto; filter: invert(0);" /><br/>` : "<br/><br/><br/>"}
        <strong><u>${data.signerName}</u></strong><br/>
        ${data.signerIdentifier ? `NIA/NIK: ${data.signerIdentifier}` : ""}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanNum = (data.caseNumber || "BAS").replace(/[^a-zA-Z0-9]/g, "_");
  a.href = url;
  a.download = `Berita_Acara_Sidang_${cleanNum}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
