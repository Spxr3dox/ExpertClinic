/* ============================================================
   Expert Clinic — Landing
   - Sticky header shadow on scroll
   - Reveal on scroll (IntersectionObserver)
   - Google Form async submit (hidden iframe, no page reload)
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
    '.hero__content, .hero__visual, .card, .feature, .doctor, .section__head, .contact__intro, .form'
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

  /* ---------- Smooth in-page nav (also close focus) ---------- */
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
     Google Form async submit via hidden iframe
     ------------------------------------------------------------
     ⚠️  Замініть у index.html:
       1) data-form-action="..." → URL вашої форми (…/formResponse)
       2) name="entry.XXXXXXXXXX" у трьох input/textarea
     ============================================================ */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const hiddenFrame = document.getElementById('hiddenGoogleFrame');

  if (form) {
    // Створюємо/переносимо форму на прихований iframe, щоб не було редіректу.
    form.setAttribute('target', 'hiddenGoogleFrame');
    form.setAttribute('method', 'POST');

    form.addEventListener('submit', (e) => {
      const action = form.dataset.formAction || '';

      // Проста валідація
      const inputs = form.querySelectorAll('input[required], textarea[required]');
      let firstInvalid = null;
      inputs.forEach((inp) => {
        const invalid = !inp.value.trim();
        inp.classList.toggle('is-invalid', invalid);
        if (invalid && !firstInvalid) firstInvalid = inp;
      });
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        showToast({
          title: 'Заповніть, будь ласка, форму',
          text: 'Деякі поля порожні.',
          error: true,
        });
        return;
      }

      // Якщо action ще не налаштований — зупиняємо реальний submit і повідомляємо.
      if (!action || action.includes('REPLACE_WITH_FORM_ID')) {
        e.preventDefault();
        console.warn(
          '[Expert Clinic] Google Form action ще не налаштовано.\n' +
          '→ Оновіть data-form-action у index.html та поля name="entry.XXX".'
        );
        // Демо-режим: імітуємо успіх, щоб UX виглядав так само.
        simulateSuccess();
        return;
      }

      // Виставимо action безпосередньо перед submit
      form.setAttribute('action', action);

      // UI: показуємо спінер
      submitBtn?.classList.add('is-loading');

      // hidden iframe тригерне подію load після відправки — обробимо там.
      // (Google повертає HTML, який ми не можемо читати через CORS — це нормально.)
      // Форма вже має target=hiddenGoogleFrame, тому браузер сам виконає submit без перезавантаження.
    });

    // Прибирати is-invalid при вводі
    form.addEventListener('input', (e) => {
      if (e.target && e.target.classList) e.target.classList.remove('is-invalid');
    });
  }

  if (hiddenFrame) {
    let firstLoad = true;
    hiddenFrame.addEventListener('load', () => {
      // Перший 'load' зазвичай спрацьовує при ініціалізації порожнього iframe — пропускаємо.
      if (firstLoad) { firstLoad = false; return; }
      onFormSuccess();
    });
  }

  function onFormSuccess() {
    submitBtn?.classList.remove('is-loading');
    form?.reset();
    showToast({
      title: 'Дякуємо! Заявку прийнято.',
      text: 'Ми звʼяжемось з вами найближчим часом.',
    });
  }

  function simulateSuccess() {
    submitBtn?.classList.add('is-loading');
    setTimeout(() => {
      submitBtn?.classList.remove('is-loading');
      form?.reset();
      showToast({
        title: 'Дякуємо! (демо)',
        text: 'Форма ще не підключена до Google Form. Дивіться коментарі у коді.',
      });
    }, 900);
  }
})();
