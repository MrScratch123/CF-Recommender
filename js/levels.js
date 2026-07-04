/**
 * levels.js — ThemeCP Level System
 * 109 levels mapping to 4 problem ratings each.
 * Based on the ThemeCP training ladder (https://themecp.vercel.app/level_sheet)
 */

const Levels = (() => {
  // Complete level data from ThemeCP
  const DATA = [
    { level: 1, time: 120, perf: 900, P1: 800, P2: 800, P3: 800, P4: 800 },
    { level: 2, time: 120, perf: 950, P1: 800, P2: 800, P3: 800, P4: 900 },
    { level: 3, time: 120, perf: 1000, P1: 800, P2: 800, P3: 900, P4: 900 },
    { level: 4, time: 120, perf: 1050, P1: 800, P2: 900, P3: 900, P4: 900 },
    { level: 5, time: 120, perf: 1100, P1: 800, P2: 900, P3: 900, P4: 1000 },
    { level: 6, time: 120, perf: 1125, P1: 800, P2: 900, P3: 1000, P4: 1000 },
    { level: 7, time: 120, perf: 1150, P1: 800, P2: 1000, P3: 1000, P4: 1000 },
    { level: 8, time: 120, perf: 1175, P1: 800, P2: 1000, P3: 1000, P4: 1100 },
    { level: 9, time: 120, perf: 1200, P1: 800, P2: 1000, P3: 1100, P4: 1100 },
    { level: 10, time: 120, perf: 1250, P1: 800, P2: 1000, P3: 1100, P4: 1200 },
    { level: 11, time: 120, perf: 1300, P1: 800, P2: 1000, P3: 1200, P4: 1200 },
    { level: 12, time: 120, perf: 1350, P1: 800, P2: 1000, P3: 1200, P4: 1300 },
    { level: 13, time: 120, perf: 1400, P1: 800, P2: 1000, P3: 1200, P4: 1400 },
    { level: 14, time: 120, perf: 1425, P1: 900, P2: 1000, P3: 1200, P4: 1400 },
    { level: 15, time: 120, perf: 1450, P1: 900, P2: 1100, P3: 1200, P4: 1400 },
    { level: 16, time: 120, perf: 1475, P1: 900, P2: 1100, P3: 1300, P4: 1400 },
    { level: 17, time: 120, perf: 1500, P1: 900, P2: 1100, P3: 1300, P4: 1500 },
    { level: 18, time: 120, perf: 1525, P1: 1000, P2: 1100, P3: 1300, P4: 1500 },
    { level: 19, time: 120, perf: 1550, P1: 1000, P2: 1200, P3: 1300, P4: 1500 },
    { level: 20, time: 120, perf: 1575, P1: 1000, P2: 1200, P3: 1400, P4: 1500 },
    { level: 21, time: 120, perf: 1600, P1: 1000, P2: 1200, P3: 1400, P4: 1600 },
    { level: 22, time: 120, perf: 1625, P1: 1100, P2: 1200, P3: 1400, P4: 1600 },
    { level: 23, time: 120, perf: 1650, P1: 1100, P2: 1300, P3: 1400, P4: 1600 },
    { level: 24, time: 120, perf: 1675, P1: 1100, P2: 1300, P3: 1500, P4: 1600 },
    { level: 25, time: 120, perf: 1700, P1: 1100, P2: 1300, P3: 1500, P4: 1700 },
    { level: 26, time: 120, perf: 1725, P1: 1200, P2: 1300, P3: 1500, P4: 1700 },
    { level: 27, time: 120, perf: 1750, P1: 1200, P2: 1400, P3: 1500, P4: 1700 },
    { level: 28, time: 120, perf: 1775, P1: 1200, P2: 1400, P3: 1600, P4: 1700 },
    { level: 29, time: 120, perf: 1800, P1: 1200, P2: 1400, P3: 1600, P4: 1800 },
    { level: 30, time: 120, perf: 1825, P1: 1300, P2: 1400, P3: 1600, P4: 1800 },
    { level: 31, time: 120, perf: 1850, P1: 1300, P2: 1500, P3: 1600, P4: 1800 },
    { level: 32, time: 120, perf: 1875, P1: 1300, P2: 1500, P3: 1700, P4: 1800 },
    { level: 33, time: 120, perf: 1900, P1: 1300, P2: 1500, P3: 1700, P4: 1900 },
    { level: 34, time: 120, perf: 1925, P1: 1400, P2: 1500, P3: 1700, P4: 1900 },
    { level: 35, time: 120, perf: 1950, P1: 1400, P2: 1600, P3: 1700, P4: 1900 },
    { level: 36, time: 120, perf: 1975, P1: 1400, P2: 1600, P3: 1800, P4: 1900 },
    { level: 37, time: 120, perf: 2000, P1: 1400, P2: 1600, P3: 1800, P4: 2000 },
    { level: 38, time: 120, perf: 2025, P1: 1500, P2: 1600, P3: 1800, P4: 2000 },
    { level: 39, time: 120, perf: 2050, P1: 1500, P2: 1700, P3: 1800, P4: 2000 },
    { level: 40, time: 120, perf: 2075, P1: 1500, P2: 1700, P3: 1900, P4: 2000 },
    { level: 41, time: 120, perf: 2100, P1: 1500, P2: 1700, P3: 1900, P4: 2100 },
    { level: 42, time: 120, perf: 2125, P1: 1600, P2: 1700, P3: 1900, P4: 2100 },
    { level: 43, time: 120, perf: 2150, P1: 1600, P2: 1800, P3: 1900, P4: 2100 },
    { level: 44, time: 120, perf: 2175, P1: 1600, P2: 1800, P3: 2000, P4: 2100 },
    { level: 45, time: 120, perf: 2200, P1: 1600, P2: 1800, P3: 2000, P4: 2200 },
    { level: 46, time: 120, perf: 2225, P1: 1700, P2: 1800, P3: 2000, P4: 2200 },
    { level: 47, time: 120, perf: 2250, P1: 1700, P2: 1900, P3: 2000, P4: 2200 },
    { level: 48, time: 120, perf: 2275, P1: 1700, P2: 1900, P3: 2100, P4: 2200 },
    { level: 49, time: 120, perf: 2300, P1: 1700, P2: 1900, P3: 2100, P4: 2300 },
    { level: 50, time: 120, perf: 2325, P1: 1800, P2: 1900, P3: 2100, P4: 2300 },
    { level: 51, time: 120, perf: 2350, P1: 1800, P2: 2000, P3: 2100, P4: 2300 },
    { level: 52, time: 120, perf: 2375, P1: 1800, P2: 2000, P3: 2200, P4: 2300 },
    { level: 53, time: 120, perf: 2400, P1: 1800, P2: 2000, P3: 2200, P4: 2400 },
    { level: 54, time: 120, perf: 2425, P1: 1900, P2: 2000, P3: 2200, P4: 2400 },
    { level: 55, time: 125, perf: 2450, P1: 1900, P2: 2100, P3: 2200, P4: 2400 },
    { level: 56, time: 125, perf: 2475, P1: 1900, P2: 2100, P3: 2300, P4: 2400 },
    { level: 57, time: 130, perf: 2500, P1: 1900, P2: 2100, P3: 2300, P4: 2500 },
    { level: 58, time: 130, perf: 2525, P1: 2000, P2: 2100, P3: 2300, P4: 2500 },
    { level: 59, time: 135, perf: 2550, P1: 2000, P2: 2200, P3: 2300, P4: 2500 },
    { level: 60, time: 135, perf: 2575, P1: 2000, P2: 2200, P3: 2400, P4: 2500 },
    { level: 61, time: 140, perf: 2600, P1: 2000, P2: 2200, P3: 2400, P4: 2600 },
    { level: 62, time: 140, perf: 2625, P1: 2100, P2: 2200, P3: 2400, P4: 2600 },
    { level: 63, time: 145, perf: 2650, P1: 2100, P2: 2300, P3: 2400, P4: 2600 },
    { level: 64, time: 145, perf: 2675, P1: 2100, P2: 2300, P3: 2500, P4: 2600 },
    { level: 65, time: 150, perf: 2700, P1: 2100, P2: 2300, P3: 2500, P4: 2700 },
    { level: 66, time: 150, perf: 2725, P1: 2200, P2: 2300, P3: 2500, P4: 2700 },
    { level: 67, time: 155, perf: 2750, P1: 2200, P2: 2400, P3: 2500, P4: 2700 },
    { level: 68, time: 155, perf: 2775, P1: 2200, P2: 2400, P3: 2600, P4: 2700 },
    { level: 69, time: 160, perf: 2800, P1: 2200, P2: 2400, P3: 2600, P4: 2800 },
    { level: 70, time: 160, perf: 2825, P1: 2300, P2: 2400, P3: 2600, P4: 2800 },
    { level: 71, time: 165, perf: 2850, P1: 2300, P2: 2500, P3: 2600, P4: 2800 },
    { level: 72, time: 165, perf: 2875, P1: 2300, P2: 2500, P3: 2700, P4: 2800 },
    { level: 73, time: 170, perf: 2900, P1: 2300, P2: 2500, P3: 2700, P4: 2900 },
    { level: 74, time: 170, perf: 2925, P1: 2400, P2: 2500, P3: 2700, P4: 2900 },
    { level: 75, time: 175, perf: 2950, P1: 2400, P2: 2600, P3: 2700, P4: 2900 },
    { level: 76, time: 175, perf: 2975, P1: 2400, P2: 2600, P3: 2800, P4: 2900 },
    { level: 77, time: 180, perf: 3000, P1: 2400, P2: 2600, P3: 2800, P4: 3000 },
    { level: 78, time: 180, perf: 3025, P1: 2500, P2: 2600, P3: 2800, P4: 3000 },
    { level: 79, time: 180, perf: 3050, P1: 2500, P2: 2700, P3: 2800, P4: 3000 },
    { level: 80, time: 180, perf: 3075, P1: 2500, P2: 2700, P3: 2900, P4: 3000 },
    { level: 81, time: 180, perf: 3100, P1: 2500, P2: 2700, P3: 2900, P4: 3100 },
    { level: 82, time: 180, perf: 3125, P1: 2600, P2: 2700, P3: 2900, P4: 3100 },
    { level: 83, time: 180, perf: 3150, P1: 2600, P2: 2800, P3: 2900, P4: 3100 },
    { level: 84, time: 180, perf: 3175, P1: 2600, P2: 2800, P3: 3000, P4: 3100 },
    { level: 85, time: 180, perf: 3200, P1: 2600, P2: 2800, P3: 3000, P4: 3200 },
    { level: 86, time: 180, perf: 3225, P1: 2700, P2: 2800, P3: 3000, P4: 3200 },
    { level: 87, time: 180, perf: 3250, P1: 2700, P2: 2900, P3: 3000, P4: 3200 },
    { level: 88, time: 180, perf: 3275, P1: 2700, P2: 2900, P3: 3100, P4: 3200 },
    { level: 89, time: 180, perf: 3300, P1: 2700, P2: 2900, P3: 3100, P4: 3300 },
    { level: 90, time: 180, perf: 3325, P1: 2800, P2: 2900, P3: 3100, P4: 3300 },
    { level: 91, time: 180, perf: 3350, P1: 2800, P2: 3000, P3: 3100, P4: 3300 },
    { level: 92, time: 180, perf: 3375, P1: 2800, P2: 3000, P3: 3200, P4: 3300 },
    { level: 93, time: 180, perf: 3400, P1: 2800, P2: 3000, P3: 3200, P4: 3400 },
    { level: 94, time: 180, perf: 3425, P1: 2900, P2: 3000, P3: 3200, P4: 3400 },
    { level: 95, time: 180, perf: 3450, P1: 2900, P2: 3100, P3: 3200, P4: 3400 },
    { level: 96, time: 180, perf: 3475, P1: 2900, P2: 3100, P3: 3300, P4: 3400 },
    { level: 97, time: 180, perf: 3500, P1: 2900, P2: 3100, P3: 3300, P4: 3500 },
    { level: 98, time: 180, perf: 3550, P1: 3000, P2: 3100, P3: 3300, P4: 3500 },
    { level: 99, time: 180, perf: 3600, P1: 3100, P2: 3100, P3: 3300, P4: 3500 },
    { level: 100, time: 180, perf: 3650, P1: 3100, P2: 3200, P3: 3300, P4: 3500 },
    { level: 101, time: 180, perf: 3700, P1: 3200, P2: 3200, P3: 3300, P4: 3500 },
    { level: 102, time: 180, perf: 3725, P1: 3200, P2: 3300, P3: 3300, P4: 3500 },
    { level: 103, time: 180, perf: 3750, P1: 3300, P2: 3300, P3: 3300, P4: 3500 },
    { level: 104, time: 180, perf: 3775, P1: 3300, P2: 3300, P3: 3400, P4: 3500 },
    { level: 105, time: 180, perf: 3800, P1: 3300, P2: 3400, P3: 3400, P4: 3500 },
    { level: 106, time: 180, perf: 3850, P1: 3400, P2: 3400, P3: 3400, P4: 3500 },
    { level: 107, time: 180, perf: 3900, P1: 3400, P2: 3400, P3: 3500, P4: 3500 },
    { level: 108, time: 180, perf: 3950, P1: 3400, P2: 3500, P3: 3500, P4: 3500 },
    { level: 109, time: 180, perf: 4000, P1: 3500, P2: 3500, P3: 3500, P4: 3500 },
  ];

  /**
   * Get level data by level number.
   */
  function getLevel(num) {
    return DATA.find(l => l.level === num) || null;
  }

  /**
   * Get all levels.
   */
  function getAll() {
    return DATA;
  }

  /**
   * Get the rating targets (P1–P4) for a level.
   * Returns an array of 4 ratings.
   */
  function getRatings(levelNum) {
    const l = getLevel(levelNum);
    if (!l) return null;
    return [l.P1, l.P2, l.P3, l.P4];
  }

  /**
   * Get the unique set of all ratings needed for a level.
   * Used to filter the problem pool: only problems whose rating
   * matches one of the 4 slot targets.
   */
  function getUniqueRatings(levelNum) {
    const ratings = getRatings(levelNum);
    if (!ratings) return [];
    return [...new Set(ratings)];
  }

  /**
   * Get the min and max rating for a level (for broad filtering).
   */
  function getRatingRange(levelNum) {
    const ratings = getRatings(levelNum);
    if (!ratings) return { min: 800, max: 3500 };
    return { min: Math.min(...ratings), max: Math.max(...ratings) };
  }

  /**
   * CF-style rating color hex for level display.
   */
  function ratingBgColor(rating) {
    const r = parseInt(rating);
    if (r < 1200) return '#CCCCCC';
    if (r < 1400) return '#77FF77';
    if (r < 1600) return '#77DDBB';
    if (r < 1900) return '#AAAAFF';
    if (r < 2100) return '#FF88FF';
    if (r < 2300) return '#FFCC88';
    if (r < 2400) return '#FFBB55';
    if (r < 2600) return '#FF7777';
    if (r < 3000) return '#FF3333';
    return '#AA0000';
  }

  return {
    DATA,
    getLevel,
    getAll,
    getRatings,
    getUniqueRatings,
    getRatingRange,
    ratingBgColor,
  };
})();
