/**
 * Parse concept blocks from the Angles Generator's markdown output.
 * Splits the output into individual concept blocks based on ## Concept headers.
 */
export function parseConceptBlocks(content: string): string[] {
  // Split on concept headers: "## Concept 1:", "## Concept 2:", etc.
  const blocks: string[] = [];
  const regex = /## Concept \d+[:\s]/gi;
  const parts = content.split(regex);

  // First part before any concept header is preamble — skip it
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].trim();
    if (block.length > 50) {
      blocks.push(block);
    }
  }

  // Fallback: if no concept headers found, try numbered headers
  if (blocks.length === 0) {
    const numberedRegex = /(?:^|\n)#{1,3}\s*\d+[.):]\s*/g;
    const numberedParts = content.split(numberedRegex);
    for (let i = 1; i < numberedParts.length; i++) {
      const block = numberedParts[i].trim();
      if (block.length > 50) blocks.push(block);
    }
  }

  return blocks;
}
