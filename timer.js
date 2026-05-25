'use strict';

// ============================================================
// STATE
// ============================================================
let currentMode = 'focus';
let running = false;
let secs = 0;
let sessionTotal = 0;
let focusTime = 25;
let restTime = 5;
let sessionCount = 4;
let completedSessions = 0;
let allDone = false;
let intervalId = null;
let activeTimeKey = null;
let activeTimeValue = 25;
let pendingSessionCount = null;

const TIME_CONFIG = {
  focus: { min: 5, max: 120, step: 1, unit: '분', label: '집중 시간', valId: 'focusTimeVal' },
  rest:  { min: 3, max: 60,  step: 1, unit: '분', label: '쉬는 시간', valId: 'restTimeVal'  },
  count: { min: 1, max: 10,  step: 1, unit: '회', label: '세션 횟수', valId: 'countVal'     },
};

// ============================================================
// localStorage 헬퍼
// ============================================================
function _load(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function _save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ============================================================
// THEME PALETTES
// ============================================================
const THEMES = {
  focus: {
    bg: '#EDE6F8', bgCard: '#F8F4FF',
    btnSec: '#E0D4F5', btnSecActive: '#D0BEF0',
    accent: '#9B6FD0', accentLight: '#B48EE0',
    accentPale: 'rgba(155,111,208,0.15)',
    waveBg: '#D8CCF0', waveBgRing: 'rgba(155,111,208,0.35)',
    waveFill: '#9B6FD0', waveFill2: '#8358C0',
    creamDark: '#C5B4DC',
    textPrimary: '#2E1F4A', textSecondary: '#5A4470', textMuted: '#8B72A8',
  },
  rest: {
    bg: '#DCF0E8', bgCard: '#EBF7F2',
    btnSec: '#C6E6DA', btnSecActive: '#B0DCCB',
    accent: '#3DA694', accentLight: '#6DC0B0',
    accentPale: 'rgba(109,192,176,0.20)',
    waveBg: '#C8E8DD', waveBgRing: 'rgba(109,192,176,0.40)',
    waveFill: '#6DC0B0', waveFill2: '#3DA694',
    creamDark: '#A8CFC2',
    textPrimary: '#1F3D36', textSecondary: '#3B5F55', textMuted: '#6B8A82',
  },
  done: {
    bg: '#FCE0EA', bgCard: '#FFEFF4',
    btnSec: '#F6CDD9', btnSecActive: '#F0B8C9',
    accent: '#C84A77', accentLight: '#E07399',
    accentPale: 'rgba(200,74,119,0.18)',
    waveBg: '#FAD0DC', waveBgRing: 'rgba(200,74,119,0.35)',
    waveFill: '#E07399', waveFill2: '#C84A77',
    creamDark: '#E5B8C8',
    textPrimary: '#3D1322', textSecondary: '#5A2840', textMuted: '#8B5A72',
  },
};

const SWATCH_THEMES = {
  '#EDE6F8': THEMES.focus,
  '#E8F4F0': {
    bg: '#E8F4F0', bgCard: '#F2FAF7',
    btnSec: '#D0E8DE', btnSecActive: '#B8DDD0',
    accent: '#3DA694', accentLight: '#6DC0B0',
    accentPale: 'rgba(109,192,176,0.20)',
    waveBg: '#C8E0D5', waveBgRing: 'rgba(109,192,176,0.40)',
    waveFill: '#6DC0B0', waveFill2: '#3DA694',
    creamDark: '#A8CFC2',
    textPrimary: '#1F3D36', textSecondary: '#3B5F55', textMuted: '#6B8A82',
  },
  '#FFF0F3': {
    bg: '#FFF0F3', bgCard: '#FFF8FA',
    btnSec: '#FAD8E0', btnSecActive: '#F5C5D0',
    accent: '#C84A77', accentLight: '#E07399',
    accentPale: 'rgba(200,74,119,0.18)',
    waveBg: '#FAD0DC', waveBgRing: 'rgba(200,74,119,0.35)',
    waveFill: '#E07399', waveFill2: '#C84A77',
    creamDark: '#E5B8C8',
    textPrimary: '#3D1322', textSecondary: '#5A2840', textMuted: '#8B5A72',
  },
  '#FFF8E8': {
    bg: '#FFF8E8', bgCard: '#FFFBF3',
    btnSec: '#FAE9C0', btnSecActive: '#F5D89A',
    accent: '#A87A18', accentLight: '#D4A030',
    accentPale: 'rgba(168,122,24,0.18)',
    waveBg: '#FAE5B0', waveBgRing: 'rgba(168,122,24,0.35)',
    waveFill: '#D4A030', waveFill2: '#A87A18',
    creamDark: '#E8D4A8',
    textPrimary: '#3D2A0E', textSecondary: '#5C4118', textMuted: '#8B6A38',
  },
  '#EAF2FF': {
    bg: '#EAF2FF', bgCard: '#F4F8FF',
    btnSec: '#CFE0F8', btnSecActive: '#B6CFF0',
    accent: '#2E6FB8', accentLight: '#5A95D8',
    accentPale: 'rgba(46,111,184,0.18)',
    waveBg: '#C5DEF5', waveBgRing: 'rgba(46,111,184,0.35)',
    waveFill: '#5A95D8', waveFill2: '#2E6FB8',
    creamDark: '#B8CDE8',
    textPrimary: '#152A4A', textSecondary: '#2E4A72', textMuted: '#5A7AA0',
  },
  '#F5F5F0': {
    bg: '#F5F5F0', bgCard: '#FBFBF7',
    btnSec: '#E6E6DE', btnSecActive: '#D4D4C8',
    accent: '#5A5440', accentLight: '#857D5E',
    accentPale: 'rgba(90,84,64,0.16)',
    waveBg: '#D8D4C0', waveBgRing: 'rgba(90,84,64,0.30)',
    waveFill: '#857D5E', waveFill2: '#5A5440',
    creamDark: '#CECABA',
    textPrimary: '#26221A', textSecondary: '#454132', textMuted: '#75705C',
  },
};

function applyPalette(t) {
  if (!t) return;
  const root = document.documentElement.style;
  root.setProperty('--bg', t.bg);
  root.setProperty('--bg-card', t.bgCard);
  root.setProperty('--btn-secondary', t.btnSec);
  root.setProperty('--btn-secondary-active', t.btnSecActive);
  root.setProperty('--blue-focus', t.accent);
  root.setProperty('--blue-light', t.accentLight);
  root.setProperty('--blue-pale', t.accentPale);
  root.setProperty('--wave-bg', t.waveBg);
  root.setProperty('--wave-bg-ring', t.waveBgRing);
  root.setProperty('--wave-fill', t.waveFill);
  root.setProperty('--wave-fill-2', t.waveFill2);
  root.setProperty('--wave-rest', t.waveFill);
  root.setProperty('--wave-rest-2', t.waveFill2);
  root.setProperty('--wave-done', t.waveFill);
  root.setProperty('--wave-done-2', t.waveFill2);
  root.setProperty('--cream-dark', t.creamDark);
  root.setProperty('--text-primary', t.textPrimary);
  root.setProperty('--text-secondary', t.textSecondary);
  root.setProperty('--text-muted', t.textMuted);
  document.body.style.background = t.bg;
}

function applyTheme(mode) {
  applyPalette(THEMES[mode] || THEMES.focus);
}

// ============================================================
// CLOCK
// ============================================================
function updateClock() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const el = document.getElementById('clockDisplay');
  if (el) el.textContent = h + ':' + m;
}

// ============================================================
// WAVE FILL
// ============================================================
function setWaveLevel(ratioRemaining) {
  let progress = 1 - ratioRemaining;
  progress = Math.max(0, Math.min(1, progress));
  const level = 8 + progress * 84;
  const wrap = document.getElementById('waveCircle');
  if (wrap) wrap.style.setProperty('--fill-level', level + '%');
}

// ============================================================
// CHECKLIST — 체크되지 않은 가장 위 항목 가져오기
// ============================================================
function getTopUncheckedTask() {
  const items = document.querySelectorAll('.check-item:not(.done-task)');
  if (!items.length) return null;
  const t = items[0].querySelector('.check-text');
  return t ? t.textContent.trim() : null;
}

// ============================================================
// SESSION BADGE — 체크리스트 연동
// ============================================================
function updateSessionBadge() {
  const badge = document.getElementById('sessionBadge');
  if (!badge) return;
  if (allDone || currentMode === 'done') {
    badge.textContent = '완료!';
  } else {
    const task = getTopUncheckedTask();
    badge.textContent = task !== null ? task : ('모든 할 일 완료');
  }
}

// ============================================================
// SESSION DOTS — 집중/휴식 화면 모두에 렌더링
// ============================================================
function updateDots() {
  // dot이 있는 모든 컨테이너에 적용 (타이머/휴식 화면 공통)
  document.querySelectorAll('.session-dots').forEach(container => {
    container.innerHTML = '';
    for (let i = 0; i < sessionCount; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i < completedSessions ? ' filled' : '');
      container.appendChild(dot);
    }
  });
  updateSessionBadge();
}

// ============================================================
// TIMER DISPLAY
// ============================================================
function updateTimerDisplay() {
  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = (secs % 60).toString().padStart(2, '0');
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = mm + ':' + ss;
}

// ============================================================
// TIMER ENGINE
// ============================================================
function startInterval() {
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (!running) { clearInterval(intervalId); return; }
    secs = Math.max(0, secs - 1);
    updateTimerDisplay();
    if (sessionTotal > 0) setWaveLevel(secs / sessionTotal);
    if (secs <= 0) {
      clearInterval(intervalId);
      running = false;
      handleTimerEnd();
    }
  }, 1000);
}

function isTimerScreenActive() {
  const s = document.getElementById('screen-timer');
  return s && s.classList.contains('active');
}

function handleTimerEnd() {
  // 알람음 + 진동 + TTS 음성 안내 (각 토글 따라 동작)
  function fire(message) {
    if (window.Alarm) window.Alarm.trigger({ message });
  }

  if (currentMode === 'focus') {
    // 집중 끝 → 카운트 없이 휴식 모달만 표시
    updateDots();
    fire('집중 시간이 끝났어요. 잠시 쉬어요.');
    showModal('focus-end');
  } else if (currentMode === 'rest') {
    // 휴식 끝 → 집중+휴식 한 세트 완료로 카운트
    completedSessions++;
    _save('completedSessions', completedSessions);
    if (completedSessions >= sessionCount) {
      allDone = true;
      _save('allDone', true);
      currentMode = 'done';
      _applyModeUI('done');
      updateDots();
      fire('오늘의 목표를 모두 끝냈어요. 수고했어요!');
      showModal('done');
    } else {
      updateDots();
      fire('쉬는 시간이 끝났어요. 다시 시작할까요?');
      showModal('rest-end');
    }
  }
}

// ============================================================
// TIMER CONTROLS
// ============================================================
function toggleTimer() {
  if (currentMode === 'done') { resetAll(); return; }
  running = !running;
  const btn = document.getElementById('mainBtn');
  if (running) {
    if (btn) btn.innerHTML = '<i class="fa fa-pause"></i>&nbsp; 멈춤';
    startInterval();
  } else {
    if (btn) btn.innerHTML = '<i class="fa fa-play"></i>&nbsp; 계속';
    clearInterval(intervalId);
  }
}

// 다시 시작: 모달 없이 현재 모드 타이머를 설정값으로 초기화
function resetTimer() {
  clearInterval(intervalId);
  running = false;
  secs = currentMode === 'rest' ? restTime * 60 : focusTime * 60;
  sessionTotal = secs;
  updateTimerDisplay();
  setWaveLevel(1);
  const btn = document.getElementById('mainBtn');
  if (btn) btn.innerHTML = '<i class="fa fa-play"></i>&nbsp; 시작';
}

function resetAll() {
  clearInterval(intervalId);
  running = false;
  completedSessions = 0;
  allDone = false;
  _save('completedSessions', 0);
  _save('allDone', false);
  currentMode = 'focus';
  secs = focusTime * 60;
  sessionTotal = secs;
  _applyModeUI('focus');
  updateTimerDisplay();
  setWaveLevel(1);
  updateDots();
  _highlightTab(0);
}

// ============================================================
// MODE TRANSITIONS
// ============================================================

// 집중 종료 모달 → 쉬기: 휴식 모드로 전환 후 자동 시작
function startRestMode(autoStart) {
  closeModal('focus-end');
  clearInterval(intervalId);
  running = false;
  currentMode = 'rest';
  secs = restTime * 60;
  sessionTotal = secs;
  _applyModeUI('rest');
  updateTimerDisplay();
  setWaveLevel(1);
  _highlightTab(1);
  if (autoStart) {
    running = true;
    const btn = document.getElementById('mainBtn');
    if (btn) btn.innerHTML = '<i class="fa fa-pause"></i>&nbsp; 멈춤';
    startInterval();
  }
}

// 집중 종료 모달 → 이어가기: 집중 모드 유지 + 자동 시작
function continueFocus() {
  closeModal('focus-end');
  clearInterval(intervalId);
  running = true;
  secs = focusTime * 60;
  sessionTotal = secs;
  updateTimerDisplay();
  setWaveLevel(1);
  const btn = document.getElementById('mainBtn');
  if (btn) btn.innerHTML = '<i class="fa fa-pause"></i>&nbsp; 멈춤';
  startInterval();
}

// 휴식 종료 모달 → 집중 시작하기: 집중 모드로 전환 후 자동 시작
function startFocusMode(autoStart) {
  closeModal('rest-end');
  clearInterval(intervalId);
  running = false;
  currentMode = 'focus';
  secs = focusTime * 60;
  sessionTotal = secs;
  _applyModeUI('focus');
  updateTimerDisplay();
  setWaveLevel(1);
  updateDots();
  _highlightTab(0);
  if (autoStart) {
    running = true;
    const btn = document.getElementById('mainBtn');
    if (btn) btn.innerHTML = '<i class="fa fa-pause"></i>&nbsp; 멈춤';
    startInterval();
  }
}

// 휴식 종료 모달 → 좀 더 쉬기: 집중 창으로 전환, 수동 시작
function continueRest() {
  closeModal('rest-end');
  clearInterval(intervalId);
  running = false;
  currentMode = 'focus';
  secs = focusTime * 60;
  sessionTotal = secs;
  _applyModeUI('focus');
  updateTimerDisplay();
  setWaveLevel(1);
  updateDots();
  _highlightTab(0);
}

// 완료 모달 → 새로 시작: 모든 값 초기화 후 집중 모드 (수동 시작)
function handleDoneReset() {
  closeModal('done');
  resetAll();
}

// ============================================================
// MODE UI 내부 헬퍼
// ============================================================
function _applyModeUI(mode) {
  const btn       = document.getElementById('mainBtn');
  const resetBtn  = document.getElementById('resetBtn');
  const wave      = document.getElementById('waveCircle');
  const doneTab   = document.getElementById('doneTab');
  const modeLabel = document.getElementById('modeLabel');

  if (wave) wave.className = 'wave-circle' + (mode !== 'focus' ? ' ' + mode : '');

  if (mode === 'focus') {
    if (btn) { btn.className = 'main-btn btn-focus'; btn.innerHTML = '<i class="fa fa-play"></i>&nbsp; 시작'; }
    if (resetBtn) resetBtn.style.display = '';
    if (doneTab) doneTab.classList.add('demo-tab-disabled');
    if (modeLabel) modeLabel.textContent = '천천히 한 번 해볼까요?';
    applyTheme('focus');
  } else if (mode === 'rest') {
    if (btn) { btn.className = 'main-btn btn-rest'; btn.innerHTML = '<i class="fa fa-play"></i>&nbsp; 시작'; }
    if (resetBtn) resetBtn.style.display = '';
    if (doneTab) doneTab.classList.add('demo-tab-disabled');
    if (modeLabel) modeLabel.textContent = '가볍게 스트레칭 후 편히 쉬어요!';
    applyTheme('rest');
  } else if (mode === 'done') {
    if (btn) { btn.className = 'main-btn btn-done'; btn.innerHTML = '<i class="fa fa-rotate-right"></i>&nbsp; 새로 시작'; }
    if (resetBtn) resetBtn.style.display = 'none';
    if (doneTab) doneTab.classList.remove('demo-tab-disabled');
    if (modeLabel) modeLabel.textContent = '오늘의 목표 달성! 수고했어요';
    applyTheme('done');
    _highlightTab(2);
  }

  updateSessionBadge();
}

function _highlightTab(idx) {
  document.querySelectorAll('.demo-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });
}

// ============================================================
// setMode (탭 버튼 onclick)
// ============================================================
function setMode(mode, tabEl) {
  if (mode === 'done' && !allDone) return;
  if (allDone && mode !== 'done') return;
  clearInterval(intervalId);
  running = false;
  currentMode = mode;
  secs = mode === 'focus' ? focusTime * 60 : (mode === 'rest' ? restTime * 60 : 0);
  sessionTotal = secs;
  _applyModeUI(mode);
  updateTimerDisplay();
  if (sessionTotal > 0) setWaveLevel(1);
  updateDots();
  document.querySelectorAll('.demo-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');
}

// ============================================================
// MODALS
// ============================================================
function showModal(name) {
  const el = document.getElementById('modal-' + name);
  if (el) el.classList.add('show');
}

function closeModal(name) {
  const el = document.getElementById('modal-' + name);
  if (el) el.classList.remove('show');
}

// ============================================================
// CHECKLIST
// ============================================================
function toggleCheck(item) {
  const box    = item.querySelector('.check-box');
  const isDone = item.classList.contains('done-task');
  if (isDone) {
    item.classList.remove('done-task');
    box.classList.remove('checked');
  } else {
    item.classList.add('done-task');
    box.classList.add('checked');
  }
  updateSessionBadge();
}

// ============================================================
// TIME PICKER SHEET
// ============================================================
function openTimeSheet(key) {
  activeTimeKey = key;
  const cfg = TIME_CONFIG[key];
  const el  = document.getElementById(cfg.valId);
  const cur = el ? parseInt(el.textContent, 10) : cfg.min;
  activeTimeValue = isNaN(cur) ? cfg.min : cur;

  document.getElementById('timeSheetTitle').textContent = cfg.label;
  document.getElementById('timeSheetUnit').textContent  = cfg.unit;
  document.getElementById('timeSheetValue').textContent = activeTimeValue;

  const slider = document.getElementById('timeSheetSlider');
  slider.min   = cfg.min;
  slider.max   = cfg.max;
  slider.step  = cfg.step;
  slider.value = activeTimeValue;

  document.getElementById('timeSheetMin').textContent = cfg.min + cfg.unit;
  document.getElementById('timeSheetMax').textContent = cfg.max + cfg.unit;

  showModal('time-sheet');
}

function adjustTime(delta) {
  if (!activeTimeKey) return;
  const cfg = TIME_CONFIG[activeTimeKey];
  activeTimeValue = Math.max(cfg.min, Math.min(cfg.max, activeTimeValue + delta * cfg.step));
  document.getElementById('timeSheetValue').textContent = activeTimeValue;
  document.getElementById('timeSheetSlider').value = activeTimeValue;
}

function onSliderInput(val) {
  if (!activeTimeKey) return;
  activeTimeValue = parseInt(val, 10);
  document.getElementById('timeSheetValue').textContent = activeTimeValue;
}

function saveTimeSheet() {
  if (!activeTimeKey) { closeModal('time-sheet'); return; }

  let originalValue = sessionCount;
  if (activeTimeKey === 'focus') originalValue = focusTime;
  if (activeTimeKey === 'rest')  originalValue = restTime;

  if (activeTimeValue !== originalValue && (completedSessions > 0 || running) && !allDone) {
    pendingSessionCount = activeTimeValue;
    closeModal('time-sheet');
    showModal('session-reset');
    return;
  }

  _applySavedTimeSheet();
  closeModal('time-sheet');
}

function _applySavedTimeSheet() {
  const cfg = TIME_CONFIG[activeTimeKey];
  const el  = document.getElementById(cfg.valId);
  if (el) el.textContent = activeTimeValue;

  if (activeTimeKey === 'focus') {
    focusTime = activeTimeValue;
    _save('focusTime', focusTime);
    if (currentMode === 'focus' && !running) {
      secs = focusTime * 60; sessionTotal = secs;
      updateTimerDisplay(); setWaveLevel(1);
    }
  } else if (activeTimeKey === 'rest') {
    restTime = activeTimeValue;
    _save('restTime', restTime);
    if (currentMode === 'rest' && !running) {
      secs = restTime * 60; sessionTotal = secs;
      updateTimerDisplay(); setWaveLevel(1);
    }
  } else if (activeTimeKey === 'count') {
    sessionCount = activeTimeValue;
    _save('sessionCount', sessionCount);
    completedSessions = Math.min(completedSessions, sessionCount);
    _save('completedSessions', completedSessions);
    updateDots();
  }
}

// 세션 초기화 확인
function confirmSessionReset() {
  if (pendingSessionCount !== null) {
    if (activeTimeKey === 'focus') {
      focusTime = pendingSessionCount;
      _save('focusTime', focusTime);
      const el = document.getElementById('focusTimeVal');
      if (el) el.textContent = focusTime;
    } else if (activeTimeKey === 'rest') {
      restTime = pendingSessionCount;
      _save('restTime', restTime);
      const el = document.getElementById('restTimeVal');
      if (el) el.textContent = restTime;
    } else if (activeTimeKey === 'count') {
      sessionCount = pendingSessionCount;
      _save('sessionCount', sessionCount);
      const el = document.getElementById('countVal');
      if (el) el.textContent = sessionCount;
    }

    completedSessions = 0;
    allDone = false;
    _save('completedSessions', 0);
    _save('allDone', false);

    clearInterval(intervalId);
    running = false;
    currentMode = 'focus';

    secs = focusTime * 60;
    sessionTotal = secs;

    _applyModeUI('focus');
    updateTimerDisplay();
    setWaveLevel(1);
    updateDots();
    _highlightTab(0);

    pendingSessionCount = null;
  }
  closeModal('session-reset');
}

// 세션 초기화 취소 — 변경 전 상태 유지
function cancelSessionReset() {
  pendingSessionCount = null;
  closeModal('session-reset');
}

// ============================================================
// INIT — DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  focusTime         = _load('focusTime',         25);
  restTime          = _load('restTime',           5);
  sessionCount      = _load('sessionCount',       4);
  completedSessions = _load('completedSessions',  0);
  allDone           = _load('allDone',            false);

  const fv = document.getElementById('focusTimeVal');
  const rv = document.getElementById('restTimeVal');
  const cv = document.getElementById('countVal');
  if (fv) fv.textContent = focusTime;
  if (rv) rv.textContent = restTime;
  if (cv) cv.textContent = sessionCount;

  const savedMode = _load('timerMode', 'focus');
  const savedSecs = _load('timerSecs', focusTime * 60);

  if (allDone) {
    currentMode  = 'done';
    secs         = 0;
    sessionTotal = focusTime * 60;
    _applyModeUI('done');
    _highlightTab(2);
  } else if (savedMode === 'rest') {
    currentMode  = 'rest';
    secs         = Math.min(savedSecs, restTime * 60);
    sessionTotal = restTime * 60;
    _applyModeUI('rest');
    _highlightTab(1);
  } else {
    currentMode  = 'focus';
    secs         = Math.min(savedSecs, focusTime * 60);
    sessionTotal = focusTime * 60;
    _applyModeUI('focus');
    _highlightTab(0);
  }

  updateTimerDisplay();
  if (sessionTotal > 0) setWaveLevel(secs / sessionTotal);
  updateDots();

  const savedBg = _load('bgColor', '');
  if (savedBg) {
    const swatch = [...document.querySelectorAll('.swatch')].find(s =>
      (s.getAttribute('onclick') || '').includes(savedBg)
    );
    if (swatch) {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      const t = SWATCH_THEMES[savedBg];
      if (t) applyPalette(t);
    }
  }

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('show');
    });
  });

  window.addEventListener('beforeunload', () => {
    _save('timerSecs',         secs);
    _save('timerMode',         currentMode);
    _save('completedSessions', completedSessions);
    _save('allDone',           allDone);
  });
});