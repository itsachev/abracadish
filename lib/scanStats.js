// Pure, client-side derived stats from a user's scan history — no new
// schema, just reshaping what getScansForUser already returns.

function dayKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function daysBetween(a, b) {
  return Math.round((a - b) / 86400000);
}

// { current, longest } — consecutive calendar days (local time) with at
// least one scan. current resets to 0 once the most recent scan is more
// than a day old, so a broken streak reads as broken rather than stale.
export function computeStreak(scans) {
  if (scans.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = [...new Set(scans.map((s) => dayKey(s.createdAt)))]
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => b - a);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (daysBetween(uniqueDays[i - 1], uniqueDays[i]) === 1) {
      run += 1;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  if (daysBetween(today, uniqueDays[0]) <= 1) {
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (daysBetween(uniqueDays[i - 1], uniqueDays[i]) === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

// [{ cuisine, count }], most-scanned first. "Unknown" (low-confidence
// recognitions) doesn't count as an explored cuisine.
export function computeCuisineBadges(scans) {
  const counts = new Map();
  for (const scan of scans) {
    const cuisine = scan.cuisine?.trim();
    if (!cuisine || cuisine.toLowerCase() === "unknown") continue;
    counts.set(cuisine, (counts.get(cuisine) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([cuisine, count]) => ({ cuisine, count }))
    .sort((a, b) => b.count - a.count || a.cuisine.localeCompare(b.cuisine));
}

export function computeWeeklyRecap(scans) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = scans.filter((s) => new Date(s.createdAt) >= weekAgo);
  const cuisines = new Set(
    recent.map((s) => s.cuisine?.trim()).filter((c) => c && c.toLowerCase() !== "unknown")
  );
  return { scansThisWeek: recent.length, cuisinesThisWeek: cuisines.size };
}
