/**
 * Certificate Generator & Canvas Engine
 * Renders high-resolution certificates directly onto the official template images on demand:
 * - Winner: /Template.png
 * - Participation: /Participation.png
 * - Monthly Champion: /Monthlychampion.png
 *
 * No external storage (Cloudinary) required!
 */

export interface CertificateData {
  certificateId: string;
  participantName: string;
  certificateType: 'Participation' | 'Winner' | 'Monthly Champion' | string;
  contestName?: string;
  season?: string;
  position?: string;       // e.g. "1st", "2nd", "3rd", "Top 10"
  issuedDate?: string;     // e.g. "29th August 2026" or "August 2026"
  templateId?: string;
}

/**
 * Loads image asynchronously
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Renders certificate onto the correct template image
 */
export async function renderCertificate(
  canvas: HTMLCanvasElement,
  data: CertificateData
): Promise<void> {
  const typeKey = (data.certificateType || 'Participation').trim().toLowerCase();

  let templatePath = '/Participation.png';
  if (typeKey.includes('winner')) {
    templatePath = '/Template.png';
  } else if (typeKey.includes('monthly')) {
    templatePath = '/Monthlychampion.png';
  } else if (typeKey.includes('founding')) {
    templatePath = '/FoundingMemberCertificate.png';
  }

  // Load official base template image
  const templateImg = (await loadImage(templatePath)) || (await loadImage('/Template.png'));

  const width = templateImg?.naturalWidth || 2048;
  const height = templateImg?.naturalHeight || 1448;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw template background image
  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  const certIdStr = data.certificateId || 'CWCL-AUG26-0001';
  const nameStr = data.participantName || 'Kasani Hansika Goud';
  const dateStr = data.issuedDate || '29th August 2026';

  // 2. Render based on template type
  if (typeKey.includes('monthly')) {
    // ── MONTHLY CHAMPION TEMPLATE ──
    // Participant Name
    ctx.fillStyle = '#0B132B';
    ctx.textAlign = 'center';
    ctx.font = 'bold italic 60px "Times New Roman", Georgia, serif';
    ctx.fillText(nameStr, width * 0.492, height * 0.468);

    // Month & Year (on "for the month of __________________" line)
    ctx.fillStyle = '#0B132B';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(dateStr, width * 0.545, height * 0.748);

    // Certificate ID (under QR box)
    ctx.fillStyle = '#00A8B5';
    ctx.font = 'bold 13px monospace, "Courier New", sans-serif';
    ctx.fillText(certIdStr, width * 0.871, height * 0.835);

  } else if (typeKey.includes('winner')) {
    // ── WINNER TEMPLATE (/Template.png) ──
    // Participant Name
    ctx.fillStyle = '#0B132B';
    ctx.textAlign = 'center';
    ctx.font = 'bold italic 60px "Times New Roman", Georgia, serif';
    ctx.fillText(nameStr, width * 0.498, height * 0.530);

    // Position / Rank
    let posStr = data.position || '1st';
    if (/^\d+$/.test(posStr)) {
      const n = Number(posStr);
      const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
      posStr = `${n}${suffix}`;
    }
    ctx.fillStyle = '#00A8B5';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(posStr, width * 0.474, height * 0.605);

    // Held On Date
    ctx.fillStyle = '#0B132B';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(dateStr, width * 0.522, height * 0.748);

    // Certificate ID
    ctx.fillStyle = '#00A8B5';
    ctx.font = 'bold 13px monospace, "Courier New", sans-serif';
    ctx.fillText(certIdStr, width * 0.866, height * 0.862);

  } else if (typeKey.includes('founding')) {
    // ── FOUNDING MEMBER TEMPLATE (/FoundingMemberCertificate.png) ──
    // The uploaded template already contains the title, season, signatures,
    // QR placeholder and verification URL. We overlay only the dynamic fields.

    // Participant Name (center ribbon area)
    ctx.fillStyle = '#0B132B';
    ctx.textAlign = 'center';
    ctx.font = 'bold italic 64px "Times New Roman", Georgia, serif';
    ctx.fillText(nameStr, width * 0.500, height * 0.485);

    // Certificate ID (bottom-right certificate ID line)
    ctx.fillStyle = '#0B132B';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px monospace, "Courier New", sans-serif';
    ctx.fillText(certIdStr, width * 0.875, height * 0.792);

    // Issue date (small line under certificate ID)
    ctx.fillStyle = '#0B132B';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(dateStr, width * 0.875, height * 0.822);
  } else {
    // ── PARTICIPATION TEMPLATE (/Participation.png) ──
    // Participant Name
    ctx.fillStyle = '#0B132B';
    ctx.textAlign = 'center';
    ctx.font = 'bold italic 60px "Times New Roman", Georgia, serif';
    ctx.fillText(nameStr, width * 0.498, height * 0.530);

    // Held On Date
    ctx.fillStyle = '#0B132B';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(dateStr, width * 0.522, height * 0.748);

    // Certificate ID
    ctx.fillStyle = '#00A8B5';
    ctx.font = 'bold 13px monospace, "Courier New", sans-serif';
    ctx.fillText(certIdStr, width * 0.866, height * 0.862);
  }
}

/**
 * Renders certificate data onto template and returns PNG Blob
 */
export async function generateCertificateBlob(data: CertificateData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderCertificate(canvas, data);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to render certificate blob'));
    }, 'image/png');
  });
}

/**
 * Convenience helper to download a Founding Member certificate.
 */
export async function downloadFoundingCertificate(data: {
  certificateId: string;
  participantName: string;
  season?: string;
  issuedDate?: string;
}): Promise<void> {
  return downloadCertificate({
    certificateId: data.certificateId,
    participantName: data.participantName,
    certificateType: 'Founding Member',
    contestName: 'CBB Weekly Coding League',
    season: data.season,
    issuedDate: data.issuedDate,
  });
}

/**
 * Directly downloads the high-res certificate image file to the user's browser
 */
export async function downloadCertificate(data: CertificateData): Promise<void> {
  const blob = await generateCertificateBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.certificateId || 'CWCL'}_${(data.participantName || 'Certificate').replace(/\s+/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
