/**
 * api.js — Codeforces API layer
 * All network requests to the CF API go through here.
 * Responses are cached in localStorage via Storage module.
 */

const API = (() => {
  const BASE = 'https://codeforces.com/api';

  /**
   * Generic fetch wrapper with retry logic.
   */
  async function _fetch(endpoint, params = {}) {
    const url = new URL(`${BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url.toString());
        if (res.status === 429) {
          // Rate-limited — wait and retry
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (data.status !== 'OK') {
          throw new Error(data.comment || 'Unknown API error');
        }
        return data.result;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  // ─── Problemset ────────────────────────────────────────────

  /**
   * Fetch the complete CF problemset.
   * Returns { problems: [...], problemStatistics: [...] }
   */
  async function fetchProblemset(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = Storage.getCachedProblemset();
      if (cached) return cached;
    }

    const result = await _fetch('problemset.problems');
    Storage.cacheProblemset(result);
    return result;
  }

  // ─── Contest list ──────────────────────────────────────────

  /**
   * Fetch all contests. Returns an array of contest objects.
   */
  async function fetchContestList(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = Storage.getCachedContestList();
      if (cached) return cached;
    }

    const result = await _fetch('contest.list');
    Storage.cacheContestList(result);
    return result;
  }

  // ─── User submissions ─────────────────────────────────────

  /**
   * Fetch all submissions for a given handle.
   */
  async function fetchUserSubmissions(handle, forceRefresh = false) {
    if (!handle) throw new Error('Handle is required');

    if (!forceRefresh) {
      const cached = Storage.getCachedSubmissions(handle);
      if (cached) return cached;
    }

    const result = await _fetch('user.status', { handle });
    Storage.cacheSubmissions(handle, result);
    return result;
  }

  /**
   * Fetch user info (rating, rank, etc.).
   */
  async function fetchUserInfo(handle) {
    const result = await _fetch('user.info', { handles: handle });
    return result[0]; // API returns array
  }

  return {
    fetchProblemset,
    fetchContestList,
    fetchUserSubmissions,
    fetchUserInfo,
  };
})();
