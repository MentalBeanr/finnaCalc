/*** ANIMATION SYSTEM — Finance Website ***/
;(function () {
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 0. REDUCED MOTION GATE
// All animation logic is skipped when the user has reduced-motion enabled.
// CSS keyframes are also gated via @media (prefers-reduced-motion: no-preference).
// ─────────────────────────────────────────────────────────────────────────────
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (REDUCED) return;

// Namespace for public helpers the React components can call
window.AnimationSystem = window.AnimationSystem || {};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GLOBAL CHART.JS DEFAULTS
// Chart.js is loaded lazily via dynamic import() inside React components, so
// it won't exist at script load time. Poll until it appears, then configure.
// ─────────────────────────────────────────────────────────────────────────────
let _chartDefaultsApplied = false;

function applyChartDefaults() {
  if (_chartDefaultsApplied || typeof window.Chart === 'undefined') return;
  _chartDefaultsApplied = true;
  window.Chart.defaults.animation.duration = 500;
  window.Chart.defaults.animation.easing = 'easeInOutQuart';
  if (window.Chart.defaults.transitions?.active) {
    window.Chart.defaults.transitions.active.animation.duration = 200;
  }
}

function pollForChart() {
  if (_chartDefaultsApplied) return;
  applyChartDefaults();
  if (!_chartDefaultsApplied) setTimeout(pollForChart, 600);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EASING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
const ease = {
  // Fast exit, used for entrances (approximates cubic-bezier(0.16,1,0.3,1))
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  // Material standard, used for state changes
  inOutCubic: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2,
  // Ease-in, used for exits
  easeIn: t => t * t,
};

// Generic rAF-based value tweener
// fn(value) is called each frame; returns a cancel handle
function tween(from, to, duration, easeFn, fn) {
  const start = performance.now();
  let rafId;
  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    fn(from + (to - from) * easeFn(t));
    if (t < 1) rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERSECTION OBSERVER SETUP
// One shared observer handles all scroll-triggered reveals + count-up triggers.
// Each element is unobserved once it animates in to prevent re-triggering.
// ─────────────────────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    revealObserver.unobserve(el);
    triggerReveal(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

function triggerReveal(el) {
  const delay = parseInt(el.dataset.animDelay || '0', 10);
  const type  = el.dataset.animType || 'fade-up';

  el.classList.remove('will-animate');
  el.style.animationDelay = delay + 'ms';
  el.classList.add('anim-' + type);

  // Count-up for numeric elements
  if (el.dataset.countupSetup) {
    setTimeout(() => triggerCountUp(el), delay);
  }

  // Progress bar width animation
  el.querySelectorAll('.progress-fill, [role="progressbar"] > div').forEach(bar => {
    setTimeout(() => animateProgressBar(bar), delay);
  });
  if (el.classList.contains('progress-fill')) {
    setTimeout(() => animateProgressBar(el), delay);
  }

  // Sparkline draw on scroll-reveal
  const spark = el.tagName === 'polyline' || el.tagName === 'path'
    ? el
    : el.querySelector('polyline, path.sparkline-path');
  if (spark) setTimeout(() => drawSparkline(spark), delay + 100);
}

// Section observer: updates active nav tab as user scrolls through sections
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && entry.target.id) {
      updateActiveNav(entry.target.id);
    }
  });
}, { threshold: 0.4 });

// ─────────────────────────────────────────────────────────────────────────────
// 4. PAGE LOAD SEQUENCES (Category 1)
// ─────────────────────────────────────────────────────────────────────────────

function animateNavEntrance() {
  const header = document.querySelector('header');
  if (!header) return;

  header.style.opacity = '0';
  header.style.transform = 'translateY(-8px)';
  // Force a paint before starting the transition
  requestAnimationFrame(() => requestAnimationFrame(() => {
    header.style.transition = 'opacity 250ms ease, transform 250ms ease';
    header.style.opacity = '1';
    header.style.transform = 'translateY(0)';

    // Stagger nav items after the header finishes
    const items = header.querySelectorAll('a, button');
    items.forEach((item, i) => {
      item.style.opacity = '0';
      setTimeout(() => {
        item.style.transition = 'opacity 200ms ease';
        item.style.opacity = '1';
        setTimeout(() => { item.style.transition = ''; }, 200);
      }, 250 + i * 40);
    });

    setTimeout(() => { header.style.transition = ''; }, 250);
  }));
}

function animateHeroEntrance() {
  const els = document.querySelectorAll('.hero-stat, .hero-number, .hero-title');
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    setTimeout(() => {
      el.style.transition = 'opacity 400ms cubic-bezier(0.16,1,0.3,1), transform 400ms cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      setTimeout(() => {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
        if (el.classList.contains('hero-number') || el.dataset.countup !== undefined) {
          triggerCountUp(el);
        }
      }, 400);
    }, i * 60);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SCROLL-TRIGGERED REVEALS (Category 2)
// Auto-applies will-animate + data attributes to matching selectors, then
// hands them to revealObserver. Skip elements already in the viewport.
// ─────────────────────────────────────────────────────────────────────────────

const REVEAL_TARGETS = [
  { sel: '.card, .stat-card, .strategy-card',        type: 'fade-up',   stagger: 0 },
  { sel: 'section > h2, section > .section-header',  type: 'fade-left', stagger: 0 },
  { sel: 'table tbody tr',                           type: 'fade-up',   stagger: 30 },
  { sel: '.chart-container, canvas',                 type: 'scale-in',  stagger: 0 },
  { sel: '.stat-number, .big-number',                type: 'fade-up',   stagger: 0 },
  { sel: '.tier-card, .etf-tab-content',             type: 'fade-up',   stagger: 60 },
  { sel: '.checklist-item, .step-card',              type: 'fade-left', stagger: 50 },
  { sel: '.glossary-card, .comparison-card',         type: 'fade-up',   stagger: 40 },
];

function setupScrollReveals() {
  REVEAL_TARGETS.forEach(({ sel, type, stagger }) => {
    let idx = 0;
    document.querySelectorAll(sel).forEach(el => {
      if (el.dataset.animSetup) return;
      el.dataset.animSetup = '1';
      el.dataset.animType  = type;
      el.dataset.animDelay = stagger ? String(idx++ * stagger) : '0';

      // Mark count-up targets
      if (el.classList.contains('stat-number') || el.classList.contains('big-number')) {
        el.dataset.countupSetup = '1';
      }

      // If already visible, reveal immediately with a tiny delay so CSS has time
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 40) {
        setTimeout(() => triggerReveal(el), 50 + (stagger ? idx * stagger : 0));
      } else {
        el.classList.add('will-animate');
        revealObserver.observe(el);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MICRO-INTERACTIONS (Category 3)
// Classes are injected via JS so the HTML stays untouched.
// ─────────────────────────────────────────────────────────────────────────────

function setupMicroInteractions() {
  // Hover lift on cards
  document.querySelectorAll('.card, .strategy-card, .etf-card, .glossary-card').forEach(el => {
    if (el.dataset.hoverDone) return;
    el.dataset.hoverDone = '1';
    el.classList.add('hover-lift');
  });

  // Scale on buttons
  document.querySelectorAll('button:not(#scroll-to-top), [role="button"]').forEach(el => {
    if (el.dataset.btnDone) return;
    el.dataset.btnDone = '1';
    el.classList.add('btn-scale');
  });

  // Translate on table rows
  document.querySelectorAll('tbody tr').forEach(el => {
    if (el.dataset.rowDone) return;
    el.dataset.rowDone = '1';
    el.classList.add('row-hover');
  });

  // Subtle scale on the parent wrapper of focused inputs
  document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea').forEach(el => {
    if (el.dataset.focusDone) return;
    el.dataset.focusDone = '1';
    const wrapper = el.parentElement;
    if (!wrapper || wrapper === document.body) return;
    el.addEventListener('focus', () => {
      wrapper.style.transition = 'transform 150ms ease';
      wrapper.style.transform = 'scale(1.005)';
    });
    el.addEventListener('blur', () => {
      wrapper.style.transition = 'transform 120ms ease';
      wrapper.style.transform = '';
      setTimeout(() => { wrapper.style.transition = ''; }, 120);
    });
  });

  // Checkbox spring: checkmark icon pops on check
  document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(el => {
    if (el.dataset.checkDone) return;
    el.dataset.checkDone = '1';
    el.addEventListener('change', () => {
      if (!el.checked) return;
      const icon = el.nextElementSibling
        || el.closest('.checklist-item')?.querySelector('svg, .check-icon, span');
      if (!icon) return;
      icon.animate(
        [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        { duration: 250, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' }
      );
    });
  });

  // Accordion expand/collapse with height animation + chevron rotation
  setupAccordions();

  // Sparkline draw on row hover
  document.querySelectorAll('tr, .sparkline-row').forEach(row => {
    if (row.dataset.sparkRowDone) return;
    row.dataset.sparkRowDone = '1';
    const path = row.querySelector('polyline, path.sparkline-path');
    if (!path) return;
    row.addEventListener('mouseenter', () => drawSparkline(path));
    row.addEventListener('mouseleave', () => {
      // Reset instantly on leave
      path.style.transition = 'none';
      path.style.strokeDashoffset = '0';
    });
  });

  // Range slider value readout pop
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    if (slider.dataset.sliderDone) return;
    slider.dataset.sliderDone = '1';
    const id = slider.id;
    const readout = id
      ? document.querySelector(`[data-slider-value="${id}"], #${id}-value, output[for="${id}"]`)
      : null;
    if (!readout) return;
    slider.addEventListener('input', () => {
      readout.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
        { duration: 200, easing: 'cubic-bezier(0.16,1,0.3,1)' }
      );
    });
  });
}

function setupAccordions() {
  // Handle <details> elements and any [data-accordion] pattern
  document.querySelectorAll('details').forEach(el => {
    if (el.dataset.accordionDone) return;
    el.dataset.accordionDone = '1';
    const summary = el.querySelector('summary');
    const chevron = summary?.querySelector('[data-chevron], svg, .chevron');
    if (chevron) chevron.classList.add('chevron-rotate');

    // We override the default toggle to animate the content
    summary?.addEventListener('click', e => {
      e.preventDefault();
      const isOpen = el.hasAttribute('open');
      const content = el.querySelector(':scope > *:not(summary)');
      if (!content) { el.open = !isOpen; return; }

      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 200ms cubic-bezier(0.4,0,1,1)';
        requestAnimationFrame(() => { content.style.maxHeight = '0'; });
        chevron?.classList.remove('open');
        setTimeout(() => {
          el.removeAttribute('open');
          content.style.maxHeight = '';
          content.style.overflow = '';
          content.style.transition = '';
        }, 200);
      } else {
        el.setAttribute('open', '');
        content.style.maxHeight = '0';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 300ms cubic-bezier(0.16,1,0.3,1)';
        requestAnimationFrame(() => { content.style.maxHeight = content.scrollHeight + 'px'; });
        chevron?.classList.add('open');
        setTimeout(() => {
          content.style.maxHeight = '';
          content.style.overflow = '';
          content.style.transition = '';
        }, 300);
      }
    });
  });

  // Handle generic [data-accordion-trigger] + [data-accordion-content] pairs
  document.querySelectorAll('[data-accordion-trigger]').forEach(trigger => {
    if (trigger.dataset.accordionDone) return;
    trigger.dataset.accordionDone = '1';
    const targetId = trigger.dataset.accordionTarget || trigger.getAttribute('aria-controls');
    const content = targetId
      ? document.getElementById(targetId)
      : trigger.nextElementSibling;
    const chevron = trigger.querySelector('[data-chevron], .chevron, svg');
    if (!content) return;
    if (chevron) chevron.classList.add('chevron-rotate');

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        content.style.transition = 'max-height 200ms cubic-bezier(0.4,0,1,1)';
        content.style.maxHeight = content.scrollHeight + 'px';
        content.style.overflow = 'hidden';
        requestAnimationFrame(() => { content.style.maxHeight = '0'; });
        trigger.setAttribute('aria-expanded', 'false');
        chevron?.classList.remove('open');
        setTimeout(() => {
          content.style.display = 'none';
          content.style.maxHeight = '';
          content.style.overflow = '';
          content.style.transition = '';
        }, 200);
      } else {
        content.style.display = '';
        content.style.maxHeight = '0';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 300ms cubic-bezier(0.16,1,0.3,1)';
        requestAnimationFrame(() => { content.style.maxHeight = content.scrollHeight + 'px'; });
        trigger.setAttribute('aria-expanded', 'true');
        chevron?.classList.add('open');
        setTimeout(() => {
          content.style.maxHeight = '';
          content.style.overflow = '';
          content.style.transition = '';
        }, 300);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. NUMBER & DATA ANIMATIONS (Category 4)
// ─────────────────────────────────────────────────────────────────────────────

// Parse the numeric value + decoration from strings like "$2.94T", "47.3%", "1,234"
function parseCountTarget(text) {
  let s = text.trim();
  let prefix = '', suffix = '';

  if (s.startsWith('$')) { prefix = '$'; s = s.slice(1); }
  if (s.startsWith('+')) { prefix += '+'; s = s.slice(1); }
  if (s.startsWith('-')) { prefix += '-'; s = s.slice(1); }

  // Trailing suffix: T, B, M, K, %, x
  const sfxMatch = s.match(/([TBMKkx%+])\s*$/i);
  if (sfxMatch) { suffix = sfxMatch[1]; s = s.slice(0, -sfxMatch[1].length).trim(); }

  s = s.replace(/,/g, '');
  const value = parseFloat(s);
  if (!isFinite(value)) return null;

  const decimals = (s.split('.')[1] || '').length;
  return { value, prefix, suffix, decimals };
}

function formatCountValue(v, meta) {
  const { prefix, suffix, decimals } = meta;
  let str;
  if (prefix.includes('$') && !suffix.match(/[TBMK]/i)) {
    // Full currency — commas, 2 decimals
    str = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
  } else if (suffix === '%') {
    str = v.toFixed(Math.max(decimals, 1));
  } else if (decimals > 0) {
    str = v.toFixed(decimals);
  } else {
    str = new Intl.NumberFormat('en-US').format(Math.round(v));
  }
  return prefix + str + suffix;
}

function triggerCountUp(el) {
  if (el.dataset.countupDone) return;
  el.dataset.countupDone = '1';

  const original = el.textContent || '';
  const meta = parseCountTarget(original);
  if (!meta) return;

  const duration = meta.value > 1000 ? 1200 : 800;

  tween(0, meta.value, duration, ease.outExpo, v => {
    el.textContent = formatCountValue(v, meta);
  });

  // Restore exact original after animation ends (handles rounding edge cases)
  setTimeout(() => { el.textContent = original; }, duration + 50);
}

function setupCountUps() {
  document.querySelectorAll('.stat-number, .big-number, .hero-number, [data-countup]').forEach(el => {
    if (el.dataset.countupSetup) return;
    el.dataset.countupSetup = '1';
    // Already in the viewport? Fire immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 20) {
      setTimeout(() => triggerCountUp(el), 50);
    } else {
      revealObserver.observe(el);
    }
  });
}

function animateProgressBar(bar) {
  if (!bar || bar.dataset.progressDone) return;
  bar.dataset.progressDone = '1';

  // Target comes from inline style, data-progress, or aria-valuenow
  const target = bar.dataset.progress
    || bar.style.width
    || (bar.getAttribute('aria-valuenow') != null
        ? bar.getAttribute('aria-valuenow') + '%'
        : null)
    || '0%';

  bar.style.width = '0%';
  // Defer so the reset width renders first
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = 'width 800ms cubic-bezier(0.16,1,0.3,1)';
    bar.style.width = target;
    setTimeout(() => { bar.style.transition = ''; }, 800);
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. LOADING & SKELETON STATES (Category 5)
// ─────────────────────────────────────────────────────────────────────────────

// Buttons with data-loading-action get a spinner on click for 1.5 s
function setupButtonLoaders() {
  document.querySelectorAll('button[data-loading-action]').forEach(btn => {
    if (btn.dataset.loaderDone) return;
    btn.dataset.loaderDone = '1';
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const saved = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = buildSpinnerSVG();
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = saved;
      }, 1500);
    });
  });
}

function buildSpinnerSVG() {
  return `<svg class="btn-loading-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6" opacity="0.25"/>
    <path d="M8 2a6 6 0 0 1 6 6"/>
  </svg>`;
}

// Skeleton-to-content transition helper (callable by React code)
function skeletonReveal(skeletonEl, contentEl, delay = 200) {
  skeletonEl.style.transition = 'opacity 200ms ease';
  setTimeout(() => {
    skeletonEl.style.opacity = '0';
    setTimeout(() => {
      skeletonEl.style.display = 'none';
      contentEl.style.opacity = '0';
      contentEl.style.display = '';
      requestAnimationFrame(() => {
        contentEl.style.transition = 'opacity 300ms ease';
        contentEl.style.opacity = '1';
        setTimeout(() => { contentEl.style.transition = ''; }, 300);
      });
    }, 200);
  }, delay);
}
window.AnimationSystem.skeletonReveal = skeletonReveal;

// ─────────────────────────────────────────────────────────────────────────────
// 9. DATA UPDATE ANIMATIONS (Category 6)
// Exposed on window.AnimationSystem so React components can call them.
// ─────────────────────────────────────────────────────────────────────────────

// Flash a DOM number when its value changes
function flashValue(el, isPositive) {
  el.classList.remove('flash-positive', 'flash-negative');
  void el.offsetWidth; // force reflow to restart the animation
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
    { duration: 300, easing: 'ease-out' }
  );
  el.classList.add(isPositive ? 'flash-positive' : 'flash-negative');
  setTimeout(() => el.classList.remove('flash-positive', 'flash-negative'), 600);
}
window.AnimationSystem.flashValue = flashValue;

// Stagger-in new table rows
function animateRowsIn(rows) {
  rows.forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateY(10px)';
    setTimeout(() => {
      row.style.transition = 'opacity 250ms ease, transform 250ms cubic-bezier(0.16,1,0.3,1)';
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
      setTimeout(() => { row.style.transition = ''; row.style.transform = ''; }, 250);
    }, i * 25);
  });
}
window.AnimationSystem.animateRowsIn = animateRowsIn;

// Fade-out rows before removal
function animateRowsOut(rows, onDone) {
  const tbody = rows[0]?.closest('tbody');
  if (tbody) tbody.style.overflow = 'hidden';
  rows.forEach(row => {
    row.style.transition = 'opacity 150ms ease, transform 150ms ease';
    row.style.opacity = '0';
    row.style.transform = 'translateY(-8px)';
  });
  setTimeout(() => {
    if (tbody) tbody.style.overflow = '';
    onDone?.();
  }, 150);
}
window.AnimationSystem.animateRowsOut = animateRowsOut;

// Crossfade between two tab panels
function swapTabContent(outgoing, incoming, onMid) {
  if (!outgoing || !incoming) { onMid?.(); return; }
  outgoing.style.transition = 'opacity 150ms ease, transform 150ms ease';
  outgoing.style.opacity = '0';
  outgoing.style.transform = 'translateX(-12px)';

  setTimeout(() => {
    onMid?.();
    outgoing.style.display = 'none';
    incoming.style.opacity = '0';
    incoming.style.transform = 'translateX(12px)';
    incoming.style.display = '';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      incoming.style.transition = 'opacity 250ms ease, transform 250ms cubic-bezier(0.16,1,0.3,1)';
      incoming.style.opacity = '1';
      incoming.style.transform = 'translateX(0)';
      setTimeout(() => {
        incoming.style.transition = '';
        incoming.style.transform = '';
        outgoing.style.opacity = '';
        outgoing.style.transform = '';
        outgoing.style.transition = '';
      }, 250);
    }));
  }, 150);
}
window.AnimationSystem.swapTabContent = swapTabContent;

// ─────────────────────────────────────────────────────────────────────────────
// 10. AMBIENT & CONTINUOUS ANIMATIONS (Category 7)
// All loops check document.hidden and pause accordingly.
// ─────────────────────────────────────────────────────────────────────────────

function setupMarketDot() {
  const dot = document.querySelector('.market-status-dot, [data-market-dot]');
  if (!dot) return;
  let anim = null;
  function startPulse() {
    anim?.cancel();
    anim = dot.animate(
      [
        { transform: 'scale(1)',   opacity: '1' },
        { transform: 'scale(1.4)', opacity: '0.4' },
        { transform: 'scale(1)',   opacity: '1' },
      ],
      { duration: 2000, easing: 'ease-in-out', iterations: Infinity }
    );
  }
  startPulse();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) anim?.pause(); else anim?.play();
  });
}

// Auto-scroll ticker bar: duplicates content for a seamless loop
let _tickerRaf = null;
function setupTickerScroll() {
  const bar = document.querySelector('.market-bar, .ticker-bar, [data-ticker-bar]');
  if (!bar) return;
  const inner = bar.querySelector('[data-ticker-inner]') || bar.firstElementChild;
  if (!inner || inner.scrollWidth <= bar.clientWidth) return;

  // Duplicate for seamless looping
  const clone = inner.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  bar.appendChild(clone);
  bar.style.overflow = 'hidden';

  const fullWidth = inner.scrollWidth;
  let pos = 0, paused = false;

  function tick() {
    if (!paused && !document.hidden) {
      pos = (pos + 0.4) % fullWidth;
      bar.scrollLeft = pos;
    }
    _tickerRaf = requestAnimationFrame(tick);
  }

  bar.addEventListener('mouseenter', () => { paused = true; }, { passive: true });
  bar.addEventListener('mouseleave', () => { paused = false; }, { passive: true });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  _tickerRaf = requestAnimationFrame(tick);
}

// Draw a sparkline path by animating stroke-dashoffset from full length → 0.
// The sparkline must have a computable path length (SVG polyline or path).
function drawSparkline(path, duration = 800) {
  if (!path || path.dataset.sparkDone) return;
  try {
    const len = path.getTotalLength();
    if (!isFinite(len) || len === 0) return;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.16,1,0.3,1)`;
    requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
    path.dataset.sparkDone = '1';
  } catch (_) {}
}

function initSparklines() {
  document.querySelectorAll('polyline, path.sparkline-path, .sparkline path, .sparkline polyline').forEach(el => {
    if (el.dataset.sparkDone) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      drawSparkline(el, 800);
    }
    // On-hover is handled by setupMicroInteractions' row listener
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. QUIZ ANIMATIONS (Category 8)
// Exposed on window.AnimationSystem for the risk quiz React component.
// ─────────────────────────────────────────────────────────────────────────────

// Slide between quiz questions. forward=true → left, forward=false → right
function quizStepTransition(outgoing, incoming, forward) {
  if (!outgoing || !incoming) return;
  const outX = forward ? '-24px' : '24px';
  const inX  = forward ?  '24px' : '-24px';

  outgoing.style.transition = 'opacity 200ms ease, transform 200ms ease';
  outgoing.style.opacity = '0';
  outgoing.style.transform = `translateX(${outX})`;

  setTimeout(() => {
    outgoing.style.display = 'none';
    incoming.style.opacity = '0';
    incoming.style.transform = `translateX(${inX})`;
    incoming.style.display = '';

    requestAnimationFrame(() => requestAnimationFrame(() => {
      incoming.style.transition = 'opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)';
      incoming.style.opacity = '1';
      incoming.style.transform = 'translateX(0)';
      setTimeout(() => {
        incoming.style.transition = '';
        outgoing.style.transition = '';
        outgoing.style.opacity = '';
        outgoing.style.transform = '';
      }, 280);
    }));
  }, 200);
}
window.AnimationSystem.quizStepTransition = quizStepTransition;

// Click feedback on a selected answer card, dims siblings
function selectAnswerCard(card, allCards) {
  card.animate(
    [{ transform: 'scale(0.97)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }],
    { duration: 200, easing: 'cubic-bezier(0.16,1,0.3,1)' }
  );
  allCards.forEach(c => {
    if (c === card) return;
    c.style.transition = 'opacity 150ms ease';
    c.style.opacity = '0.5';
  });
}
window.AnimationSystem.selectAnswerCard = selectAnswerCard;

// Vertical flip for a step counter number
function flipStepNumber(outEl, inEl) {
  if (!outEl || !inEl) return;
  outEl.style.transition = 'opacity 150ms ease, transform 150ms ease';
  outEl.style.opacity = '0';
  outEl.style.transform = 'translateY(-12px)';

  setTimeout(() => {
    outEl.style.display = 'none';
    inEl.style.opacity = '0';
    inEl.style.transform = 'translateY(12px)';
    inEl.style.display = '';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      inEl.style.transition = 'opacity 200ms ease, transform 200ms ease';
      inEl.style.opacity = '1';
      inEl.style.transform = 'translateY(0)';
      setTimeout(() => { inEl.style.transition = ''; }, 200);
    }));
  }, 150);
}
window.AnimationSystem.flipStepNumber = flipStepNumber;

// Full result banner reveal sequence
function revealResultBanner(triggerBtn, bannerEl) {
  // 1. Button press snap
  triggerBtn.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }],
    { duration: 180, easing: 'ease-out' }
  );
  const savedLabel = triggerBtn.innerHTML;
  triggerBtn.disabled = true;
  triggerBtn.innerHTML = buildSpinnerSVG();

  // 2. 500 ms fake load, then reveal
  setTimeout(() => {
    triggerBtn.disabled = false;
    triggerBtn.innerHTML = savedLabel;

    bannerEl.style.maxHeight = '0';
    bannerEl.style.overflow = 'hidden';
    bannerEl.style.opacity = '0';
    bannerEl.style.display = '';

    requestAnimationFrame(() => requestAnimationFrame(() => {
      bannerEl.style.transition = 'max-height 400ms cubic-bezier(0.16,1,0.3,1), opacity 400ms ease';
      bannerEl.style.maxHeight = bannerEl.scrollHeight + 'px';
      bannerEl.style.opacity = '1';

      setTimeout(() => {
        bannerEl.style.maxHeight = '';
        bannerEl.style.overflow = '';
        bannerEl.style.transition = '';

        // 3. Letter-by-letter profile name reveal
        const label = bannerEl.querySelector('[data-profile-label]');
        if (label) letterReveal(label);

        // 4. Pulse the recommended strategy card
        setTimeout(() => {
          const rec = document.querySelector('.strategy-card[data-recommended], .strategy-card.recommended');
          if (rec) {
            rec.animate(
              [{ transform: 'scale(1)' }, { transform: 'scale(1.01)' }, { transform: 'scale(1)' }],
              { duration: 400, delay: 0, easing: 'ease-out' }
            );
          }
        }, 200);
      }, 400);
    }));
  }, 500);
}
window.AnimationSystem.revealResultBanner = revealResultBanner;

// Stagger each character of an element's text with opacity
function letterReveal(el) {
  const chars = (el.textContent || '').split('');
  el.textContent = '';
  chars.forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.opacity = '0';
    span.style.display = 'inline-block';
    el.appendChild(span);
    setTimeout(() => {
      span.style.transition = 'opacity 150ms ease';
      span.style.opacity = '1';
    }, i * 30);
  });
}
window.AnimationSystem.letterReveal = letterReveal;

// ─────────────────────────────────────────────────────────────────────────────
// 12. SCROLL BEHAVIOR (Category 9)
// ─────────────────────────────────────────────────────────────────────────────

// Custom easing smooth-scroll for in-page anchor links
function smoothScrollTo(targetY, duration = 600) {
  const startY = window.scrollY;
  const dist = targetY - startY;
  tween(0, 1, duration, ease.inOutCubic, t => {
    window.scrollTo(0, startY + dist * t);
  });
}

function setupAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.dataset.anchorDone) return;
    link.dataset.anchorDone = '1';
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      smoothScrollTo(target.getBoundingClientRect().top + window.scrollY);
    });
  });
}
window.AnimationSystem.smoothScrollTo = smoothScrollTo;

// Nav shrink + scroll-to-top visibility, throttled via rAF
let _rafPending = false;
function setupScrollLinkedNav() {
  const header = document.querySelector('header');

  window.addEventListener('scroll', () => {
    if (_rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      const y = window.scrollY;

      // Nav shrink
      if (header) {
        if (y > 80) {
          header.style.transition = 'height 250ms ease';
          header.style.height = '48px';
          const logo = header.querySelector('img, [data-logo]');
          if (logo) logo.style.transform = 'scale(0.9)';
        } else {
          header.style.height = '';
          const logo = header.querySelector('img, [data-logo]');
          if (logo) logo.style.transform = '';
        }
      }

      // Scroll-to-top button
      const btn = document.getElementById('scroll-to-top');
      if (btn) btn.classList.toggle('visible', y > 400);
    });
  }, { passive: true });
}

function createScrollToTopBtn() {
  if (document.getElementById('scroll-to-top')) return;
  const btn = document.createElement('button');
  btn.id = 'scroll-to-top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"><polyline points="4 13 10 7 16 13"/></svg>`;
  btn.addEventListener('click', () => smoothScrollTo(0));
  document.body.appendChild(btn);
}

// Highlight the nav link matching the currently visible section
function updateActiveNav(sectionId) {
  document.querySelectorAll('nav a, header a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const matches = href === `#${sectionId}` || href.endsWith(`/${sectionId}`);
    a.classList.toggle('active', matches);
    if (matches) a.setAttribute('data-active', 'true');
    else a.removeAttribute('data-active');
  });
}

function setupSectionObserver() {
  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. INIT — wires everything up on DOMContentLoaded
// Uses a MutationObserver to re-run setup when React adds new nodes
// (e.g. after a client-side navigation or a filter re-renders a list).
// ─────────────────────────────────────────────────────────────────────────────

let _mutationDebounce = null;

function init() {
  // Chart.js — poll since it loads via dynamic import()
  pollForChart();

  // DOM scaffolding
  createScrollToTopBtn();

  // Page load sequences
  animateNavEntrance();
  animateHeroEntrance();

  // Scroll reveals (adds will-animate + starts observer)
  setupScrollReveals();

  // Micro-interactions
  setupMicroInteractions();

  // Count-ups for already-visible numbers
  setupCountUps();

  // Button loaders
  setupButtonLoaders();

  // Ambient
  setupMarketDot();
  setupTickerScroll();
  initSparklines();

  // Scroll behavior
  setupAnchorScroll();
  setupScrollLinkedNav();
  setupSectionObserver();

  // Re-run lightweight setup when React mutates the DOM
  const mo = new MutationObserver(() => {
    clearTimeout(_mutationDebounce);
    _mutationDebounce = setTimeout(() => {
      setupScrollReveals();
      setupMicroInteractions();
      setupAnchorScroll();
      setupButtonLoaders();
      setupAccordions();
      initSparklines();
      applyChartDefaults();
    }, 120);
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
