import type { jsPDF } from "jspdf";
import bidiFactory from "bidi-js";
import { ArabicShaper } from "arabic-persian-reshaper";
import { CAIRO_REGULAR_BASE64 } from "./cairo-font";

/**
 * Arabic support helpers for jsPDF:
 *  - embeds the Cairo font (Arabic glyphs) into the jsPDF VFS
 *  - reshapes Arabic letters into their connected presentation forms
 *  - reorders text visually (RTL) since jsPDF renders runs left-to-right
 */

const bidi = bidiFactory();

export const AR_FONT = "Cairo";

/** Registers the Arabic font on a jsPDF instance and makes it the active font. */
export function registerArabicFont(doc: jsPDF): void {
  doc.addFileToVFS("Cairo-Regular.ttf", CAIRO_REGULAR_BASE64);
  doc.addFont("Cairo-Regular.ttf", AR_FONT, "normal");
  doc.addFont("Cairo-Regular.ttf", AR_FONT, "bold");
  doc.setFont(AR_FONT, "normal");
  doc.setR2L(false); // we handle ordering ourselves, per string
}

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFEFF]/;

/**
 * Prepares a string for rendering with jsPDF.
 * Arabic strings are reshaped then reordered to visual order; other text passes through.
 */
export function ar(text: string | number | null | undefined): string {
  const raw = text === null || text === undefined ? "" : String(text);
  if (!raw || !ARABIC_RE.test(raw)) return raw;
  return raw
    .split("\n")
    .map((line) => {
      const shaped = ArabicShaper.convertArabic(line);
      const levels = bidi.getEmbeddingLevels(shaped, "rtl");
      const reordered = bidi.getReorderedString(shaped, levels);
      // jsPDF renders characters LTR, so flip to visual order for RTL display
      return reordered.split("").reverse().join("");
    })
    .join("\n");
}
