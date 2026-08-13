/* ============================================================
   Expert Clinic — Landing
   - Sticky header shadow on scroll
   - Reveal on scroll (IntersectionObserver)
   - Form submission → Google Sheets via Apps Script Web App
   - iOS-style toast notifications
   ============================================================ */

(() => {
  'use strict';

  /* ---------- Year in footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header shadow ---------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll(
    '.slider, .bento__hero, .bento__card, .doctor, .doctor-mini, .blog-cta, .prices-accordion__item, .section__head, .contact__intro, .form, .prices-group, .equip, .faq__item, .about-video__player, .about-video__content, .stat-card, .ba-slider, .ig-tile, .ig-head'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  // Каскадні затримки для елементів у одному контейнері
  const cascadeContainers = [
    '.bento__grid', '.doctors', '.doctors-compact', '.prices-accordion'
  ];
  cascadeContainers.forEach((sel) => {
    document.querySelectorAll(sel).forEach((container) => {
      let idx = 0;
      Array.from(container.children).forEach((child) => {
        if (child.classList.contains('reveal')) {
          child.style.setProperty('--i', idx);
          child.classList.add('reveal--cascade');
          idx++;
        }
      });
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Number counter (hero stats) ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      el.textContent = Math.round(target * easeOut(p)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Button ripple hover follow ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
      btn.style.setProperty('--y', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

  /* ---------- Smooth accordion open/close ---------- */
  document.querySelectorAll('.prices-accordion__item').forEach((item) => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.prices-accordion__body');
    if (!summary || !body) return;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = item.hasAttribute('open');

      if (isOpen) {
        // Закриваємо: спочатку встановити явну висоту, потім 0
        body.style.height = body.scrollHeight + 'px';
        // force reflow
        void body.offsetHeight;
        body.style.height = '0px';
        body.addEventListener('transitionend', function onEnd() {
          item.removeAttribute('open');
          body.removeEventListener('transitionend', onEnd);
        }, { once: true });
      } else {
        // Відкриваємо
        item.setAttribute('open', '');
        body.style.height = '0px';
        void body.offsetHeight;
        body.style.height = body.scrollHeight + 'px';
        body.addEventListener('transitionend', function onEnd() {
          body.style.height = 'auto';
          body.removeEventListener('transitionend', onEnd);
        }, { once: true });
      }
    });
  });

  /* ---------- Smooth in-page nav ---------- */

  /* ---------- Services Slider ---------- */
  const slider = document.getElementById('servicesSlider');
  if (slider) {
    const track = slider.querySelector('.slider__track');
    const slides = slider.querySelectorAll('.slide');
    const prev = slider.querySelector('.slider__btn--prev');
    const next = slider.querySelector('.slider__btn--next');
    const dots = slider.querySelectorAll('.slider__dot');
    const progress = slider.querySelector('#sliderProgress');
    const AUTO_MS = 7000;
    let index = 0;
    let autoTimer = null;
    let progressRAF = null;
    let progressStart = 0;

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === index));
      slides.forEach((s, k) => s.classList.toggle('is-current', k === index));
      restartProgress();
    }

    function restartProgress() {
      if (!progress) return;
      cancelAnimationFrame(progressRAF);
      progressStart = performance.now();
      progress.style.width = '0%';
      const tick = (now) => {
        const p = Math.min(1, (now - progressStart) / AUTO_MS);
        progress.style.width = (p * 100) + '%';
        if (p < 1) progressRAF = requestAnimationFrame(tick);
      };
      progressRAF = requestAnimationFrame(tick);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => go(index + 1), AUTO_MS);
      restartProgress();
    }
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
      cancelAnimationFrame(progressRAF);
    }

    prev?.addEventListener('click', () => { go(index - 1); startAuto(); });
    next?.addEventListener('click', () => { go(index + 1); startAuto(); });
    dots.forEach((d) => d.addEventListener('click', () => {
      go(Number(d.dataset.index)); startAuto();
    }));

    // Swipe support (touch)
    let startX = 0, dx = 0, dragging = false;
    const onDown = (x) => { dragging = true; startX = x; dx = 0; stopAuto(); };
    const onMove = (x) => { if (dragging) dx = x - startX; };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
      startAuto();
    };
    slider.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX), { passive: true });
    slider.addEventListener('touchmove',  (e) => onMove(e.touches[0].clientX), { passive: true });
    slider.addEventListener('touchend',   onUp);

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { go(index - 1); startAuto(); }
      if (e.key === 'ArrowRight') { go(index + 1); startAuto(); }
    });
    slider.setAttribute('tabindex', '0');

    go(0);
    startAuto();
  }

  /* ---------- Before / After slider ---------- */
  const baSlider = document.getElementById('baSlider');
  const baRange = document.getElementById('baRange');
  if (baSlider && baRange) {
    const setPos = (pct) => {
      pct = Math.max(0, Math.min(100, pct));
      baSlider.style.setProperty('--ba-pos', pct + '%');
      baRange.value = pct;
    };
    baRange.addEventListener('input', () => setPos(Number(baRange.value)));

    // Drag-to-move
    let dragging = false;
    const setFromEvent = (clientX) => {
      const rect = baSlider.getBoundingClientRect();
      setPos(((clientX - rect.left) / rect.width) * 100);
    };
    baSlider.addEventListener('mousedown', (e) => {
      dragging = true; setFromEvent(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (dragging) setFromEvent(e.clientX);
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    baSlider.addEventListener('touchstart', (e) => {
      setFromEvent(e.touches[0].clientX);
    }, { passive: true });
    baSlider.addEventListener('touchmove', (e) => {
      setFromEvent(e.touches[0].clientX);
    }, { passive: true });

    setPos(50);

    // Case switcher
    const caseBtns = document.querySelectorAll('.ba-case');
    const baBefore = document.getElementById('baBefore');
    const baAfter  = document.getElementById('baAfter');
    caseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.case;
        caseBtns.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        if (baBefore) baBefore.src = `assets/images/ba-${c}-before.jpg`;
        if (baAfter)  baAfter.src  = `assets/images/ba-${c}-after.jpg`;
        setPos(50);
      });
    });
  }

  /* ---------- Clinic video controls ---------- */
  const clinicVideo = document.getElementById('clinicVideo');
  const clinicWrap  = document.getElementById('clinicVideoWrap');
  const unmuteBtn   = document.getElementById('videoUnmuteBtn');
  const playBtn     = document.getElementById('videoPlayBtn');

  const iconMuted = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 9v6h4l6 4V5L8 9H4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m17 8 5 8m0-8-5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const iconLive  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 9v6h4l6 4V5L8 9H4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 9c1.5 1 1.5 5 0 6M20 6c3 2 3 10 0 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  if (clinicVideo && clinicWrap) {
    unmuteBtn?.addEventListener('click', () => {
      clinicVideo.muted = !clinicVideo.muted;
      unmuteBtn.setAttribute('aria-label', clinicVideo.muted ? 'Увімкнути звук' : 'Вимкнути звук');
      unmuteBtn.innerHTML = clinicVideo.muted ? iconMuted : iconLive;
    });
    playBtn?.addEventListener('click', () => {
      if (clinicVideo.paused) clinicVideo.play();
      else                    clinicVideo.pause();
    });
    clinicVideo.addEventListener('play',  () => clinicWrap.classList.remove('is-paused'));
    clinicVideo.addEventListener('pause', () => clinicWrap.classList.add('is-paused'));

    // Пауза відео поза viewport (економія батареї на мобільних)
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) clinicVideo.play().catch(() => {});
          else                  clinicVideo.pause();
        });
      }, { threshold: 0.25 });
      vio.observe(clinicWrap);
    }
  }

  /* ---------- Smooth in-page nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ============================================================
     iOS-style Toast
     ============================================================ */
  const toast = document.getElementById('toast');
  const toastTitle = toast?.querySelector('.toast__title');
  const toastText  = toast?.querySelector('.toast__text');
  let toastTimer;

  function showToast({ title, text, error = false, duration = 3800 } = {}) {
    if (!toast) return;
    if (toastTitle && title) toastTitle.textContent = title;
    if (toastText && text)   toastText.textContent  = text;
    toast.classList.toggle('toast--error', !!error);
    toast.classList.add('is-visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), duration);
  }

  /* ============================================================
     Form submission → Google Sheets (Apps Script Web App)
     ------------------------------------------------------------
     🚩 У index.html на <form> має бути:
        data-endpoint="https://script.google.com/macros/s/…/exec"
     Скрипт для Apps Script — див. docs/apps-script.gs
     ============================================================ */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Валідація обовʼязкових полів
      const inputs = form.querySelectorAll('input[required], textarea[required]');
      let firstInvalid = null;
      inputs.forEach((inp) => {
        const invalid = !inp.value.trim();
        inp.classList.toggle('is-invalid', invalid);
        if (invalid && !firstInvalid) firstInvalid = inp;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showToast({
          title: 'Заповніть, будь ласка, форму',
          text: 'Деякі поля порожні.',
          error: true,
        });
        return;
      }

      const endpoint = form.dataset.endpoint || '';

      // Демо-режим, якщо endpoint ще не налаштований
      if (!endpoint || endpoint.includes('REPLACE_WITH_APPS_SCRIPT_URL')) {
        console.warn(
          '[Expert Clinic] Endpoint Apps Script Web App не налаштовано.\n' +
          '→ У index.html оновіть data-endpoint="…" на URL вашого Web App.'
        );
        simulateSuccess();
        return;
      }

      submitBtn?.classList.add('is-loading');

      try {
        // URLSearchParams → application/x-www-form-urlencoded — "simple" request,
        // без preflight, працює з Google Apps Script.
        const body = new URLSearchParams(new FormData(form));

        await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',      // Apps Script Web App повертає opaque response — це нормально
          body,
        });

        // З no-cors ми не бачимо статусу відповіді; якщо fetch не кинув — вважаємо успіхом.
        submitBtn?.classList.remove('is-loading');
        form.reset();
        showToast({
          title: 'Дякуємо! Заявку прийнято.',
          text: 'Ми звʼяжемось з вами найближчим часом.',
        });
      } catch (err) {
        console.error('[Expert Clinic] Submit error:', err);
        submitBtn?.classList.remove('is-loading');
        showToast({
          title: 'Не вдалось надіслати',
          text: 'Перевірте зʼєднання і спробуйте ще раз.',
          error: true,
        });
      }
    });

    form.addEventListener('input', (e) => {
      if (e.target && e.target.classList) e.target.classList.remove('is-invalid');
    });
  }

  function simulateSuccess() {
    submitBtn?.classList.add('is-loading');
    setTimeout(() => {
      submitBtn?.classList.remove('is-loading');
      form?.reset();
      showToast({
        title: 'Дякуємо! (демо)',
        text: 'Endpoint ще не підключено. Дивіться docs/apps-script.gs.',
      });
    }, 900);
  }
})();
