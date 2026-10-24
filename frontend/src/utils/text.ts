/**
 * Text and naming normalization utilities for couple and city names.
 */

const LOWERCASE_NAME_CONNECTORS = new Set(["and", "weds", "with"]);
const KNOWN_ACRONYMS = new Set(["dj", "mc", "nri", "usa", "uk", "uae"]);

function formatNameToken(token: string): string {
  if (!token) return "";
  if (token === "&") return "&";

  const wrapMatch = token.match(/^([([{"']*)(.*?)([)\]}"']*)$/);
  if (wrapMatch && (wrapMatch[1] || wrapMatch[3])) {
    const [, pre, core, post] = wrapMatch;
    if (core) {
      return pre + formatNameToken(core) + post;
    }
  }

  if (token.includes("-")) {
    return token.split("-").map(formatNameToken).join("-");
  }

  if (token.includes("'")) {
    const parts = token.split("'");
    if (parts.length === 2 && parts[1].toLowerCase() === "s") {
      return `${formatNameToken(parts[0])}'s`;
    }
    return parts.map(formatNameToken).join("'");
  }

  const lower = token.toLowerCase();
  if (
    KNOWN_ACRONYMS.has(lower) ||
    (token === token.toUpperCase() && token.length >= 2 && token.length <= 4 && /^[A-Za-z]+$/.test(token))
  ) {
    return token.toUpperCase();
  }

  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/**
 * Normalizes couple/event names to Title Case while preserving connectors and acronyms.
 * e.g. "namrata and chetan" -> "Namrata and Chetan"
 */
export function formatCoupleName(name?: string | null): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const words = cleaned.split(" ");
  const total = words.length;

  return words
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (LOWERCASE_NAME_CONNECTORS.has(lower) && idx > 0 && idx < total - 1) {
        return lower;
      }
      if (word === "&") {
        return "&";
      }
      return formatNameToken(word);
    })
    .join(" ");
}

/**
 * Title-cases an Indian city name (e.g. 'new delhi' -> 'New Delhi', 'hubli-dharwad' -> 'Hubli-Dharwad').
 */
export function capitalizeCity(city: string): string {
  if (!city) return "";
  return city
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("-")
    )
    .join(" ");
}
