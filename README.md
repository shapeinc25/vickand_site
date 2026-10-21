# Vickand — сайт

Сайт Vickand: приложения и игры (`/`) и услуги UX & Design (`/ux/`).
Статический многостраничный сайт на чистых HTML / CSS / JavaScript, собирается [Vite](https://vite.dev).

## Быстрый старт

Нужен [Node.js](https://nodejs.org) 20.19+ (рекомендуется 22 LTS, см. `.nvmrc`).

```bash
npm install
```

```bash
npm run dev
```

Откроется http://localhost:5173 с автообновлением при правках.

| Команда           | Что делает                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`     | dev-сервер с hot reload                                                                      |
| `npm run build`   | production-сборка в `dist/` (минификация, хеши в именах файлов, `sitemap.xml`, `robots.txt`) |
| `npm run preview` | локально открыть собранный `dist/`                                                           |
| `npm run lint`    | ESLint (JS) + Stylelint (CSS)                                                                |
| `npm run format`  | отформатировать JS / CSS / JSON / MD через Prettier                                          |

## Страницы

| URL            | Файл                    | Скрипт-точка входа                                                                  |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `/`            | `index.html`            | `src/scripts/entries/apps.js`                                                       |
| `/ux/`         | `ux/index.html`         | `src/scripts/entries/ux.js`                                                         |
| `/terms/`      | `terms/index.html`      | `src/scripts/entries/legal.js`                                                      |
| `/privacy/`    | `privacy/index.html`    | `src/scripts/entries/legal.js`                                                      |
| `/styleguide/` | `styleguide/index.html` | `src/scripts/entries/styleguide.js` — библиотека компонентов, закрыта от индексации |
| 404            | `404.html`              | `src/scripts/entries/legal.js`                                                      |

Старые ссылки однофайловой версии (`/#ux`, `/#terms`, `/#privacy`) перенаправляются на новые страницы.

## Структура

```
├─ index.html, ux/, terms/, privacy/, styleguide/, 404.html   страницы
├─ src/
│  ├─ partials/        общие куски HTML: head (SEO-мета), header, footer, иконки
│  ├─ styles/
│  │  ├─ main.css      подключает все стили в правильном порядке каскада
│  │  ├─ base/         шрифты, токены (цвета тем), база, анимации, адаптив
│  │  ├─ components/   шапка, футер, переключатель, кнопки, поля, дропдаун
│  │  └─ pages/        стили секций страниц
│  ├─ scripts/
│  │  ├─ entries/      по одному файлу на страницу: подключает CSS и нужные модули
│  │  ├─ common/       общее поведение (переключатель страниц, шапка, анимации)
│  │  ├─ apps/         секции главной
│  │  └─ ux/           секции UX & Design
│  └─ assets/          шрифты, картинки, логотипы (Vite хеширует и оптимизирует)
├─ public/             копируется как есть: favicon, og-cover.png, manifest
├─ design/             исходники из Figma, скриншоты, прототипы — на сайт не попадают
└─ .github/workflows/  CI и деплой на GitHub Pages
```

### Partials

В HTML-страницах общий код вставляется комментарием:

```html
<!-- @include header.html {"toggleLabel": "Go to UX &amp; Design"} -->
```

Файл берётся из `src/partials/`, `{{имя}}` заменяется переданным значением.
Всегда доступны `{{base}}` (путь сайта, обычно `/`) и `{{siteUrl}}` (полный адрес сайта).
Реализация — плагин `partials()` в `vite.config.js`, без внешних зависимостей.

### Как добавить страницу

1. Создать `about/index.html` по образцу `terms/index.html` (head, header, footer через `@include`).
2. Создать `src/scripts/entries/about.js`, подключить в нём `../../styles/main.css` и нужные модули.
3. Добавить строку в `PAGES` в `vite.config.js` — страница попадёт в сборку и в `sitemap.xml`.

### Как добавить секцию

- Стили — новый файл в `src/styles/pages/` и `@import` в `src/styles/main.css` (порядок импортов = порядок каскада).
- Поведение — модуль в `src/scripts/apps/` или `src/scripts/ux/` и `import` в entry страницы.
- Картинки — в `src/assets/images/`, в HTML ссылаться как `/src/assets/images/имя.webp`.

## SEO

- У каждой страницы свои `title`, `description`, `canonical`, Open Graph и Twitter-карточка (`src/partials/head.html`).
- JSON-LD: `Organization` на главной, `Service` на `/ux/`.
- `sitemap.xml` и `robots.txt` генерируются при сборке; `/styleguide/` и 404 закрыты `noindex`.
- Адрес сайта задаётся переменной `SITE_URL` (по умолчанию `https://vickand.com/`), см. `.env.example`.

## Деплой на GitHub Pages

1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → **Variables**:
   - `SITE_URL` — публичный адрес со слешем в конце (`https://vickand.com/` или `https://<user>.github.io/<repo>/`);
   - `BASE_PATH` — `/` для своего домена или `/<repo>/` для адреса вида `<user>.github.io/<repo>/`.
3. Каждый пуш в `main` собирает и публикует сайт (`.github/workflows/deploy.yml`).
   На pull request запускаются линтеры и сборка (`ci.yml`).

## Что ещё не подключено

- Формы (подписка на игру, заявка на UX-ревью) работают только на клиенте и никуда не отправляют данные.
  Для отправки нужен бэкенд или сервис форм (например Formspree) — обработчики лежат в
  `src/scripts/apps/waitlist-form.js` и `src/scripts/ux/request-form.js`.
- Тексты Terms of Use и Privacy Policy — заглушки.
- Ссылки на Google Play / App Store пока `href="#"`.
