import { ImageResponse } from "next/og";

export const alt = "Kontroller leverandørutskrifter mot Xero med n8n. Bjorvand AI.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f5f1e8", color: "#181a18", padding: "58px 68px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}><span>Bjorvand AI</span><span>n8n · Xero · MIT</span></div>
      <div style={{ display: "flex", fontSize: 70, lineHeight: 1.08, letterSpacing: "-3px", fontWeight: 700, marginTop: 66, maxWidth: 1040 }}>Hva på leverandørutskriften stemmer med Xero?</div>
      <div style={{ display: "flex", fontSize: 28, marginTop: 32, color: "#4c514a" }}>Se avvikene. Behold kildene. Godkjenn selv.</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 23, color: "#a74723" }}><span>Gratis arbeidsflyt · Forhåndsversjon</span><span>bjorvand.ai</span></div>
    </div>, size,
  );
}
