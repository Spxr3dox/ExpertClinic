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
    '.hero__content, .hero__visual, .slider, .bento__hero, .bento__card, .doctor, .price-accordion, .price-card, .section__head, .contact__intro, .form'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            setTimeout(() => target.classList.add('is-in'), i * 60);
            io.unobserve(target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Services Slider ---------- */
  const slider = document.getElementById('servicesSlider');
  if (slider) {
    const track = slider.querySelector('.slider__track');
    const slides = slider.querySelectorAll('.slide');
    const prev = slider.querySelector('.slider__btn--prev');
    const next = slider.querySelector('.slider__btn--next');
    const dots = slider.querySelectorAll('.slider__dot');
    let index = 0;
    let autoTimer = null;

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === index));
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => go(index + 1), 6500);
    }
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    prev?.addEventListener('click', () => { go(index - 1); startAuto(); });
    next?.addEventListener('click', () => { go(index + 1); startAuto(); });
    dots.forEach((d) => d.addEventListener('click', () => {
      go(Number(d.dataset.index)); startAuto();
    }));

    // Swipe support (touch + mouse drag)
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

    // Пауза автогорту, коли курсор над слайдером
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    // Клавіатура
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { go(index - 1); startAuto(); }
      if (e.key === 'ArrowRight') { go(index + 1); startAuto(); }
    });
    slider.setAttribute('tabindex', '0');

    go(0);
    startAuto();
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
