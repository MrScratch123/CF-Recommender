/**
 * recommender.js — Recommendation engine
 * Selects problems from the filtered pool using the ThemeCP level system.
 * Each level defines 4 problem ratings (P1–P4).
 * We always recommend exactly 4 problems matching those slots.
 */

const Recommender = (() => {

  /**
   * Generate a set of recommended problems using the level system.
   *
   * For a given level, we have 4 target ratings (P1–P4).
   * We pick one random problem per slot from the filtered pool.
   *
   * @param {Array} filteredPool — Problems that pass all filters
   * @param {Map} contestYearMap — Contest ID → year
   * @param {Array} levelRatings — [P1, P2, P3, P4] target ratings from level
   * @returns {Array} Selected problems
   */
  function generate(filteredPool, contestYearMap, levelRatings) {
    if (filteredPool.length === 0) return [];

    // Group filtered problems by rating for efficient selection
    const byRating = new Map();
    for (const p of filteredPool) {
      if (!byRating.has(p.rating)) byRating.set(p.rating, []);
      byRating.get(p.rating).push(p);
    }

    // Use the 4 rating slots from the level
    const slots = levelRatings;

    const selected = [];
    const usedKeys = new Set();
    const usedContests = new Set();

    for (const targetRating of slots) {
      const pool = byRating.get(targetRating);
      if (!pool || pool.length === 0) continue;

      // Sort by year (newer first) and shuffle within same year
      const sorted = [...pool].sort((a, b) => {
        const yearA = contestYearMap.get(a.contestId) || Utils.getContestYear(a.contestId);
        const yearB = contestYearMap.get(b.contestId) || Utils.getContestYear(b.contestId);
        return yearB - yearA;
      });

      // Try to pick a problem from a distinct contest
      let picked = null;
      for (let attempt = 0; attempt < 50; attempt++) {
        const idx = _weightedRandomIndex(sorted.length);
        const candidate = sorted[idx];
        const key = Utils.problemKey(candidate);

        if (usedKeys.has(key)) continue;

        // Prefer distinct contests (soft constraint)
        if (usedContests.has(candidate.contestId) && attempt < 30) continue;

        picked = candidate;
        usedKeys.add(key);
        usedContests.add(candidate.contestId);
        break;
      }

      // Fallback: take any unused problem at this rating
      if (!picked) {
        for (const candidate of sorted) {
          const key = Utils.problemKey(candidate);
          if (!usedKeys.has(key)) {
            picked = candidate;
            usedKeys.add(key);
            usedContests.add(candidate.contestId);
            break;
          }
        }
      }

      if (picked) selected.push(picked);
    }

    return selected;
  }



  /**
   * Weighted random index — biases toward lower indices (newer problems).
   */
  function _weightedRandomIndex(length) {
    const bias = 1.5;
    const r = Math.random();
    const idx = Math.floor(length * Math.pow(r, bias));
    return Math.min(idx, length - 1);
  }

  /**
   * Pick a random tag from the available problems.
   */
  function pickRandomTag(problems) {
    const tags = Filters.getAllTags(problems);
    if (tags.length === 0) return null;
    return tags[Math.floor(Math.random() * tags.length)];
  }

  function generateCustom(filtered, contestYearMap, count, minRating, maxRating) {
    if (minRating > maxRating) {
      const temp = minRating; minRating = maxRating; maxRating = temp;
    }
    
    const byRating = new Map();
    for (const p of filtered) {
      if (!p.rating) continue;
      if (p.rating >= minRating && p.rating <= maxRating) {
        if (!byRating.has(p.rating)) byRating.set(p.rating, []);
        byRating.get(p.rating).push(p);
      }
    }

    if (byRating.size === 0) return [];

    const availableRatings = Array.from(byRating.keys()).sort((a,b) => a - b);
    if (availableRatings.length === 0) return [];

    const actualMin = availableRatings[0];
    const actualMax = availableRatings[availableRatings.length - 1];

    const targets = [];
    if (count === 1) {
      targets.push(actualMax);
    } else if (count === 2) {
      targets.push(actualMin, actualMax);
    } else {
      targets.push(actualMin);
      const step = (actualMax - actualMin) / (count - 1);
      for (let i = 1; i < count - 1; i++) {
        targets.push(Math.round((actualMin + step * i) / 100) * 100);
      }
      targets.push(actualMax);
    }

    const selected = [];
    const usedKeys = new Set();

    for (const target of targets) {
      let bestRating = -1;
      let minDiff = Infinity;
      for (const r of availableRatings) {
        const diff = Math.abs(r - target);
        const unused = byRating.get(r).filter(p => !usedKeys.has(Utils.problemKey(p)));
        if (unused.length > 0 && diff < minDiff) {
          minDiff = diff;
          bestRating = r;
        }
      }

      if (bestRating !== -1) {
        const candidates = byRating.get(bestRating).filter(p => !usedKeys.has(Utils.problemKey(p)));
        if (candidates.length > 0) {
          const picked = candidates[Math.floor(Math.random() * candidates.length)];
          selected.push(picked);
          usedKeys.add(Utils.problemKey(picked));
        }
      }
    }

    selected.sort((a, b) => a.rating - b.rating);
    return selected;
  }

  return {
    generate,
    pickRandomTag,
    generateCustom
  };
})();
