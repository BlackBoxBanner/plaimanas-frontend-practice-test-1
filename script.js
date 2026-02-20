document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initHeroLogoScale();
  initFixedOverlayCard();
  initCurrencyDropdown();
  initEditorialDropdown();
});

const ESCAPE_KEY = 'Escape';

function rafThrottle(fn) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      fn(...args);
    });
  };
}

function setExpanded(element, isExpanded) {
  element.setAttribute('aria-expanded', String(isExpanded));
}

function initReveal() {
  const revealItems = document.querySelectorAll('.reveal');
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((element) => observer.observe(element));
}

function initHeroLogoScale() {
  const hero = document.querySelector('.hero');
  const heroLogo = document.querySelector('.hero-logo');
  if (!hero || !heroLogo) return;
  const isMobileViewport = window.matchMedia('(max-width: 760px)');

  const startScale = 1;
  const endScale = 310 / 1400;
  let lastScale = -1;

  const updateScale = () => {
    if (isMobileViewport.matches) {
      heroLogo.style.setProperty('--hero-logo-scale', '1');
      return;
    }

    const endScroll = Math.max(1, hero.offsetHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / endScroll));
    const scale = startScale + (endScale - startScale) * progress;
    if (Math.abs(scale - lastScale) < 0.0005) return;

    lastScale = scale;
    heroLogo.style.setProperty('--hero-logo-scale', scale.toFixed(4));
  };

  const onViewportChange = rafThrottle(updateScale);
  updateScale();

  window.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange);
  isMobileViewport.addEventListener('change', onViewportChange);
}

function initFixedOverlayCard() {
  const cards = document.querySelectorAll('[data-fixed-overlay-card]');
  if (!cards.length) return;
  const header = document.querySelector('.top-nav');
  const isMobileViewport = window.matchMedia('(max-width: 760px)');

  const targets = Array.from(cards)
    .map((card) => ({
      frame: card.querySelector('[data-fixed-overlay-frame]'),
      label: card.querySelector('[data-fixed-overlay-label]'),
    }))
    .filter((target) => target.frame && target.label);

  if (!targets.length) return;

  const update = () => {
    if (isMobileViewport.matches) {
      targets.forEach(({ label }) => {
        label.style.setProperty('--overlay-feature-y', '50%');
      });
      return;
    }

    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const viewportAnchor = headerHeight + (window.innerHeight - headerHeight) * 0.32;

    targets.forEach(({ frame, label }) => {
      const rect = frame.getBoundingClientRect();
      const labelHeight = label.getBoundingClientRect().height || 0;
      const minCenterY = rect.height * 0.5;
      const maxCenterY = Math.max(minCenterY, rect.height - labelHeight * 0.5);
      const centerByViewport = viewportAnchor - rect.top;
      const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, centerByViewport));
      label.style.setProperty('--overlay-feature-y', `${clampedCenterY}px`);
    });
  };

  const onViewportChange = rafThrottle(update);
  update();

  window.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange);
  isMobileViewport.addEventListener('change', onViewportChange);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      onViewportChange();
    });
  }
}

function initCurrencyDropdown() {
  const dropdown = document.querySelector('[data-currency-dropdown]');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.currency-select');
  const current = dropdown.querySelector('[data-currency-current]');
  const options = dropdown.querySelectorAll('.currency-option');
  if (!trigger || !current || !options.length) return;

  let closeTimer = 0;

  const syncOptions = () => {
    const currentValue = current.textContent.trim();
    options.forEach((option) => {
      const optionValue = (option.dataset.currencyValue || option.textContent).trim();
      option.classList.toggle('is-hidden', optionValue === currentValue);
    });
  };

  const open = () => {
    window.clearTimeout(closeTimer);
    syncOptions();
    dropdown.classList.add('is-open');
    setExpanded(trigger, true);
  };

  const close = () => {
    window.clearTimeout(closeTimer);
    dropdown.classList.remove('is-open');
    setExpanded(trigger, false);
  };

  const closeWithDelay = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(close, 90);
  };

  dropdown.addEventListener('pointerenter', open);
  dropdown.addEventListener('pointerleave', closeWithDelay);
  dropdown.addEventListener('focusin', open);

  dropdown.addEventListener('focusout', (event) => {
    if (!dropdown.contains(event.relatedTarget)) close();
  });

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    dropdown.classList.contains('is-open') ? close() : open();
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      current.textContent = option.dataset.currencyValue || option.textContent.trim();
      syncOptions();
      close();
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!dropdown.contains(event.target)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== ESCAPE_KEY) return;
    close();
    trigger.blur();
  });

  syncOptions();
}

function initEditorialDropdown() {
  const item = document.querySelector('.editorial-item');
  const trigger = item?.querySelector('.editorial-trigger');
  const label = item?.querySelector('.editorial-label');
  const panel = item?.querySelector('.editorial-dropdown');
  const inner = item?.querySelector('.editorial-dropdown-inner');

  if (!item || !trigger || !label || !panel || !inner) return;

  let closeTimer = 0;
  let pinnedByClick = false;
  let hoveringTrigger = false;
  let hoveringInner = false;
  let innerPaddingLeft = 0;
  let optionPaddingLeft = 0;
  let lastLeft = '';
  let lastTop = '';

  const isOpen = () => item.classList.contains('is-open');
  const setEditorialOpenState = (openState) => {
    document.body.classList.toggle('editorial-open', openState);
  };

  const measureOffsets = () => {
    innerPaddingLeft = parseFloat(window.getComputedStyle(inner).paddingLeft) || 0;
    const firstOption = inner.querySelector('.editorial-option');
    optionPaddingLeft = firstOption
      ? parseFloat(window.getComputedStyle(firstOption).paddingLeft) || 0
      : 0;
  };

  const syncPosition = () => {
    if (!isOpen()) return;

    const triggerRect = trigger.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const nextLeft = `${Math.round(labelRect.left - innerPaddingLeft - optionPaddingLeft)}px`;
    const nextTop = `${Math.round(triggerRect.bottom)}px`;

    if (nextLeft !== lastLeft) {
      panel.style.setProperty('--editorial-left', nextLeft);
      lastLeft = nextLeft;
    }
    if (nextTop !== lastTop) {
      panel.style.setProperty('--editorial-top', nextTop);
      lastTop = nextTop;
    }
  };

  const syncPositionRaf = rafThrottle(syncPosition);

  const open = () => {
    window.clearTimeout(closeTimer);
    if (!isOpen()) {
      item.classList.add('is-open');
      setExpanded(trigger, true);
      setEditorialOpenState(true);
    }
    syncPosition();
    syncPositionRaf();
    window.requestAnimationFrame(syncPositionRaf);
  };

  const close = () => {
    window.clearTimeout(closeTimer);
    item.classList.remove('is-open');
    setExpanded(trigger, false);
    setEditorialOpenState(false);
  };

  const shouldStayOpen = () => pinnedByClick || hoveringTrigger || hoveringInner || item.matches(':focus-within');

  const closeIfAllowed = () => {
    if (shouldStayOpen()) return;
    close();
  };

  const closeWithDelay = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(closeIfAllowed, 110);
  };

  const movingTo = (event, element) =>
    event.relatedTarget instanceof Node && element.contains(event.relatedTarget);

  trigger.addEventListener('pointerenter', () => {
    hoveringTrigger = true;
    open();
  });
  trigger.addEventListener('pointerleave', (event) => {
    hoveringTrigger = false;
    if (movingTo(event, inner)) return;
    closeWithDelay();
  });

  inner.addEventListener('pointerenter', () => {
    hoveringInner = true;
    open();
  });
  inner.addEventListener('pointerleave', (event) => {
    hoveringInner = false;
    if (movingTo(event, trigger)) return;
    closeWithDelay();
  });

  item.addEventListener('focusin', open);
  item.addEventListener('focusout', () => {
    window.requestAnimationFrame(closeIfAllowed);
  });

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    if (isOpen() && pinnedByClick) {
      pinnedByClick = false;
      closeIfAllowed();
      return;
    }
    pinnedByClick = true;
    open();
  });

  panel.addEventListener('pointerdown', (event) => {
    if (event.target !== panel) return;
    pinnedByClick = false;
    hoveringTrigger = false;
    hoveringInner = false;
    close();
  });

  document.addEventListener('pointerdown', (event) => {
    if (item.contains(event.target)) return;
    pinnedByClick = false;
    hoveringTrigger = false;
    hoveringInner = false;
    close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== ESCAPE_KEY) return;
    pinnedByClick = false;
    hoveringTrigger = false;
    hoveringInner = false;
    close();
    trigger.blur();
  });

  const onViewportChange = rafThrottle(() => {
    if (!isOpen()) return;
    syncPosition();
  });

  window.addEventListener('resize', () => {
    measureOffsets();
    onViewportChange();
  });
  window.addEventListener(
    'scroll',
    () => {
      onViewportChange();
    },
    { passive: true }
  );

  measureOffsets();
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      if (!isOpen()) return;
      syncPositionRaf();
    });
    resizeObserver.observe(trigger);
    resizeObserver.observe(label);
  }
  trigger.addEventListener('transitionrun', syncPositionRaf);
  trigger.addEventListener('transitionend', syncPositionRaf);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      measureOffsets();
      onViewportChange();
    });
  }
}
