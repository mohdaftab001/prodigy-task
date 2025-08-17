(() => {
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const millisEl = document.getElementById('millis');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const lapBtn = document.getElementById('lapBtn');
  const clearLapsBtn = document.getElementById('clearLapsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const lapList = document.getElementById('lapList');

  // State
  let running = false;
  let startTime = 0;        // Epoch (performance.now) when started
  let elapsed = 0;          // Accumulated milliseconds
  let rafId = null;         // requestAnimationFrame id
  let lastLapElapsed = 0;   // elapsed at previous lap
  const laps = [];          // { index, timeMs, diffMs }

  function format(ms){
    const totalMs = Math.floor(ms);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const milli = totalMs % 1000;
    return {
      h, m, s, milli,
      h2: String(h).padStart(2,'0'),
      m2: String(m).padStart(2,'0'),
      s2: String(s).padStart(2,'0'),
      ms3: String(milli).padStart(3,'0')
    };
  }

  function render(ms){
    const f = format(ms);
    hoursEl.textContent = f.h2;
    minutesEl.textContent = f.m2;
    secondsEl.textContent = f.s2;
    millisEl.textContent = f.ms3;
  }

  function tick(){
    const now = performance.now();
    const ms = elapsed + (now - startTime);
    render(ms);
    rafId = requestAnimationFrame(tick);
  }

  function start(){
    if (running) return;
    running = true;
    startTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function pause(){
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    rafId = null;
    const now = performance.now();
    elapsed += (now - startTime);
    render(elapsed);
  }

  function reset(){
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    startTime = 0;
    elapsed = 0;
    lastLapElapsed = 0;
    render(0);
    laps.length = 0;
    drawLaps();
  }

  function lap(){
    const currentElapsed = running ? (elapsed + (performance.now() - startTime)) : elapsed;
    const diff = currentElapsed - lastLapElapsed;
    lastLapElapsed = currentElapsed;
    const item = {
      index: laps.length + 1,
      timeMs: currentElapsed,
      diffMs: diff
    };
    laps.push(item);
    drawLaps();
  }

  function drawLaps(){
    lapList.innerHTML = '';
    laps.slice().reverse().forEach((lapObj) => {
      const li = document.createElement('li');
      li.className = 'lap-item';

      const idx = document.createElement('div');
      idx.className = 'lap-index';
      idx.textContent = '#' + lapObj.index;

      const t = document.createElement('div');
      t.className = 'lap-time';
      const T = format(lapObj.timeMs);
      t.textContent = `${T.h2}:${T.m2}:${T.s2}.${T.ms3}`;

      const d = document.createElement('div');
      d.className = 'lap-diff';
      const D = format(lapObj.diffMs);
      d.textContent = `+${D.h2}:${D.m2}:${D.s2}.${D.ms3}`;

      li.appendChild(idx);
      li.appendChild(t);
      li.appendChild(d);
      lapList.appendChild(li);
    });
  }

  function exportCSV(){
    if (!laps.length){
      alert('No laps to export yet.');
      return;
    }
    const rows = [['Lap', 'Time (ms)', 'Time (hh:mm:ss.mmm)', 'Lap Diff (ms)', 'Lap Diff (hh:mm:ss.mmm)']];
    for(const lapObj of laps){
      const T = format(lapObj.timeMs);
      const D = format(lapObj.diffMs);
      const hhmmss = `${T.h2}:${T.m2}:${T.s2}.${T.ms3}`;
      const dd = `${D.h2}:${D.m2}:${D.s2}.${D.ms3}`;
      rows.push([lapObj.index, lapObj.timeMs, hhmmss, lapObj.diffMs, dd]);
    }
    const csv = rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laps.csv';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  // Event listeners
  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  resetBtn.addEventListener('click', reset);
  lapBtn.addEventListener('click', lap);
  exportBtn.addEventListener('click', exportCSV);
  clearLapsBtn.addEventListener('click', () => { laps.length = 0; drawLaps(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes((e.target.tagName||'').toUpperCase())) return;
    if (e.code === 'Space'){ e.preventDefault(); running ? pause() : start(); }
    if (e.key.toLowerCase() === 'l'){ lap(); }
    if (e.key.toLowerCase() === 'r'){ reset(); }
  });

  // Init
  render(0);
})();