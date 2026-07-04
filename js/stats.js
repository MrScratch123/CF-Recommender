/**
 * stats.js — Statistics computation and chart rendering
 * Uses HTML5 Canvas for charts. No external libraries needed.
 */

const Stats = (() => {

  /**
   * Compute all statistics from user submissions.
   * @param {Array} submissions — Raw submissions
   * @returns {Object} Stats object
   */
  function compute(submissions) {
    const solvedByRating = {};
    const solvedByTag = {};
    const tagAttempts = {};
    const tagSolves = {};
    const heatmapData = {}; // date → count
    const solvedSet = new Set();

    for (const sub of submissions) {
      if (!sub.problem) continue;
      const key = Utils.problemKey(sub.problem);
      const date = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);

      if (sub.verdict === 'OK' && !solvedSet.has(key)) {
        solvedSet.add(key);

        // By rating
        const r = sub.problem.rating || 0;
        if (r > 0) {
          const bucket = Math.floor(r / 100) * 100;
          solvedByRating[bucket] = (solvedByRating[bucket] || 0) + 1;
        }

        // By tag
        if (sub.problem.tags) {
          for (const tag of sub.problem.tags) {
            solvedByTag[tag] = (solvedByTag[tag] || 0) + 1;
            tagSolves[tag] = (tagSolves[tag] || 0) + 1;
          }
        }

        // Heatmap
        heatmapData[date] = (heatmapData[date] || 0) + 1;
      }

      // Track attempts per tag (for weakness detection)
      if (sub.problem.tags) {
        for (const tag of sub.problem.tags) {
          tagAttempts[tag] = (tagAttempts[tag] || 0) + 1;
        }
      }
    }

    // Compute weakest tags (lowest solve/attempt ratio with min attempts)
    const weakestTags = Object.keys(tagAttempts)
      .filter(tag => tagAttempts[tag] >= 3)
      .map(tag => ({
        tag,
        attempts: tagAttempts[tag],
        solves: tagSolves[tag] || 0,
        ratio: (tagSolves[tag] || 0) / tagAttempts[tag],
      }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10);

    return {
      totalSolved: solvedSet.size,
      solvedByRating,
      solvedByTag,
      weakestTags,
      heatmapData,
    };
  }

  /**
   * Render a bar chart on a canvas element.
   */
  function renderBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 50, left: 50 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const labels = Object.keys(data).sort((a, b) => Number(a) - Number(b));
    const values = labels.map(l => data[l]);
    const maxVal = Math.max(...values, 1);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw bars
    const barW = Math.max(2, (chartW / labels.length) - 4);
    const gap = (chartW - barW * labels.length) / (labels.length + 1);

    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';

    labels.forEach((label, i) => {
      const x = padding.left + gap + i * (barW + gap);
      const barH = (values[i] / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Bar color based on rating
      const rating = Number(label);
      ctx.fillStyle = options.colorFn ? options.colorFn(rating) : Utils.ratingColorHex(rating);
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Value on top
      ctx.fillStyle = '#a0a0b0';
      ctx.fillText(values[i], x + barW / 2, y - 5);

      // Label
      ctx.save();
      ctx.translate(x + barW / 2, padding.top + chartH + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  }

  /**
   * Render a horizontal bar chart (for tags).
   */
  function renderHorizontalBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 50, bottom: 10, left: 140 };

    const sortedEntries = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, options.maxBars || 15);

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...sortedEntries.map(e => e[1]), 1);

    const barH = Math.min(24, (chartH / sortedEntries.length) - 4);
    const gap = (chartH - barH * sortedEntries.length) / (sortedEntries.length + 1);

    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px Inter, sans-serif';

    sortedEntries.forEach(([label, value], i) => {
      const y = padding.top + gap + i * (barH + gap);
      const barW = (value / maxVal) * chartW;

      // Gradient bar
      const grad = ctx.createLinearGradient(padding.left, 0, padding.left + barW, 0);
      grad.addColorStop(0, options.color || '#6366f1');
      grad.addColorStop(1, options.colorEnd || '#818cf8');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, barW, barH, [0, 4, 4, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = '#c0c0d0';
      ctx.textAlign = 'right';
      ctx.fillText(label, padding.left - 8, y + barH / 2 + 4);

      // Value
      ctx.fillStyle = '#a0a0b0';
      ctx.textAlign = 'left';
      ctx.fillText(value, padding.left + barW + 6, y + barH / 2 + 4);
    });
  }

  /**
   * Render a practice heatmap (GitHub-style).
   */
  function renderHeatmap(containerId, heatmapData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    // Generate last 365 days
    const today = new Date();
    const days = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const maxCount = Math.max(...days.map(d => heatmapData[d] || 0), 1);

    // Create grid
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';

    // We need 53 columns × 7 rows
    const weeks = [];
    let currentWeek = [];

    // Pad the first week
    const firstDay = new Date(days[0]).getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    for (const week of weeks) {
      const col = document.createElement('div');
      col.className = 'heatmap-col';
      for (let row = 0; row < 7; row++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        const day = week[row];
        if (day) {
          const count = heatmapData[day] || 0;
          if (count === 0) {
            cell.setAttribute('data-level', 0);
          } else {
            const f = count / maxCount;
            const r = Math.round(144 - 144 * f);
            const g = Math.round(238 - 138 * f);
            const b = Math.round(144 - 144 * f);
            cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
          }
          cell.title = `${day}: ${count} problem${count !== 1 ? 's' : ''} solved`;
        } else {
          cell.setAttribute('data-level', -1);
        }
        col.appendChild(cell);
      }
      grid.appendChild(col);
    }

    container.appendChild(grid);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    
    // Light green to dark green interpolation values for legend
    // f = 0.25, 0.5, 0.75, 1.0
    const c1 = `rgb(108, 204, 108)`;
    const c2 = `rgb(72, 169, 72)`;
    const c3 = `rgb(36, 135, 36)`;
    const c4 = `rgb(0, 100, 0)`;

    legend.innerHTML = `
      <span>Less</span>
      <div class="heatmap-cell" data-level="0"></div>
      <div class="heatmap-cell" style="background-color: ${c1}"></div>
      <div class="heatmap-cell" style="background-color: ${c2}"></div>
      <div class="heatmap-cell" style="background-color: ${c3}"></div>
      <div class="heatmap-cell" style="background-color: ${c4}"></div>
      <span>More</span>
    `;
    container.appendChild(legend);
  }

  /**
   * Render weakness analysis.
   */
  function renderWeakness(containerId, weakestTags) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (weakestTags.length === 0) {
      container.innerHTML = '<p class="stats-empty">Not enough data to analyze weaknesses.</p>';
      return;
    }

    container.innerHTML = weakestTags.map(t => `
      <div class="weakness-row">
        <span class="weakness-tag">${t.tag}</span>
        <div class="weakness-bar-bg">
          <div class="weakness-bar-fill" style="width: ${(t.ratio * 100).toFixed(0)}%"></div>
        </div>
        <span class="weakness-ratio">${(t.ratio * 100).toFixed(0)}%</span>
        <span class="weakness-detail">${t.solves}/${t.attempts}</span>
      </div>
    `).join('');
  }

  return {
    compute,
    renderBarChart,
    renderHorizontalBarChart,
    renderHeatmap,
    renderWeakness,
  };
})();
