/**
 * JSON-LD injector — server component, no hydration.
 *
 * Rendered as a plain `<script type="application/ld+json">` so Google /
 * Bing / AI crawlers can parse the structured data without executing any
 * JS. Pass any schema.org payload (Person, WebSite, TechArticle, …).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | unknown[] }) {
  // JSON.stringify already escapes `<` etc. But to be safe against `</script>`
  // injection from any untrusted field, we additionally escape the unicode
  // sequence — recommended by OWASP for inline JSON.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
