/**
 * storage.js — localStorage abstraction layer
 * Handles caching API responses, saved problem sets, favorites,
 * recommendation history, and user preferences.
 */

const Storage = (() => {
  const KEYS = {
    PROBLEMSET: 'cf_problemset_cache',
    PROBLEMSET_TS: 'cf_problemset_cache_ts',
    CONTEST_LIST: 'cf_contest_list_cache',
    CONTEST_LIST_TS: 'cf_contest_list_cache_ts',
    USER_SUBMISSIONS: 'cf_user_submissions_',   // + handle
    USER_SUBMISSIONS_TS: 'cf_user_submissions_ts_', // + handle
    SAVED_SETS: 'cf_saved_sets',
    FAVORITES: 'cf_favorites',
    PREFERENCES: 'cf_user_preferences',
  };

  // Cache TTLs in milliseconds
  const PROBLEMSET_TTL = 6 * 60 * 60 * 1000;   // 6 hours
  const SUBMISSIONS_TTL = 10 * 60 * 1000;       // 10 minutes
  const CONTEST_TTL = 6 * 60 * 60 * 1000;       // 6 hours

  // ─── Generic helpers ────────────────────────────────────────

  function _get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage quota exceeded, clearing old caches...', e);
      _clearCaches();
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        console.error('Still cannot write to localStorage.');
      }
    }
  }

  function _remove(key) {
    localStorage.removeItem(key);
  }

  function _clearCaches() {
    // Remove only API caches, keep user data
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cf_problemset_cache') ||
          k.startsWith('cf_user_submissions') ||
          k.startsWith('cf_contest_list_cache')) {
        localStorage.removeItem(k);
      }
    });
  }

  // ─── Problemset cache ──────────────────────────────────────

  function getCachedProblemset() {
    const ts = _get(KEYS.PROBLEMSET_TS);
    if (!ts || Date.now() - ts > PROBLEMSET_TTL) return null;
    return _get(KEYS.PROBLEMSET);
  }

  function cacheProblemset(data) {
    _set(KEYS.PROBLEMSET, data);
    _set(KEYS.PROBLEMSET_TS, Date.now());
  }

  // ─── Contest list cache ────────────────────────────────────

  function getCachedContestList() {
    const ts = _get(KEYS.CONTEST_LIST_TS);
    if (!ts || Date.now() - ts > CONTEST_TTL) return null;
    return _get(KEYS.CONTEST_LIST);
  }

  function cacheContestList(data) {
    _set(KEYS.CONTEST_LIST, data);
    _set(KEYS.CONTEST_LIST_TS, Date.now());
  }

  // ─── User submissions cache ────────────────────────────────

  function getCachedSubmissions(handle) {
    const key = KEYS.USER_SUBMISSIONS + handle.toLowerCase();
    const tsKey = KEYS.USER_SUBMISSIONS_TS + handle.toLowerCase();
    const ts = _get(tsKey);
    if (!ts || Date.now() - ts > SUBMISSIONS_TTL) return null;
    return _get(key);
  }

  function cacheSubmissions(handle, data) {
    const key = KEYS.USER_SUBMISSIONS + handle.toLowerCase();
    const tsKey = KEYS.USER_SUBMISSIONS_TS + handle.toLowerCase();
    _set(key, data);
    _set(tsKey, Date.now());
  }

  // ─── Saved problem sets ────────────────────────────────────

  function getSavedSets() {
    return _get(KEYS.SAVED_SETS) || [];
  }

  function saveSet(setObj) {
    const sets = getSavedSets();
    sets.push(setObj);
    _set(KEYS.SAVED_SETS, sets);
  }

  function saveSets(sets) {
    _set(KEYS.SAVED_SETS, sets);
  }

  function deleteSet(setId) {
    const sets = getSavedSets().filter(s => s.id !== setId);
    _set(KEYS.SAVED_SETS, sets);
  }

  function updateSet(setId, updates) {
    const sets = getSavedSets().map(s => s.id === setId ? { ...s, ...updates } : s);
    _set(KEYS.SAVED_SETS, sets);
  }

  /**
   * Returns a Set of problem keys that are in any saved set.
   */
  function getAllSavedProblemKeys() {
    const sets = getSavedSets();
    const keys = new Set();
    for (const set of sets) {
      for (const p of set.problems) {
        keys.add(Utils.problemKey(p));
      }
    }
    return keys;
  }

  // ─── Favorites ─────────────────────────────────────────────

  function getFavorites() {
    return _get(KEYS.FAVORITES) || [];
  }

  function toggleFavorite(problem) {
    const favs = getFavorites();
    const key = Utils.problemKey(problem);
    const idx = favs.findIndex(f => Utils.problemKey(f) === key);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(problem);
    }
    _set(KEYS.FAVORITES, favs);
    return idx < 0; // true = added, false = removed
  }

  function isFavorite(problem) {
    return getFavorites().some(f => Utils.problemKey(f) === Utils.problemKey(problem));
  }

  // ─── User preferences ─────────────────────────────────────

  function getPreferences() {
    return _get(KEYS.PREFERENCES) || {
      handle: '',
      level: 10,
      yearMin: 2020,
      yearMax: 2026,
      excludeAttempted: false,
      excludeSolved: true,
      excludeContests: true,
      themeMode: 'random',
      selectedTag: '',
      includeTags: [],
      excludeTags: [],
    };
  }

  function savePreferences(prefs) {
    _set(KEYS.PREFERENCES, prefs);
  }

  return {
    getCachedProblemset,
    cacheProblemset,
    getCachedContestList,
    cacheContestList,
    getCachedSubmissions,
    cacheSubmissions,
    getSavedSets,
    saveSet,
    saveSets,
    deleteSet,
    updateSet,
    getAllSavedProblemKeys,
    getFavorites,
    toggleFavorite,
    isFavorite,
    getPreferences,
    savePreferences,
  };
})();
