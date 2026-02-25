// src/utils/statusTheme.js

export function statusThemeByName(name) {
  const MAP = {
    "No Show": { border: "#f4c542", pillBg: "#fff3c4", pillText: "#7a5a00" },
    Set: { border: "#cbd5e1", pillBg: "#f1f5f9", pillText: "#334155" },
    "Attempted/Unsuccessful": { border: "#55c7da", pillBg: "#d9f6fb", pillText: "#0b5c6a" },
    "Working To Set": { border: "#a78bfa", pillBg: "#ede9fe", pillText: "#5b21b6" },
    Showed: { border: "#94a3b8", pillBg: "#e2e8f0", pillText: "#475569" },
    "Did Not Retain": { border: "#f59e0b", pillBg: "#ffedd5", pillText: "#92400e" },
    "No Money": { border: "#6b7280", pillBg: "#e5e7eb", pillText: "#374151" },
    Retained: { border: "#22c55e", pillBg: "#dcfce7", pillText: "#166534" },
    Pending: { border: "#fbbf24", pillBg: "#fef9c3", pillText: "#854d0e" },
    "Can't Help": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "Seen Can't Help": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "Referred Out": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "No Longer Needs Assistance": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
  };

  return MAP[name] || {
    border: "#e2e8f0",
    pillBg: "#f1f5f9",
    pillText: "#334155",
  };
}
