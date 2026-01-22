/**
 * Emoji generator for data files
 * Uses allowlist/blocklist approach to select appropriate emojis
 */

// High-contrast emojis that work well on both light and dark backgrounds
// Excludes: pure white/black, pale yellows, and low-contrast colors
const EMOJI_ALLOWLIST = [
  // Documents and office (with clear outlines/colors)
  "📄",
  "📃",
  "📑",
  "📊",
  "📈",
  "📉",
  "🗂️",
  "📋",
  "📌",
  "📍",
  // Data and tech (colorful with good contrast)
  "💾",
  "💿",
  "📀",
  "🖥️",
  "💻",
  "⌨️",
  "🖱️",
  "🖨️",
  "��",
  "📲",
  // Science and analysis
  "🔬",
  "🔭",
  "🧪",
  "🧬",
  "🔍",
  "🔎",
  "📡",
  "🛰️",
  // Shapes and symbols (vibrant colors only)
  "🔷",
  "🔶",
  "🟦",
  "🟧",
  "🟩",
  "🟪",
  "🟥",
  "🔵",
  "🟠",
  "🟢",
  "🟣",
  "🔴",
  "🔹",
  "🔺",
  "🔻",
  "💠",
  // Objects (with strong colors)
  "📦",
  "📫",
  "📪",
  "📬",
  "📭",
  "📮",
  "🗃️",
  "🗄️",
  "📁",
  "📂",
  // Misc symbols (colorful and clear)
  "🎯",
  "🎲",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "📷",
  "📸",
  "🔖",
  "💡",
  "🔔",
  "🔕",
  "📣",
  "📢",
  "💬",
  "💭",
  "🗨️",
  "🗯️",
];

// Emojis to avoid (people, flags, potentially offensive)
// Reserved for future use when generating random emojis from ranges
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _EMOJI_BLOCKLIST_RANGES = [
  [0x1f600, 0x1f64f], // Emoticons
  [0x1f910, 0x1f96b], // Supplemental emoticons
  [0x1f980, 0x1f9e0], // Supplemental symbols (some animals/food)
  [0x1f1e6, 0x1f1ff], // Flags
];

/**
 * Generate a deterministic emoji based on a string
 * Uses the string hash to select from allowlist
 */
export function generateEmojiForFile(filename: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % EMOJI_ALLOWLIST.length;
  return EMOJI_ALLOWLIST[index];
}

/**
 * Generate a random emoji from allowlist
 */
export function generateRandomEmoji(): string {
  const index = Math.floor(Math.random() * EMOJI_ALLOWLIST.length);
  return EMOJI_ALLOWLIST[index];
}
