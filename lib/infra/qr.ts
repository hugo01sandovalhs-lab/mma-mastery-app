import "server-only";
import QRCode from "qrcode";

export async function renderCheckinQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, width: 176 });
}
