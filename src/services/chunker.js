export function chunkPages(
  pages,
  chunkSize = 1000,
  overlap = 200
) {
  const chunks = [];

  for (const page of pages) {
    const text = page.text.trim();

    if (!text) continue;

    let start = 0;
    let chunkIndex = 0;

    while (start < text.length) {
      const end = start + chunkSize;

      const chunkText = text
        .slice(start, end)
        .trim();

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          pageNumber: page.pageNumber,
          chunkIndex,
        });

        chunkIndex++;
      }

      start += chunkSize - overlap;
    }
  }

  return chunks;
}