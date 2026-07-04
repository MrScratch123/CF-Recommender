/**
 * filters.js — Problem filtering logic
 * Processes raw CF data into categorized sets and applies user filters.
 */

const Filters = (() => {

  /**
   * Analyze user submissions and return categorized data.
   * @param {Array} submissions — Raw CF submissions array
   * @returns {{ solved: Set, attempted: Set, contestIds: Set }}
   */
  function analyzeSubmissions(submissions) {
    const solved = new Set();
    const attempted = new Set();
    const contestIds = new Set();
    const solvedToday = new Set();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

    for (const sub of submissions) {
      if (!sub.problem) continue;
      const key = Utils.problemKey(sub.problem);

      if (sub.verdict === 'OK') {
        solved.add(key);
        if (sub.creationTimeSeconds >= startOfToday) {
          solvedToday.add(key);
        }
      } else {
        attempted.add(key);
      }

      // Track contest participation (only rated/virtual)
      if (sub.author && sub.author.participantType === 'CONTESTANT') {
        contestIds.add(sub.problem.contestId);
      }
    }

    // Remove from attempted if also solved
    for (const key of solved) {
      attempted.delete(key);
    }

    return { solved, attempted, contestIds, solvedToday };
  }

  /**
   * Build a contest-year lookup from contest list data.
   * @param {Array} contests — Raw CF contest list
   * @returns {Map<number, number>} contestId → year
   */
  function buildContestYearMap(contests) {
    const map = new Map();
    for (const c of contests) {
      if (c.startTimeSeconds) {
        map.set(c.id, new Date(c.startTimeSeconds * 1000).getFullYear());
      }
    }
    return map;
  }

  /**
   * Apply all user-configured filters to the problemset.
   *
   * @param {Array} problems — Full CF problems array
   * @param {Object} options
   * @param {Object} options.userAnalysis — Output of analyzeSubmissions()
   * @param {Map} options.contestYearMap — Contest ID → year
   * @param {Set} options.allowedRatings — Set of exact ratings to include (from level system)
   * @param {number} options.yearMin
   * @param {number} options.yearMax
   * @param {boolean} options.excludeSolved
   * @param {boolean} options.excludeAttempted
   * @param {boolean} options.excludeContests
   * @param {string|null} options.themeTag — If set, only problems with this tag
   * @param {Set} options.savedKeys — Problem keys already saved (never recommend)
   * @returns {Array} Filtered problems
   */
  function applyFilters(problems, options) {
    const {
      userAnalysis,
      contestYearMap,
      allowedRatings = new Set(),
      yearMin = 2010,
      yearMax = 2026,
      excludeSolved = true,
      excludeAttempted = false,
      excludeContests = false,
      themeTag = null,
      includeTags = new Set(),
      excludeTags = new Set(),
      savedKeys = new Set(),
    } = options;

    return problems.filter(p => {
      // Must have a rating
      if (!p.rating) return false;

      // Rating must be one of the allowed ratings from the level
      if (allowedRatings && allowedRatings.size > 0 && !allowedRatings.has(p.rating)) return false;

      // Year filter
      const year = contestYearMap.get(p.contestId) || Utils.getContestYear(p.contestId);
      if (year < yearMin || year > yearMax) return false;

      const key = Utils.problemKey(p);

      // Exclude solved
      if (excludeSolved && userAnalysis && userAnalysis.solved.has(key)) return false;

      // Exclude attempted
      if (excludeAttempted && userAnalysis && userAnalysis.attempted.has(key)) return false;

      // Exclude contests the user participated in
      if (excludeContests && userAnalysis && userAnalysis.contestIds.has(p.contestId)) return false;

      // Exclude already-saved problems
      if (savedKeys.has(key)) return false;

      // Single theme tag filter (Random mode)
      if (themeTag && (!p.tags || !p.tags.includes(themeTag))) return false;

      // Custom tags filters
      if (includeTags && includeTags.size > 0) {
        if (!p.tags || !p.tags.some(t => includeTags.has(t))) return false;
      }
      if (excludeTags && excludeTags.size > 0) {
        if (p.tags && p.tags.some(t => excludeTags.has(t))) return false;
      }

      return true;
    });
  }

  /**
   * Collect all unique tags from a list of problems.
   */
  function getAllTags(problems) {
    const tagSet = new Set();
    for (const p of problems) {
      if (p.tags) p.tags.forEach(t => tagSet.add(t));
    }
    return [...tagSet].sort();
  }

  return {
    analyzeSubmissions,
    buildContestYearMap,
    applyFilters,
    getAllTags,
  };
})();
