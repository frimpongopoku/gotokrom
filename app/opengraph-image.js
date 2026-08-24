import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Our List — a shared shopping list for two";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#171B15",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 30,
              background: "#2F6E52",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "#E8A93B" }} />
          </div>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 700, color: "#F0ECE0" }}>Our List</div>
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 34, color: "#A3AA97" }}>
          A shared shopping list for two
        </div>
      </div>
    ),
    { ...size }
  );
}
