/**
 * QR code generation for household IDs.
 *
 * Uses the `qrcode` npm package to generate a PNG data URL on the client.
 * The QR encodes the household ID string, which can be scanned to
 * open the household record.
 */

import QRCode from "qrcode";

/** Generate a household ID with the format: HH-{BRGYCODE}-{SEQ} */
export function generateHouseholdId(
  barangayCode: string,
  sequence: number,
): string {
  const paddedSeq = String(sequence).padStart(4, "0");
  return `HH-${barangayCode.toUpperCase()}-${paddedSeq}`;
}

/** Generate a QR code data URL for the given household ID. */
export async function generateHouseholdQR(householdId: string): Promise<string> {
  try {
    return await QRCode.toDataURL(householdId, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    throw new Error("QR code generation failed");
  }
}

/** Generate a QR code as a canvas element (for embedding in print views). */
export async function generateHouseholdQRCanvas(
  householdId: string,
  canvas: HTMLCanvasElement,
): Promise<void> {
  await QRCode.toCanvas(canvas, householdId, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Extract a short barangay code from a barangay name or ID.
 * e.g. "Mina De Oro" -> "MDO", "brgy_abc123" -> "ABC"
 */
export function getBarangayCode(barangayNameOrId: string): string {
  if (!barangayNameOrId) return "XXX";
  // If it looks like a barangay ID (brgy_xxx), take the middle part
  if (barangayNameOrId.startsWith("brgy_")) {
    const parts = barangayNameOrId.replace("brgy_", "");
    return parts.slice(0, 3).toUpperCase();
  }
  // Otherwise take first letters of each word (up to 3 words)
  const words = barangayNameOrId.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
