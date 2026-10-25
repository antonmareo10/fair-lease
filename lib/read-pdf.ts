/**
 * Read the text layer of a PDF in the browser with pdf.js. The file never leaves the device: the text
 * goes into the paste box and follows exactly the path of pasted text (personal data removed, then sent
 * only when the tenant presses Check). There is no OCR: a scanned PDF has no text layer and is refused
 * with a clear message.
 */
import { layoutPdfText, type PdfItem, type PdfPage } from "./pdf-layout";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 40;
/** A page with fewer visible characters than this is treated as having no text layer (a scan). */
const MIN_PAGE_CHARS = 20;

export type PdfError = "not_pdf" | "too_big" | "too_many_pages" | "password" | "unreadable" | "no_text";

export type PdfRead =
  | { ok: true; text: string; pages: number; scannedPages: number }
  | { ok: false; error: PdfError; pages?: number };

export const PDF_ERRORS: Record<PdfError, string> = {
  not_pdf: "That file isn't a PDF. Choose a PDF, or paste the contract's text.",
  too_big: `That PDF is over ${MAX_PDF_BYTES / 1024 / 1024} MB, which is more than a rental contract needs. Paste the contract's text instead.`,
  too_many_pages: `That PDF has more than ${MAX_PDF_PAGES} pages, which is longer than a rental contract usually is. Paste only the contract itself.`,
  password: "This PDF is password-protected, so it can't be read here. Open it, copy the text and paste it in the box.",
  unreadable: "This PDF couldn't be read. It may be damaged. Copy the text from it and paste it in the box.",
  no_text:
    "This PDF is a scan: its pages are pictures, with no text to read. Fair Lease doesn't read scans (no OCR). If you have the original document, copy its text and paste it here.",
};

/** Minimal shape of the pdf.js module we use, so tests can pass the Node build and the app the browser one. */
type PdfJs = {
  getDocument(src: { data: Uint8Array; isEvalSupported?: boolean; disableFontFace?: boolean; verbosity?: number; stopAtErrors?: boolean }): {
    promise: Promise<PdfDoc>;
    destroy(): Promise<void>;
  };
};
type PdfDoc = {
  numPages: number;
  getPage(n: number): Promise<{
    getViewport(o: { scale: number }): { width: number; height: number };
    getTextContent(): Promise<{ items: unknown[] }>;
  }>;
};
type RawItem = { str?: string; transform?: number[]; width?: number; height?: number };

/** "%PDF-" within the first kilobyte, as the PDF spec allows. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

function toItem(raw: RawItem): PdfItem | null {
  if (typeof raw.str !== "string" || !Array.isArray(raw.transform)) return null;
  const [, , c, d, e, f] = raw.transform;
  return { str: raw.str, x: e, y: f, w: raw.width ?? 0, h: raw.height || Math.hypot(c, d) || 10 };
}

const visibleChars = (page: PdfPage) => page.items.reduce((n, it) => n + it.str.replace(/\s/g, "").length, 0);

/** Read every page's text with the given pdf.js build and rebuild the contract text. */
export async function extractPdf(pdfjs: PdfJs, data: Uint8Array): Promise<PdfRead> {
  if (data.byteLength > MAX_PDF_BYTES) return { ok: false, error: "too_big" };
  if (!looksLikePdf(data)) return { ok: false, error: "not_pdf" };
  const task = pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: true, verbosity: 0, stopAtErrors: false });
  let doc: PdfDoc;
  try {
    doc = await task.promise;
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    return { ok: false, error: name === "PasswordException" ? "password" : "unreadable" };
  }
  try {
    if (doc.numPages > MAX_PDF_PAGES) return { ok: false, error: "too_many_pages", pages: doc.numPages };
    const pages: PdfPage[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const { width, height } = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = (content.items as RawItem[]).map(toItem).filter((it): it is PdfItem => it !== null);
      pages.push({ width, height, items });
    }
    const scannedPages = pages.filter((p) => visibleChars(p) < MIN_PAGE_CHARS).length;
    if (scannedPages === pages.length) return { ok: false, error: "no_text", pages: pages.length };
    return { ok: true, text: layoutPdfText(pages), pages: pages.length, scannedPages };
  } catch {
    return { ok: false, error: "unreadable" };
  } finally {
    await task.destroy().catch(() => undefined);
  }
}

let loading: Promise<PdfJs> | null = null;

/** pdf.js is loaded only when someone picks a PDF, with its worker served from this site. */
function loadPdfJs(): Promise<PdfJs> {
  loading ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
    return pdfjs as unknown as PdfJs;
  });
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

/** Start fetching pdf.js when a PDF is about to arrive (a drag enters the page, the button is hovered). */
export function preloadPdfReader(): void {
  loadPdfJs().catch(() => undefined);
}

/** Browser entry point: a File from a file picker or a drop. */
export async function readPdfFile(file: File): Promise<PdfRead> {
  if (file.size > MAX_PDF_BYTES) return { ok: false, error: "too_big" };
  const data = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(data)) return { ok: false, error: "not_pdf" };
  try {
    return await extractPdf(await loadPdfJs(), data);
  } catch {
    return { ok: false, error: "unreadable" };
  }
}
