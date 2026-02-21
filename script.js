document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initHeroLogoScale();
  initFixedOverlayCard();
  initMobileMenu();
  initCurrencyDropdown();
  initEditorialDropdown();
  initFaqTabs();
  initAccordionAnimation();
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

function initMobileMenu() {
  const toggle = document.querySelector('[data-mobile-menu-toggle]');
  const menu = document.querySelector('#primary-menu');
  const editorialItem = menu?.querySelector('.editorial-item');
  const editorialTrigger = editorialItem?.querySelector('.editorial-trigger');
  if (!toggle || !menu) return;

  const closeSelectors = '.menu > a, .menu .editorial-option';
  const mobileViewport = window.matchMedia('(max-width: 760px)');

  const setMobileEditorialState = (isOpen) => {
    if (!editorialItem || !editorialTrigger) return;
    editorialItem.classList.toggle('is-mobile-open', isOpen);
    setExpanded(editorialTrigger, isOpen);
  };

  const setOpenState = (isOpen) => {
    document.body.classList.toggle('mobile-menu-open', isOpen);
    setExpanded(toggle, isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    if (!isOpen) setMobileEditorialState(false);
  };

  toggle.addEventListener('click', () => {
    setOpenState(!document.body.classList.contains('mobile-menu-open'));
  });

  if (editorialTrigger && editorialItem) {
    editorialTrigger.addEventListener('click', (event) => {
      if (!mobileViewport.matches || !document.body.classList.contains('mobile-menu-open')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setMobileEditorialState(!editorialItem.classList.contains('is-mobile-open'));
    });
  }

  menu.querySelectorAll(closeSelectors).forEach((link) => {
    link.addEventListener('click', () => {
      setOpenState(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== ESCAPE_KEY) return;
    setOpenState(false);
  });

  const onViewportChange = () => {
    if (mobileViewport.matches) return;
    setOpenState(false);
  };

  setMobileEditorialState(false);
  mobileViewport.addEventListener('change', onViewportChange);
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
      if (lastScale !== 1) {
        lastScale = 1;
        heroLogo.style.setProperty('--hero-logo-scale', '1');
      }
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

  const targets = Array.from(cards)
    .map((card) => ({
      frame: card.querySelector('[data-fixed-overlay-frame]'),
      label: card.querySelector('[data-fixed-overlay-label]'),
    }))
    .filter((target) => target.frame && target.label);

  if (!targets.length) return;

  const update = () => {
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

  const syncOptions = () => {
    const currentValue = current.textContent.trim();
    options.forEach((option) => {
      const optionValue = (option.dataset.currencyValue || option.textContent).trim();
      option.classList.toggle('is-hidden', optionValue === currentValue);
    });
  };

  const open = () => {
    syncOptions();
    dropdown.classList.add('is-open');
    setExpanded(trigger, true);
  };

  const close = () => {
    dropdown.classList.remove('is-open');
    setExpanded(trigger, false);
  };

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
  const isMobileViewport = window.matchMedia('(max-width: 760px)');

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
    if (isMobileViewport.matches) return;
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
    if (isMobileViewport.matches) return;
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

  isMobileViewport.addEventListener('change', (event) => {
    if (!event.matches) return;
    pinnedByClick = false;
    hoveringTrigger = false;
    hoveringInner = false;
    close();
  });
}

function initFaqTabs() {
  const faqSection = document.querySelector('.faq');
  const tabButtons = Array.from(faqSection?.querySelectorAll('.faq-tags button') || []);
  const accordionRows = Array.from(faqSection?.querySelectorAll('.accordion details') || []);

  if (!tabButtons.length || !accordionRows.length) return;

  const faqContentByTopic = {
    ORDERS: [
      {
        question: 'HOW LONG DOES ORDER PROCESSING TAKE?',
        answer:
          'Orders are processed within 1-2 business days. You will receive a confirmation email once your order is packed and ready to ship.',
      },
      {
        question: 'CAN I MODIFY MY ORDER AFTER PAYMENT?',
        answer:
          'Changes can be made within 2 hours of purchase. Contact support with your order number and requested update as soon as possible.',
      },
      {
        question: 'DO YOU OFFER ORDER CANCELLATIONS?',
        answer:
          'Cancellations are available before dispatch. Once the parcel has shipped, cancellation is no longer possible and return terms apply.',
      },
    ],
    SHIPPING: [
      {
        question: 'DO YOU SHIP INTERNATIONALLY?',
        answer:
          'Yes, we ship worldwide. Delivery times vary by destination and are shown at checkout before you complete payment.',
      },
      {
        question: 'HOW CAN I TRACK MY SHIPMENT?',
        answer:
          'A tracking link is sent by email after dispatch. You can use it anytime to check current delivery status and transit updates.',
      },
      {
        question: 'ARE DUTIES AND TAXES INCLUDED?',
        answer:
          'Import duties and local taxes are calculated based on country rules. Any applicable charges are displayed at checkout when available.',
      },
    ],
    'RETURNS & EXCHANGES': [
      {
        question: 'WHAT IS YOUR RETURN POLICY?',
        answer:
          'Items can be returned within 14 days of receipt, provided they are unworn, unwashed, and in original condition with tags attached.',
      },
      {
        question: 'CAN I EXCHANGE FOR A DIFFERENT SIZE?',
        answer:
          'You can request a size exchange within 14 days if your preferred size is available. Contact support to confirm stock before sending your return.',
      },
      {
        question: 'ARE SALE ITEMS REFUNDABLE?',
        answer:
          'Sale items are final sale and not refundable, unless the item arrives damaged or you receive the wrong product.',
      },
    ],
    'SIZING & PRODUCTS': [
      {
        question: 'WHAT SIZE RANGE DO YOU OFFER?',
        answer:
          'Our collections are produced in selected size ranges that vary by product category. Exact size availability is shown on each product page.',
      },
      {
        question: 'HOW DO I CHOOSE THE RIGHT SIZE?',
        answer:
          'Use the size guide measurements and compare them with your body measurements or a similar garment to choose the best fit.',
      },
      {
        question: 'WHAT IF MY SIZE IS SOLD OUT?',
        answer:
          'If a size is currently unavailable, contact support for restock updates or recommended alternatives with a similar fit profile.',
      },
    ],
  };

  const setActiveButton = (activeButton) => {
    tabButtons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle('is-selected', isActive);
      button.setAttribute('aria-pressed', String(isActive));
      button.setAttribute('aria-selected', String(isActive));
    });
  };

  const updateAccordionContent = (topicKey) => {
    const entries = faqContentByTopic[topicKey];
    if (!entries) return;

    accordionRows.forEach((row, index) => {
      const summary = row.querySelector('summary');
      const paragraph = row.querySelector('p');
      const content = row.querySelector('.accordion-content');
      const entry = entries[index];

      if (!summary || !paragraph || !entry) return;
      summary.textContent = entry.question;
      paragraph.textContent = entry.answer;
      const isOpen = index === 0;
      row.open = isOpen;
      if (!content) return;
      content.style.height = isOpen ? 'auto' : '0px';
      content.style.opacity = isOpen ? '1' : '0';
    });
  };

  const selectTopic = (button) => {
    const topicKey = button.textContent.trim().toUpperCase();
    setActiveButton(button);
    updateAccordionContent(topicKey);
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectTopic(button);
    });
  });

  const defaultButton =
    tabButtons.find((button) => button.classList.contains('is-selected') || button.getAttribute('aria-pressed') === 'true') ||
    tabButtons[0];

  selectTopic(defaultButton);
}

function initAccordionAnimation() {
  const accordionRows = Array.from(document.querySelectorAll('.accordion details'));
  if (!accordionRows.length) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const transitionValue = 'height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease';

  const setImmediateState = (row, isOpen) => {
    const content = row.querySelector('.accordion-content');
    if (!content) return;
    row.open = isOpen;
    content.style.transition = '';
    content.style.height = isOpen ? 'auto' : '0px';
    content.style.opacity = isOpen ? '1' : '0';
  };

  accordionRows.forEach((row) => {
    setImmediateState(row, row.open);

    const summary = row.querySelector('summary');
    const content = row.querySelector('.accordion-content');
    if (!summary || !content) return;

    let isAnimating = false;

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (isAnimating) return;

      if (reduceMotionQuery.matches) {
        setImmediateState(row, !row.open);
        return;
      }

      if (row.open) {
        isAnimating = true;
        const startHeight = `${content.scrollHeight}px`;
        content.style.height = startHeight;
        content.style.opacity = '1';
        content.getBoundingClientRect();

        content.style.transition = transitionValue;
        content.style.height = '0px';
        content.style.opacity = '0';

        const onCollapseEnd = (transitionEvent) => {
          if (transitionEvent.propertyName !== 'height') return;
          content.removeEventListener('transitionend', onCollapseEnd);
          content.style.transition = '';
          row.open = false;
          isAnimating = false;
        };

        content.addEventListener('transitionend', onCollapseEnd);
        return;
      }

      isAnimating = true;
      row.open = true;
      content.style.height = '0px';
      content.style.opacity = '0';
      const targetHeight = `${content.scrollHeight}px`;
      content.getBoundingClientRect();

      content.style.transition = transitionValue;
      content.style.height = targetHeight;
      content.style.opacity = '1';

      const onExpandEnd = (transitionEvent) => {
        if (transitionEvent.propertyName !== 'height') return;
        content.removeEventListener('transitionend', onExpandEnd);
        content.style.transition = '';
        content.style.height = 'auto';
        isAnimating = false;
      };

      content.addEventListener('transitionend', onExpandEnd);
    });
  });

  window.addEventListener(
    'resize',
    rafThrottle(() => {
      accordionRows.forEach((row) => {
        if (!row.open) return;
        const content = row.querySelector('.accordion-content');
        if (!content) return;
        content.style.height = 'auto';
      });
    })
  );
}
