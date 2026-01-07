/**
 * README Parser
 *
 * Extracts structured metadata from README.md files.
 * Uses regex parsing (no heavy markdown AST needed).
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type { ReadmeMetadata } from "./types.js";

/**
 * Parses a README.md file and extracts metadata.
 * Returns a default metadata object if the file doesn't exist or can't be parsed.
 */
export async function parseReadme(dirPath: string): Promise<ReadmeMetadata> {
  const readmePath = join(dirPath, "README.md");

  try {
    const content = await readFile(readmePath, "utf-8");
    return extractMetadata(content);
  } catch {
    // README doesn't exist or can't be read
    return {
      name: "",
      description: "",
      responsibilities: [],
    };
  }
}

/**
 * Extracts metadata from README content.
 */
function extractMetadata(content: string): ReadmeMetadata {
  const name = extractTitle(content);
  const description = extractDescription(content);
  const responsibilities = extractResponsibilities(content);

  return { name, description, responsibilities };
}

/**
 * Extracts the title from the first # heading.
 * Handles emoji prefixes common in this codebase.
 * Only looks at content before the first ## heading or code block.
 */
function extractTitle(content: string): string {
  // Get only the content before the first ## or code block
  // This prevents matching shell comments like "# or" inside code blocks
  const headerSection = content.split(/\n##|\n```/)[0];

  // Match # heading at start of line (may have emoji prefix)
  // Only match proper headings (# followed by a word, not just "# or")
  const titleMatch = headerSection.match(/^#\s+(\S.{2,})$/m);
  if (!titleMatch) {
    return "";
  }

  // Remove common emoji prefixes
  return titleMatch[1]
    .replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, "") // Remove emoji
    .trim();
}

/**
 * Extracts the first paragraph after the title.
 * Looks for text between the title and the next heading or section.
 */
function extractDescription(content: string): string {
  // Remove the title line
  const withoutTitle = content.replace(/^#\s+.+$/m, "");

  // Find the first non-empty paragraph before any ## heading
  const lines = withoutTitle.split("\n");
  const paragraphLines: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Stop at next heading
    if (trimmed.startsWith("#")) {
      break;
    }

    // Skip empty lines before paragraph starts
    if (!inParagraph && trimmed === "") {
      continue;
    }

    // Start of paragraph
    if (!inParagraph && trimmed !== "") {
      inParagraph = true;
    }

    // End of paragraph (empty line after content)
    if (inParagraph && trimmed === "") {
      break;
    }

    if (inParagraph) {
      paragraphLines.push(trimmed);
    }
  }

  return paragraphLines.join(" ");
}

/**
 * Extracts responsibilities from the Responsibilities section.
 * Looks for a section with "Responsibilities" in the heading and extracts list items.
 * Handles emoji prefixes (e.g., "🧠 Responsibilities").
 */
function extractResponsibilities(content: string): string[] {
  // Find the Responsibilities section (various heading formats, may have emoji)
  // Use [\s\S] for cross-line matching, stop at next ## or end
  const responsibilitiesMatch = content.match(
    /##\s+(?:[\u{1F300}-\u{1F9FF}]\s*)?Responsibilities.*?\n([\s\S]*?)(?=\n##|$)/iu,
  );

  if (!responsibilitiesMatch) {
    return [];
  }

  const section = responsibilitiesMatch[1];

  // Extract list items (- or * prefixed)
  const listItems: string[] = [];
  const lines = section.split("\n");

  for (const line of lines) {
    // Match list items starting with - or *
    const itemMatch = line.match(/^[-*]\s+(.+)/);
    if (itemMatch) {
      // Extract just the bolded part if present
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        listItems.push(boldMatch[1].trim());
      } else {
        // Clean up the item text - take first phrase before : or —
        const cleanItem = itemMatch[1]
          .replace(/\*\*/g, "")
          .replace(/[:—].+$/, "")
          .trim();
        if (cleanItem) {
          listItems.push(cleanItem);
        }
      }
    }
  }

  return listItems;
}

/**
 * Derives a human-readable name from a directory name.
 * Used as fallback when README doesn't have a title.
 */
export function nameFromDirectory(dirName: string): string {
  // Capitalize first letter
  const capitalized = dirName.charAt(0).toUpperCase() + dirName.slice(1);
  return capitalized;
}
