import { ImageResponse } from "next/og";

export const alt = "Fair Lease — Is your rental contract legal?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share preview: an annotated contract line and the question the app answers. */
export default function OpengraphImage() {
  const line = (w: string, hl?: string) => (
    <div style={{ display: "flex", height: 18, width: w, borderRadius: 3, background: hl ?? "#e2dccf" }} />
  );
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f3efe6", padding: 64, gap: 56, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="52" height="52" viewBox="0 0 32 32">
              <rect x="1" y="1" width="30" height="30" rx="7" fill="#1d1b18" />
              <path d="M12 7.5H9.5v17H12" fill="none" stroke="#fbf8f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 16.4l3.1 3.1 6-7" fill="none" stroke="#f0623f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#1d1b18" }}>Fair Lease</div>
          </div>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1.05, fontWeight: 700, color: "#1d1b18", letterSpacing: -2 }}>Is your rental contract legal?</div>
          <div style={{ display: "flex", fontSize: 28, color: "#6b665e", lineHeight: 1.35 }}>
            Every clause Spanish law doesn&apos;t allow, marked on your own text with the exact article. For renters in Madrid.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 380,
            gap: 16,
            padding: 36,
            background: "#fbf8f1",
            borderRadius: 4,
            boxShadow: "0 18px 50px -20px rgba(29,27,24,0.45)",
          }}
        >
          {line("60%")}
          {line("100%")}
          {line("92%", "rgba(232,72,40,0.35)")}
          {line("78%", "rgba(232,72,40,0.35)")}
          {line("100%")}
          {line("85%", "rgba(240,170,40,0.4)")}
          {line("100%")}
          {line("70%", "rgba(70,160,100,0.3)")}
          {line("90%")}
        </div>
      </div>
    ),
    size,
  );
}
