const Stopwatch = (function() {
  let startTime = 0;
  let elapsedTime = 0;
  let timerInterval = null;
  let isRunning = false;
  let onTick = null;

  function start() {
    if (isRunning) return;
    isRunning = true;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      if (onTick) onTick(elapsedTime);
    }, 10);
  }

  function pause() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
  }

  function reset() {
    pause();
    elapsedTime = 0;
    if (onTick) onTick(0);
  }

  function toggle() {
    if (isRunning) pause();
    else start();
  }

  function getFormattedTime() {
    return Utils.formatTime(elapsedTime);
  }

  function getElapsedMs() {
    return elapsedTime;
  }

  function setElapsedTime(ms) {
    elapsedTime = ms;
    if (onTick) onTick(elapsedTime);
  }

  return {
    start,
    pause,
    reset,
    toggle,
    getFormattedTime,
    getElapsedMs,
    setElapsedTime,
    isRunning: () => isRunning,
    setOnTick: (fn) => { onTick = fn; }
  };
})();
