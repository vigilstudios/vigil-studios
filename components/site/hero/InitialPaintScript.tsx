/**
 * Run during parsing of server HTML. Client navigation uses the owning
 * component's effect, so the client-rendered script must remain inert.
 */
export function InitialPaintScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
