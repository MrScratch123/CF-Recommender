/**
 * utils.js — Shared utility functions
 * Formatting, date helpers, debounce, URL parameter handling, etc.
 */

const Utils = (() => {
  /**
   * Debounce a function call by `delay` ms.
   */
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Extract the year from a Codeforces contest ID.
   * Uses known contest-ID-to-year mapping heuristics and the
   * problemset creation time when available.
   */
  function getContestYear(contestId, problemCreationTime) {
    if (problemCreationTime) {
      return new Date(problemCreationTime * 1000).getFullYear();
    }
    // Rough heuristic based on contest ID ranges
    if (contestId <= 200) return 2010;
    if (contestId <= 400) return 2013;
    if (contestId <= 600) return 2015;
    if (contestId <= 800) return 2017;
    if (contestId <= 1000) return 2018;
    if (contestId <= 1200) return 2019;
    if (contestId <= 1400) return 2020;
    if (contestId <= 1600) return 2021;
    if (contestId <= 1800) return 2022;
    if (contestId <= 1950) return 2023;
    if (contestId <= 2050) return 2024;
    if (contestId <= 2150) return 2025;
    return 2026;
  }

  /**
   * Build a Codeforces problem URL from contest ID and problem index.
   */
  function problemUrl(contestId, index) {
    return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
  }

  /**
   * Build a unique key for a problem (contestId-index).
   */
  function problemKey(problem) {
    return `${problem.contestId}-${problem.index}`;
  }

  /**
   * Copy text to clipboard, returns a promise.
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  /**
   * Shuffle an array in place (Fisher–Yates).
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Format a number with commas (e.g. 12345 → "12,345").
   */
  function formatNumber(n) {
    return n.toLocaleString('en-US');
  }

  /**
   * Format milliseconds into HH:MM:SS.MS.
   */
  function formatTime(ms) {
    if (!ms) return '00:00:00.00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Encode current recommendation set into URL search params.
   */
  function encodeShareUrl(problems) {
    const keys = problems.map(p => problemKey(p));
    const params = new URLSearchParams();
    params.set('shared', keys.join(','));
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  /**
   * Decode shared problem keys from URL.
   */
  function decodeShareUrl() {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('shared');
    if (!shared) return null;
    return shared.split(',').filter(Boolean);
  }

  /**
   * Simple toast notification.
   */
  function showToast(message, type = 'success', duration = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="toast__message">${message}</span>
    `;
    container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
  }

  /**
   * Get a rating color class based on CF rating.
   */
  function ratingColor(rating) {
    if (!rating) return 'rating--unrated';
    if (rating < 1200) return 'rating--gray';
    if (rating < 1400) return 'rating--green';
    if (rating < 1600) return 'rating--cyan';
    if (rating < 1900) return 'rating--blue';
    if (rating < 2100) return 'rating--violet';
    if (rating < 2400) return 'rating--orange';
    return 'rating--red';
  }

  /**
   * Rating color hex values for charts.
   */
  function ratingColorHex(rating) {
    if (!rating) return '#808080';
    if (rating < 1200) return '#808080';
    if (rating < 1400) return '#00c853';
    if (rating < 1600) return '#00bcd4';
    if (rating < 1900) return '#2196f3';
    if (rating < 2100) return '#aa00ff';
    if (rating < 2400) return '#ff6d00';
    return '#f44336';
  }

  /**
   * Generate a unique ID.
   */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  return {
    debounce,
    getContestYear,
    problemUrl,
    problemKey,
    copyToClipboard,
    shuffle,
    formatNumber,
    formatTime,
    encodeShareUrl,
    decodeShareUrl,
    showToast,
    ratingColor,
    ratingColorHex,
    uid,
  };
})();
