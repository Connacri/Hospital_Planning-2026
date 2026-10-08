import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DirectPdfExportOptions {
  orientation: 'portrait' | 'landscape';
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

export async function exportDirectPdf({
  orientation,
  filename = 'EH_Ain_El_Turck_Planning.pdf',
  onProgress,
}: DirectPdfExportOptions): Promise<void> {
  const isLandscape = orientation === 'landscape';
  const selector = isLandscape ? '.a4-landscape-sheet' : '.a4-portrait-sheet';
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

  if (elements.length === 0) {
    throw new Error('Aucune feuille A4 trouvée pour la génération du PDF.');
  }

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  for (let i = 0; i < elements.length; i++) {
    if (onProgress) {
      onProgress(i + 1, elements.length);
    }

    const el = elements[i];

    // Cloner ou capturer avec échelle 2 pour une résolution nette
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }

    pdf.addImage(
      imgData,
      'JPEG',
      0,
      0,
      pageWidth,
      pageHeight,
      undefined,
      'FAST'
    );
  }

  pdf.save(filename);
}
