import { ImageResponse } from "next/og";

export const alt = "Vigil for creators — Your brand. Beyond the bio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px", background: "#ffffff", color: "#30262c" }}>
    <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#96516c" }}>VIGIL STUDIOS / FOR CREATORS</div>
    <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontFamily: "serif", fontWeight: 400, letterSpacing: -3, lineHeight: 1.05 }}><span>Your brand.</span><span style={{ color: "#96516c", fontStyle: "italic" }}>Beyond the bio.</span></div>
    <div style={{ display: "flex", fontSize: 25, color: "#69616a" }}>Your name. Your work. Your own website.</div>
  </div>, size);
}
