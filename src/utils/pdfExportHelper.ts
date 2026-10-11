import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface DirectPdfExportOptions {
  orientation: 'portrait' | 'landscape';
  filename?: string;
  onProgress?: (current: number, total: number) => void;
  targetSheetId?: string;
  targetSheetIndices?: number[];
  customElements?: HTMLElement[];
}

async function captureSheet(
  el: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
}

export async function exportDirectPdf({
  orientation,
  filename = 'EH_Ain_El_Turck_Planning.pdf',
  onProgress,
  targetSheetId,
  targetSheetIndices,
  customElements,
}: DirectPdfExportOptions): Promise<void> {
  const isLandscape = orientation === 'landscape';
  let elements: HTMLElement[] = [];

  if (customElements && customElements.length > 0) {
    elements = customElements;
  } else if (targetSheetId) {
    const exact = document.getElementById(targetSheetId);
    if (exact) {
      elements = [exact];
    } else {
      const matched = Array.from(
        document.querySelectorAll<HTMLElement>(`[id^="${targetSheetId}"]`)
      );
      if (matched.length > 0) {
        elements = matched;
      } else {
        const queried = document.querySelector<HTMLElement>(`#${targetSheetId}`);
        if (queried) elements = [queried];
      }
    }
  } else {
    const selector = isLandscape ? '.a4-landscape-sheet' : '.a4-portrait-sheet';
    elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (targetSheetIndices && targetSheetIndices.length > 0) {
      elements = targetSheetIndices
        .map((idx) => elements[idx])
        .filter((el): el is HTMLElement => Boolean(el));
    }
  }

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

  // Neutralise le zoom d'écran (transform scale + largeurs contraintes)
  // le temps de la capture : html2canvas échoue sur des ancêtres transformés.
  const zoomEls = Array.from(document.querySelectorAll<HTMLElement>('.pdf-print-zoom'));
  const zoomSnapshots = zoomEls.map((el) => ({
    el,
    transform: el.style.transform,
    width: el.style.width,
    minWidth: el.style.minWidth,
    transition: el.style.transition,
  }));
  const stageEl = document.querySelector<HTMLElement>('.pdf-print-stage');
  const stageSnapshot = stageEl
    ? {
        el: stageEl,
        overflowX: stageEl.style.overflowX,
        justifyContent: stageEl.style.justifyContent,
      }
    : null;

  zoomEls.forEach((el) => {
    el.style.transform = 'none';
    el.style.width = 'auto';
    el.style.minWidth = '0';
    el.style.transition = 'none';
  });
  if (stageEl) {
    stageEl.style.overflowX = 'visible';
    stageEl.style.justifyContent = 'center';
  }

  try {
    for (let i = 0; i < elements.length; i++) {
      if (onProgress) {
        onProgress(i + 1, elements.length);
      }

      const el = elements[i];

      // Capture avec échelle 2 (net), avec repli automatique en échelle 1
      // en cas d'échec de rendu (mémoire/transform).
      let canvas: HTMLCanvasElement;
      try {
        canvas = await captureSheet(el, 2);
      } catch (err) {
        console.warn('Retry capture at scale 1:', err);
        canvas = await captureSheet(el, 1);
      }

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
  } finally {
    // Restaure le zoom d'écran quoi qu'il arrive
    zoomSnapshots.forEach(({ el, transform, width, minWidth, transition }) => {
      el.style.transform = transform;
      el.style.width = width;
      el.style.minWidth = minWidth;
      el.style.transition = transition;
    });
    if (stageSnapshot) {
      stageSnapshot.el.style.overflowX = stageSnapshot.overflowX;
      stageSnapshot.el.style.justifyContent = stageSnapshot.justifyContent;
    }
  }

  pdf.save(filename);
}
