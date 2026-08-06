# Expert Clinic — Landing

Адаптивний сайт-лендінг у стилі iOS (Apple HIG) для медично-освітнього простору
**Expert Clinic** (дерматологія · дерматоонкологія · трихологія · косметологія).

## Стек

- HTML5 · CSS3 · Vanilla JS
- Шрифт: PT Sans (fallback: `-apple-system`, `SF Pro`, Helvetica)
- Кольори з брендбуку:
  - `#293F84` (PANTONE 294 C · синій)
  - `#656A6F` (PANTONE 431 C · темно-сірий)
  - `#B2B3B3` (PANTONE 429 C · світло-сірий)

## Дизайн

- iOS-естетика: `backdrop-filter: blur()` (frosted glass), радіуси 12–24 px, м'які багатошарові тіні
- Sticky glass-header, blob-градієнти в hero, reveal-on-scroll (IntersectionObserver)
- iOS-стилізований toast, що виїжджає зверху

## Структура

```
ExpertClinic/
├── index.html          # розмітка
├── style.css           # усі стилі
├── app.js              # інтерактив, форма, toast
└── assets/
    ├── logo.svg
    ├── logo-white.svg
    ├── favicon.svg
    └── images/
        ├── doctor-portrait.jpg
        └── price-cover.png
```

## Google Form

Форма «Що вас турбує?» надсилає дані асинхронно через прихований iframe.

**Замініть у `index.html`:**

1. `data-form-action="…/REPLACE_WITH_FORM_ID/formResponse"` → реальний URL вашої форми.
2. `name="entry.1111111111"` / `entry.2222222222` / `entry.3333333333` → відповідні
   `entry.XXXXXXX` з pre-filled link вашої Google Form.

Поки action не заповнено — форма працює в демо-режимі (показує toast без реального надсилання).

## Запуск локально

```sh
cd ExpertClinic
python3 -m http.server 8000
# → http://127.0.0.1:8000
```
