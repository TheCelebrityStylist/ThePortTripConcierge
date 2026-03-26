export function assertNoDuplicateParagraphs(sectionId: string, paragraphs: string[]) {
  if (process.env.NODE_ENV === "production") return;
  const seen = new Map<string, number>();
  const dupes: number[] = [];
  paragraphs.forEach((p, i) => {
    const key = p.trim();
    if (!key) return;
    if (seen.has(key)) dupes.push(i + 1);
    seen.set(key, i + 1);
  });
  if (dupes.length) {
    console.error(`[content-guard] Duplicate paragraph(s) in section '${sectionId}': ${dupes.join(", ")}`);
  }
}
