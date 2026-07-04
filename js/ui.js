/**
 * ui.js — UI rendering and DOM interaction
 * Builds all UI components and handles events.
 */

const UI = (() => {
  let currentProblems = [];
  let currentThemeTag = null;
  let contestYearMap = new Map();
  let allTags = [];
  let userAnalysis = null;
  let allProblems = [];

  // ─── Initialize ────────────────────────────────────────────

  async function init() {
    _loadPreferences();
    _bindEvents();
    _bindKeyboardShortcuts();
    _checkSharedUrl();
    _renderSavedSets();
    _renderHistory();
    _renderFavorites();
    _bindStopwatch();

    try {
      const problemsetData = await API.fetchProblemset();
      allProblems = problemsetData.problems;
      allTags = Filters.getAllTags(allProblems);
      _populateTagSelect();
    } catch(e) {
      console.warn("Failed to prefetch tags", e);
    }
  }

  // ─── Preferences ──────────────────────────────────────────

  function _loadPreferences() {
    const prefs = Storage.getPreferences();
    const el = (id) => document.getElementById(id);

    if (prefs.handle) el('handle-input').value = prefs.handle;
    el('level-input').value = prefs.level || 10;
    _updateLevelPreview(prefs.level || 10);
    el('year-min').value = prefs.yearMin;
    el('year-max').value = prefs.yearMax;
    el('exclude-solved').checked = prefs.excludeSolved;
    el('exclude-attempted').checked = prefs.excludeAttempted;
    el('exclude-contests').checked = prefs.excludeContests;
    el('show-tags-toggle').checked = prefs.showTags !== false;

    // Apply show tags instantly
    document.body.classList.toggle('hide-tags', prefs.showTags === false);

    // Theme mode radio
    const radio = document.querySelector(`input[name="theme-mode"][value="${prefs.themeMode}"]`);
    if (radio) radio.checked = true;

    _updateThemeModeUI(prefs.themeMode);
  }

  function _savePreferences() {
    const prefs = {
      handle: document.getElementById('handle-input').value.trim(),
      level: parseInt(document.getElementById('level-input').value) || 10,
      yearMin: parseInt(document.getElementById('year-min').value),
      yearMax: parseInt(document.getElementById('year-max').value),
      excludeSolved: document.getElementById('exclude-solved').checked,
      excludeAttempted: document.getElementById('exclude-attempted').checked,
      excludeContests: document.getElementById('exclude-contests').checked,
      showTags: document.getElementById('show-tags-toggle').checked,
      themeMode: document.querySelector('input[name="theme-mode"]:checked')?.value || 'random'
    };
    Storage.savePreferences(prefs);
    return prefs;
  }

  /**
   * Update the level preview display showing P1–P4 ratings.
   */
  function _updateLevelPreview(levelNum) {
    const preview = document.getElementById('level-preview');
    if (!preview) return;
    const lvl = Levels.getLevel(levelNum);
    if (!lvl) {
      preview.innerHTML = '<span class="level-preview__empty">Invalid level</span>';
      return;
    }
    preview.innerHTML = `
      <div class="level-preview__perf">Perf: <strong>${lvl.perf}</strong> · ${lvl.time} min</div>
      <div class="level-preview__slots">
        <span class="level-slot" style="background:${Levels.ratingBgColor(lvl.P1)}">P1: ${lvl.P1}</span>
        <span class="level-slot" style="background:${Levels.ratingBgColor(lvl.P2)}">P2: ${lvl.P2}</span>
        <span class="level-slot" style="background:${Levels.ratingBgColor(lvl.P3)}">P3: ${lvl.P3}</span>
        <span class="level-slot" style="background:${Levels.ratingBgColor(lvl.P4)}">P4: ${lvl.P4}</span>
      </div>
    `;
  }

  // ─── Event bindings ────────────────────────────────────────

  function _bindEvents() {
    // Level input — update preview on change
    document.getElementById('level-input').addEventListener('input', Utils.debounce((e) => {
      const val = parseInt(e.target.value);
      if (val >= 1 && val <= 109) _updateLevelPreview(val);
    }, 150));

    // Generation
    document.getElementById('btn-generate').addEventListener('click', () => _handleGenerate());
    document.getElementById('btn-regenerate').addEventListener('click', () => _handleGenerate());

    // ThemeCP Toggle
    document.getElementById('themecp-toggle').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.getElementById('field-level').style.display = 'block';
        document.getElementById('custom-group').style.display = 'none';
      } else {
        document.getElementById('field-level').style.display = 'none';
        document.getElementById('custom-group').style.display = 'block';
      }
    });

    document.getElementById('btn-save-set').addEventListener('click', _handleSaveSet);
    document.getElementById('btn-start-set')?.addEventListener('click', startVirtualSet);

    document.getElementById('show-tags-toggle').addEventListener('change', (e) => {
      document.body.classList.toggle('hide-tags', !e.target.checked);
      _savePreferences();
    });

    // Export/Import
    document.getElementById('btn-export-data')?.addEventListener('click', _handleExportData);
    document.getElementById('btn-import-data')?.addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input')?.addEventListener('change', _handleImportData);

    // Theme mode radios
    document.querySelectorAll('input[name="theme-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => _updateThemeModeUI(e.target.value));
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        _switchTab(tab);
      });
    });

    // Handle input — Enter key
    document.getElementById('handle-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        _handleGenerate();
      }
    });

    // Sidebar toggle (mobile)
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('sidebar--open');
    });

    // Close sidebar overlay
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('sidebar--open');
    });

    // Clear history
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      Storage.clearHistory();
      _renderHistory();
      Utils.showToast('History cleared');
    });
  }

  function _bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        _handleGenerate();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        _handleSaveSet();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        _handleExport();
      } else if (e.key === '1') {
        _switchTab('recommend');
      } else if (e.key === '2') {
        _switchTab('saved');
      } else if (e.key === '3') {
        _switchTab('stats');
      } else if (e.key === '4') {
        _switchTab('history');
      }
    });
  }


  // ─── Tab switching ─────────────────────────────────────────

  function _switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('tab-btn--active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('tab-panel--active', panel.id === `tab-${tabId}`);
    });

    // If stats tab, render charts
    if (tabId === 'stats' && userAnalysis) {
      _renderStats();
    }
  }

  // ─── Theme mode UI ────────────────────────────────────────

  function _updateThemeModeUI(mode) {
    const tagSelectGroup = document.getElementById('tag-select-group');
    if (mode === 'custom') {
      tagSelectGroup.style.display = 'flex';
      _populateTagSelect();
    } else {
      tagSelectGroup.style.display = 'none';
    }
  }

  const selectedIncludeTags = new Set();
  const selectedExcludeTags = new Set();

  function _initChipInputs() {
    // Only init once
    if (document.getElementById('input-include').dataset.inited) return;
    document.getElementById('input-include').dataset.inited = 'true';
    _setupChipInput('include', selectedIncludeTags);
    _setupChipInput('exclude', selectedExcludeTags);
  }

  function _setupChipInput(type, selectedSet) {
    const input = document.getElementById(`input-${type}`);
    const dropdown = document.getElementById(`dropdown-${type}`);
    const chipsContainer = document.getElementById(`chips-${type}`);
    const container = document.getElementById(`chip-input-${type}`);
    if (!input) return;

    function renderDropdown(filterText = '') {
      dropdown.innerHTML = '';
      const text = filterText.toLowerCase();
      const available = allTags.filter(t => !selectedSet.has(t) && t.toLowerCase().includes(text));
      if (available.length === 0) {
        dropdown.style.display = 'none';
        return;
      }
      dropdown.style.display = 'block';
      available.slice(0, 50).forEach((tag, i) => {
        const item = document.createElement('div');
        item.className = 'chip-input__dropdown-item';
        if (i === 0) item.classList.add('focused');
        item.textContent = tag;
        item.addEventListener('mousedown', (e) => {
          e.preventDefault(); // prevent blur
          addTag(tag);
        });
        dropdown.appendChild(item);
      });
    }

    function renderChips() {
      chipsContainer.innerHTML = '';
      for (const tag of selectedSet) {
        const chip = document.createElement('span');
        chip.className = 'tag-chip tag-chip--active';
        chip.innerHTML = `${tag} <span class="chip-remove">&times;</span>`;
        chip.querySelector('.chip-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          selectedSet.delete(tag);
          renderChips();
          _savePreferences();
        });
        chipsContainer.appendChild(chip);
      }
    }

    function addTag(tag) {
      if (selectedSet.has(tag)) return;
      selectedSet.add(tag);
      input.value = '';
      renderChips();
      dropdown.style.display = 'none';
      input.focus();
      _savePreferences();
    }

    input.addEventListener('focus', () => renderDropdown(input.value));
    input.addEventListener('blur', () => {
      setTimeout(() => dropdown.style.display = 'none', 100);
    });
    input.addEventListener('input', (e) => renderDropdown(e.target.value));
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const focused = dropdown.querySelector('.focused');
        if (focused && dropdown.style.display !== 'none') {
          addTag(focused.textContent);
        } else if (input.value.trim()) {
          const val = input.value.trim().toLowerCase();
          const match = allTags.find(t => t.toLowerCase() === val);
          if (match) addTag(match);
        }
      } else if (e.key === 'Backspace' && input.value === '') {
        const last = Array.from(selectedSet).pop();
        if (last) {
          selectedSet.delete(last);
          renderChips();
          _savePreferences();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const current = dropdown.querySelector('.focused');
        if (current && current.nextElementSibling) {
          current.classList.remove('focused');
          current.nextElementSibling.classList.add('focused');
          current.nextElementSibling.scrollIntoView({block: 'nearest'});
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const current = dropdown.querySelector('.focused');
        if (current && current.previousElementSibling) {
          current.classList.remove('focused');
          current.previousElementSibling.classList.add('focused');
          current.previousElementSibling.scrollIntoView({block: 'nearest'});
        }
      }
    });

    container.addEventListener('click', () => input.focus());
  }

  function _populateTagSelect() {
    _initChipInputs();
  }

  // ─── Generate recommendations ─────────────────────────────

  async function _handleGenerate() {
    const prefs = _savePreferences();
    const handle = prefs.handle;

    if (!handle) {
      Utils.showToast('Please enter your Codeforces handle', 'error');
      document.getElementById('handle-input').focus();
      return;
    }

    _setLoading(true);
    _switchTab('recommend');

    try {
      // Fetch data in parallel
      const [problemsetData, contestList, submissions] = await Promise.all([
        API.fetchProblemset(),
        API.fetchContestList(),
        API.fetchUserSubmissions(handle),
      ]);

      allProblems = problemsetData.problems;
      contestYearMap = Filters.buildContestYearMap(contestList);
      allTags = Filters.getAllTags(allProblems);
      userAnalysis = Filters.analyzeSubmissions(submissions);

      // Update user stats summary
      _renderUserSummary(handle, userAnalysis);

      // Populate tag select if needed
      _populateTagSelect();

      // Determine tags
      let themeTag = null;
      let includeTags = new Set();
      let excludeTags = new Set();
      const themeMode = prefs.themeMode;

      if (themeMode === 'random') {
        themeTag = Recommender.pickRandomTag(allProblems);
        currentThemeTag = themeTag;
      } else if (themeMode === 'custom') {
        includeTags = new Set(selectedIncludeTags);
        excludeTags = new Set(selectedExcludeTags);
        currentThemeTag = 'Custom Tags'; // display purpose
      } else if (themeMode === 'mixed') {
        themeTag = null;
        currentThemeTag = null;
      }

      // Get saved problem keys
      const savedKeys = Storage.getAllSavedProblemKeys();

      // Check generation mode
      const isThemeCP = document.getElementById('themecp-toggle').checked;

      const filterOptions = {
          userAnalysis,
          contestYearMap,
          yearMin: prefs.yearMin,
          yearMax: prefs.yearMax,
          excludeSolved: prefs.excludeSolved,
          excludeAttempted: prefs.excludeAttempted,
          excludeContests: prefs.excludeContests,
          themeTag,
          includeTags,
          excludeTags,
          savedKeys,
      };

      if (isThemeCP) {
        const levelNum = prefs.level || 10;
        filterOptions.allowedRatings = new Set(Levels.getUniqueRatings(levelNum));
        const filtered = Filters.applyFilters(allProblems, filterOptions);
        currentProblems = Recommender.generate(filtered, contestYearMap, Levels.getRatings(levelNum));
      } else {
        const minRating = parseInt(document.getElementById('rating-min').value, 10) || 1200;
        const maxRating = parseInt(document.getElementById('rating-max').value, 10) || 1500;
        const count = parseInt(document.getElementById('problem-count').value, 10) || 4;
        const filtered = Filters.applyFilters(allProblems, filterOptions);
        currentProblems = Recommender.generateCustom(filtered, contestYearMap, count, minRating, maxRating);
      }

      if (currentProblems.length === 0) {
        _renderEmptyState();
      } else {
        _renderProblemCards(currentProblems, themeTag);

        // Save to history
        Storage.addToHistory({
          id: Utils.uid(),
          timestamp: Date.now(),
          handle,
          tag: themeTag,
          count: currentProblems.length,
          problems: currentProblems.map(p => ({
            contestId: p.contestId,
            index: p.index,
            name: p.name,
            rating: p.rating,
          })),
        });
        _renderHistory();
      }

      Utils.showToast(`Generated ${currentProblems.length} problem${currentProblems.length !== 1 ? 's' : ''}${themeTag ? ` [${themeTag}]` : ''}`);

    } catch (err) {
      console.error('Generation error:', err);
      Utils.showToast(err.message || 'Failed to generate recommendations', 'error');
    } finally {
      _setLoading(false);
    }
  }

  // ─── Render problem cards ─────────────────────────────────

  function _renderProblemCards(problems, themeTag) {
    const container = document.getElementById('problem-cards');
    const actions = document.getElementById('result-actions');
    const themeLabel = document.getElementById('theme-label');

    actions.style.display = 'flex';

    if (themeTag) {
      themeLabel.innerHTML = `<span class="theme-badge">Theme: <strong>${themeTag}</strong></span>`;
      themeLabel.style.display = 'block';
    } else {
      themeLabel.style.display = 'none';
    }

    container.innerHTML = problems.map((p, i) => {
      const url = Utils.problemUrl(p.contestId, p.index);
      const year = contestYearMap.get(p.contestId) || Utils.getContestYear(p.contestId);
      const isFav = Storage.isFavorite(p);
      const isSolved = userAnalysis && userAnalysis.solved.has(Utils.problemKey(p));
      const ratingClass = Utils.ratingColor(p.rating);

      return `
        <div class="problem-card ${isSolved ? 'problem-card--solved' : ''}" style="animation-delay: ${i * 60}ms">
          <div class="problem-card__header">
            <span class="problem-card__id">${p.contestId}${p.index}</span>
            <span class="problem-card__rating ${ratingClass}">${p.rating}</span>
          </div>
          <h3 class="problem-card__name">
            <a href="${url}" target="_blank" rel="noopener">${p.name}</a>
          </h3>
          <div class="problem-card__meta">
            <span class="problem-card__year">📅 ${year}</span>
            <span class="problem-card__contest">Contest #${p.contestId}</span>
          </div>
          <div class="problem-card__tags">
            ${(p.tags || []).map(t => `<span class="tag-chip${t === themeTag ? ' tag-chip--active' : ''}">${t}</span>`).join('')}
          </div>
          <div class="problem-card__actions">
            <a href="${url}" target="_blank" rel="noopener" class="btn btn--sm btn--primary">Open</a>
            <button class="btn btn--sm btn--ghost" onclick="UI.copyLink('${url}')" title="Copy link">Copy</button>
            <button class="btn btn--sm btn--ghost ${isFav ? 'btn--fav-active' : ''}" 
                    onclick="UI.toggleFav(${p.contestId}, '${p.index}')" 
                    title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFav ? '★' : '☆'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function _renderEmptyState() {
    const container = document.getElementById('problem-cards');
    const actions = document.getElementById('result-actions');
    const themeLabel = document.getElementById('theme-label');

    actions.style.display = 'none';
    themeLabel.style.display = 'none';

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon" style="display:none"></div>
        <h3>No problems found</h3>
        <p>Try adjusting your filters — change the level, widen the year range, or disable contest exclusion.</p>
      </div>
    `;
  }

  // ─── User summary ─────────────────────────────────────────

  function _renderUserSummary(handle, analysis) {
    const el = document.getElementById('user-summary');
    el.style.display = 'flex';
    el.innerHTML = `
      <div class="user-stat">
        <span class="user-stat__value">${Utils.formatNumber(analysis.solvedToday?.size || 0)}</span>
        <span class="user-stat__label">Solved Today</span>
      </div>
      <div class="user-stat">
        <span class="user-stat__value">${Utils.formatNumber(analysis.solved.size)}</span>
        <span class="user-stat__label">Solved</span>
      </div>
      <div class="user-stat">
        <span class="user-stat__value">${Utils.formatNumber(analysis.attempted.size)}</span>
        <span class="user-stat__label">Attempted</span>
      </div>
      <div class="user-stat">
        <span class="user-stat__value">${Utils.formatNumber(analysis.contestIds.size)}</span>
        <span class="user-stat__label">Contests</span>
      </div>
      <div class="user-stat" style="cursor: pointer; justify-content: center; background: var(--text-primary); color: #000; flex: 0.5;" onclick="UI.refreshStats()">
        <span class="user-stat__label" style="color: #000; font-weight: bold;">Refresh</span>
      </div>
    `;
  }

  // ─── Save set ──────────────────────────────────────────────

  function _handleSaveSet() {
    if (currentProblems.length === 0) {
      Utils.showToast('Generate problems first', 'error');
      return;
    }

    const setNum = Storage.getSavedSets().length + 1;
    const name = `Problem Set ${setNum}`;

    Storage.saveSet({
      id: Utils.uid(),
      name,
      createdAt: Date.now(),
      tag: currentThemeTag,
      problems: currentProblems.map(p => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
      })),
    });

    _renderSavedSets();
    Utils.showToast(`Saved "${name}"!`);
  }


  function startVirtualSet() {
    if (currentProblems.length === 0) {
      Utils.showToast('Generate problems first', 'error');
      return;
    }
    const setNum = Storage.getSavedSets().length + 1;
    activeVirtualSet = {
      id: Utils.uid(),
      name: `Problem Set ${setNum}`,
      createdAt: Date.now(),
      tag: currentThemeTag,
      elapsedMs: 0,
      problems: currentProblems.map(p => ({ ...p, solvedTimeMs: null }))
    };
    
    _switchTab('virtual');
    _renderVirtualSet();
    
    Stopwatch.reset();
    Stopwatch.start();
    const pauseBtn = document.getElementById('btn-virtual-pause');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    const archBtn = document.getElementById('btn-virtual-archive');
    if (archBtn) archBtn.style.display = 'none';
    
    Utils.showToast('Virtual Set started');
  }


  function resumeVirtualSet(setId) {
    const set = Storage.getSavedSets().find(s => s.id === setId);
    if (!set) return;
    activeVirtualSet = JSON.parse(JSON.stringify(set));
    
    _switchTab('virtual');
    _renderVirtualSet();
    
    Stopwatch.reset();
    Stopwatch.setElapsedTime(activeVirtualSet.elapsedMs || 0);
    Stopwatch.start();
    const pauseBtn = document.getElementById('btn-virtual-pause');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    const archBtn = document.getElementById('btn-virtual-archive');
    if (archBtn) archBtn.style.display = 'none';
    
    Utils.showToast('Virtual Set resumed');
  }

  function toggleSetTimer(setId) {
    const sets = Storage.getSavedSets();
    const set = sets.find(s => s.id === setId);
    if (!set) return;
    
    if (set.isRunning) {
      set.isRunning = false;
      set.elapsedMs = (set.elapsedMs || 0) + (Date.now() - set.lastStartedAt);
    } else {
      set.isRunning = true;
      set.lastStartedAt = Date.now();
    }
    Storage.saveSets(sets);
    _renderSavedSets();
  }


  function _renderVirtualSet() {
    const container = document.getElementById('virtual-problem-cards');
    const controls = document.getElementById('virtual-controls');

    if (!activeVirtualSet || !activeVirtualSet.problems || activeVirtualSet.problems.length === 0) {
      if (controls) controls.style.display = 'none';
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">▶️</div>
          <h3>No active set</h3>
          <p>Generate recommendations and click "Start Virtual Set" to begin, or resume a saved set.</p>
        </div>
      `;
      return;
    }

    if (controls) controls.style.display = 'flex';
    container.innerHTML = activeVirtualSet.problems.map((p, i) => {
      const url = Utils.problemUrl(p.contestId, p.index);
      const year = contestYearMap.get(p.contestId) || Utils.getContestYear(p.contestId);
      const isFav = Storage.isFavorite(p);
      const isSolved = userAnalysis && userAnalysis.solved.has(Utils.problemKey(p));
      const ratingClass = Utils.ratingColor(p.rating);

      return `
        <div class="problem-card ${isSolved ? 'problem-card--solved' : ''}" style="animation-delay: ${i * 60}ms">
          <div class="problem-card__header">
            <span class="problem-card__id">${p.contestId}${p.index}</span>
            <span class="problem-card__rating ${ratingClass}">${p.rating}</span>
          </div>
          <h3 class="problem-card__name">
            <a href="${url}" target="_blank" rel="noopener">${p.name}</a>
          </h3>
          <div class="problem-card__meta">
            <span class="problem-card__year">📅 ${year}</span>
            <span class="problem-card__contest">Contest #${p.contestId}</span>
          </div>
          <div class="problem-card__tags">
            ${(p.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}
          </div>
          <div class="problem-card__actions">
            <a href="${url}" target="_blank" rel="noopener" class="btn btn--sm btn--primary">Open</a>
            <button class="btn btn--sm btn--ghost" onclick="UI.copyLink('${url}')" title="Copy link">Copy</button>
            <button class="btn btn--sm btn--ghost ${isFav ? 'btn--fav-active' : ''}" 
                    onclick="UI.toggleFav(${p.contestId}, '${p.index}')" 
                    title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFav ? '★' : '☆'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ─── Render saved sets ────────────────────────────────────

  function _renderSavedSets() {
    const container = document.getElementById('saved-sets-list');
    const sets = Storage.getSavedSets();

    if (sets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📁</div>
          <h3>No saved sets</h3>
          <p>Generate recommendations and save them to build your practice sets.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = sets.map(set => `
      <div class="saved-set" data-set-id="${set.id}">
        <div class="saved-set__header" onclick="UI.toggleSetExpand('${set.id}')">
          <div class="saved-set__info">
            <h4 class="saved-set__name">${set.name}</h4>
            <span class="saved-set__meta">
              ${set.problems.length} problems
              ${set.tag ? `· ${set.tag}` : ''}
              · ${new Date(set.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div class="saved-set__actions">
            <button class="btn btn--sm btn--primary" onclick="event.stopPropagation(); UI.resumeVirtualSet('${set.id}')" title="Resume Set">Resume</button>
            <button class="btn btn--sm btn--ghost" onclick="event.stopPropagation(); UI.deleteSet('${set.id}')" title="Delete">Delete</button>
            <span class="saved-set__chevron">▸</span>
          </div>
        </div>
        <div class="saved-set__body" id="set-body-${set.id}">
          <div class="saved-set__problems">
            ${set.problems.map(p => {
              const url = Utils.problemUrl(p.contestId, p.index);
              const ratingClass = Utils.ratingColor(p.rating);
              const isSolved = userAnalysis && userAnalysis.solved.has(Utils.problemKey(p));
              return `
                <div class="saved-problem-row ${isSolved ? 'saved-problem-row--solved' : ''}">
                  <a href="${url}" target="_blank" class="saved-problem-row__name">${p.contestId}${p.index} — ${p.name}</a>
                  <span class="saved-problem-row__rating ${ratingClass}">${p.rating}</span>
                  <span class="solved-time">${p.solvedTimeMs ? Utils.formatTime(p.solvedTimeMs) : ''}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ─── Render history ───────────────────────────────────────

  function _renderHistory() {
    const container = document.getElementById('history-list');
    const history = Storage.getHistory();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon" style="display:none"></div>
          <h3>No history yet</h3>
          <p>Your recent recommendations will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(entry => `
      <div class="history-entry">
        <div class="history-entry__time">${new Date(entry.timestamp).toLocaleString()}</div>
        <div class="history-entry__detail">
          <strong>${entry.handle}</strong> · ${entry.count} problems
          ${entry.tag ? `· <span class="tag-chip tag-chip--sm">${entry.tag}</span>` : ''}
        </div>
        <div class="history-entry__problems">
          ${entry.problems.map(p => `<a href="${Utils.problemUrl(p.contestId, p.index)}" target="_blank" class="history-problem">${p.contestId}${p.index}</a>`).join(' ')}
        </div>
      </div>
    `).join('');
  }

  // ─── Render favorites ─────────────────────────────────────

  function _renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    const favs = Storage.getFavorites();
    if (favs.length === 0) {
      container.innerHTML = `
        <div class="empty-state empty-state--sm">
          <p>No favorites yet. Click ☆ on any problem to add it.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = favs.map(p => {
      const url = Utils.problemUrl(p.contestId, p.index);
      const ratingClass = Utils.ratingColor(p.rating);
      return `
        <div class="saved-problem-row">
          <a href="${url}" target="_blank" class="saved-problem-row__name">${p.contestId}${p.index} — ${p.name}</a>
          <span class="saved-problem-row__rating ${ratingClass}">${p.rating}</span>
          <button class="btn btn--sm btn--ghost btn--fav-active" onclick="UI.toggleFav(${p.contestId}, '${p.index}')">★</button>
        </div>
      `;
    }).join('');
  }

  // ─── Statistics ───────────────────────────────────────────

  async function _renderStats() {
    const handle = document.getElementById('handle-input').value.trim();
    if (!handle) {
      document.getElementById('stats-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon" style="display:none"></div>
          <h3>Enter your handle</h3>
          <p>We need your handle to compute statistics. Enter it in the sidebar and generate recommendations first.</p>
        </div>
      `;
      return;
    }

    try {
      const submissions = await API.fetchUserSubmissions(handle);
      const stats = Stats.compute(submissions);

      document.getElementById('stats-content').innerHTML = `
        <div class="stats-section">
          <h3 class="stats-section__title">Problems Solved by Rating</h3>
          <div class="chart-container">
            <canvas id="chart-rating" width="600" height="280"></canvas>
          </div>
        </div>
        <div class="stats-section">
          <h3 class="stats-section__title">Problems Solved by Tag</h3>
          <div class="chart-container chart-container--tall">
            <canvas id="chart-tags" width="600" height="500"></canvas>
          </div>
        </div>
        <div class="stats-section">
          <h3 class="stats-section__title">Weakest Tags (solve/attempt ratio)</h3>
          <div id="weakness-container" class="weakness-container"></div>
        </div>
        <div class="stats-section">
          <h3 class="stats-section__title">Practice Heatmap (Last 365 Days)</h3>
          <div id="heatmap-container" class="heatmap-container"></div>
        </div>
      `;

      // Render charts after DOM update
      requestAnimationFrame(() => {
        Stats.renderBarChart('chart-rating', stats.solvedByRating);
        Stats.renderHorizontalBarChart('chart-tags', stats.solvedByTag, {
          maxBars: 20,
          color: '#6366f1',
          colorEnd: '#a78bfa',
        });
        Stats.renderWeakness('weakness-container', stats.weakestTags);
        Stats.renderHeatmap('heatmap-container', stats.heatmapData);
      });

    } catch (err) {
      console.error('Stats error:', err);
      document.getElementById('stats-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon" style="display:none"></div>
          <h3>Error loading stats</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  // ─── Loading state ────────────────────────────────────────

  function _setLoading(loading) {
    const btn = document.getElementById('btn-generate');
    const spinner = document.getElementById('loading-spinner');

    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<span class="spinner-sm"></span> Generating...'
      : '⚡ Generate';

    spinner.style.display = loading ? 'flex' : 'none';
  }

  // ─── Shared URL handling ──────────────────────────────────

  function _checkSharedUrl() {
    const sharedKeys = Utils.decodeShareUrl();
    if (!sharedKeys) return;

    // We'll resolve these after the user generates (needs problemset data)
    // Store for later resolution
    window._pendingSharedKeys = sharedKeys;
    Utils.showToast('Shared set detected! Generate to load it.', 'info');
  }

  // ─── Export & Import Data ─────────────────────────────────

  function _handleExportData() {
    const data = {
      preferences: Storage.getPreferences(),
      savedSets: Storage.getSavedSets(),
      favorites: Storage.getFavorites()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cf-recommender-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showToast('Data exported successfully');
  }

  function _handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.preferences) localStorage.setItem('cf_rec_prefs', JSON.stringify(data.preferences));
        if (data.savedSets) localStorage.setItem('cf_rec_saved_sets', JSON.stringify(data.savedSets));
        if (data.favorites) localStorage.setItem('cf_rec_favs', JSON.stringify(data.favorites));
        
        Utils.showToast('Data imported successfully. Reloading...');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        console.error(err);
        Utils.showToast('Failed to import data: Invalid file format', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  // ─── Public methods for inline event handlers ─────────────

  function copyLink(url) {
    Utils.copyToClipboard(url).then(() => {
      Utils.showToast('Link copied!');
    });
  }

  function toggleFav(contestId, index) {
    const problem = allProblems.find(p => p.contestId === contestId && p.index === index)
      || currentProblems.find(p => p.contestId === contestId && p.index === index)
      || Storage.getFavorites().find(p => p.contestId === contestId && p.index === index);

    if (!problem) return;

    const added = Storage.toggleFavorite(problem);
    Utils.showToast(added ? 'Added to favorites ★' : 'Removed from favorites');

    // Re-render if we have current problems displayed
    if (currentProblems.length > 0) {
      _renderProblemCards(currentProblems, currentThemeTag);
    }
    _renderFavorites();
    _bindStopwatch();
  }

  function toggleSetExpand(setId) {
    const body = document.getElementById(`set-body-${setId}`);
    const set = body?.closest('.saved-set');
    if (body && set) {
      set.classList.toggle('saved-set--expanded');
    }
  }

  function deleteSet(setId) {
    if (!confirm('Delete this problem set?')) return;
    Storage.deleteSet(setId);
    _renderSavedSets();
    Utils.showToast('Set deleted');
  }

  async function refreshStats() {
    const handle = document.getElementById('handle-input').value.trim();
    if (!handle) return;
    try {
      Utils.showToast('Refreshing...', 'info', 1500);
      const submissions = await API.fetchUserSubmissions(handle, true);
      userAnalysis = Filters.analyzeSubmissions(submissions);
      _renderUserSummary(handle, userAnalysis);
      
      if (currentProblems.length > 0) {
        _renderProblemCards(currentProblems, currentThemeTag);
      }
      _renderVirtualSet();
      Utils.showToast('Stats updated');
    } catch (err) {
      console.error(err);
      Utils.showToast('Failed to refresh', 'error');
    }
  }


  function lapProblem(btn) {
    const time = Stopwatch.getFormattedTime();
    const lapDisplay = btn.nextElementSibling;
    if (lapDisplay) lapDisplay.textContent = time;
  }

  function _bindStopwatch() {
    document.getElementById('btn-virtual-pause')?.addEventListener('click', (e) => {
      const btn = e.target;
      if (Stopwatch.isRunning()) {
        Stopwatch.pause();
        btn.textContent = 'Resume';
        document.getElementById('btn-virtual-archive').style.display = 'block';
      } else {
        Stopwatch.start();
        btn.textContent = 'Pause';
        document.getElementById('btn-virtual-archive').style.display = 'none';
      }
    });

    document.getElementById('btn-virtual-archive')?.addEventListener('click', () => {
      if (!activeVirtualSet) return;
      activeVirtualSet.elapsedMs = Stopwatch.getElapsedMs();
      
      const sets = Storage.getSavedSets();
      const existingIdx = sets.findIndex(s => s.id === activeVirtualSet.id);
      if (existingIdx >= 0) {
        sets[existingIdx] = activeVirtualSet;
        Storage.saveSets(sets);
      } else {
        Storage.saveSet(activeVirtualSet);
      }
      
      Stopwatch.reset();
      activeVirtualSet = null;
      _renderVirtualSet();
      _switchTab('saved');
      _renderSavedSets();
      Utils.showToast('Virtual Set archived successfully!');
    });

    Stopwatch.setOnTick((ms) => {
      const display = document.getElementById('stopwatch-display');
      if (display) display.textContent = Utils.formatTime(ms);
    });
  }

  return {
    init,
    copyLink,
    toggleFav,
    toggleSetExpand,
    deleteSet,
    startVirtualSet,
    resumeVirtualSet,
    lapProblem,
    refreshStats,
  };
})();
