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

Страницы лежат в `src/pages/`, их адреса повторяют папки.

| URL            | Файл (в `src/pages/`)   | Скрипт (в `src/scripts/entries/`) | Стили (в `src/styles/`) |
| -------------- | ----------------------- | --------------------------------- | ----------------------- |
| `/`            | `index.html`            | `apps.js`                         | `apps.css`              |
| `/ux/`         | `ux/index.html`         | `ux.js`                           | `ux.css`                |
| `/terms/`      | `terms/index.html`      | `legal.js`                        | `legal.css`             |
| `/privacy/`    | `privacy/index.html`    | `legal.js`                        | `legal.css`             |
| `/styleguide/` | `styleguide/index.html` | `styleguide.js`                   | `styleguide.css`        |
| 404            | `404.html`              | `legal.js`                        | `legal.css`             |

`/styleguide/` — библиотека компонентов (кнопки, поля, дропдауны, иконки), закрыта от индексации.

Старые ссылки однофайловой версии (`/#ux`, `/#terms`, `/#privacy`) перенаправляются на новые страницы.

## Структура

```
├─ src/
│  ├─ pages/              HTML-страницы (index.html, ux/, terms/, privacy/, styleguide/, 404.html)
│  ├─ partials/
│  │  ├─ layout/          head (SEO-мета), header, header-legal, footer
│  │  ├─ components/      повторяющиеся блоки: карточка карусели, блок игры, искорка
│  │  └─ icons/           иконки (стрелки, галочка) и SVG-спрайт
│  ├─ styles/
│  │  ├─ apps.css, ux.css, legal.css, styleguide.css   набор стилей каждой страницы
│  │  ├─ base/            шрифты, токены (цвета тем), база, общие анимации, адаптив
│  │  ├─ components/      шапка, футер, переключатель, hero, макет телефона, кнопки, поля, дропдаун
│  │  └─ pages/apps/, pages/ux/   по файлу на секцию страницы
│  ├─ scripts/
│  │  ├─ entries/         по файлу на страницу: подключает её стили и модули
│  │  ├─ common/          общее поведение (переключатель страниц, шапка, пауза анимаций вне экрана)
│  │  ├─ apps/            секции главной; counter-card/ — карточка Coming Soon и три мини-игры
│  │  └─ ux/              секции UX & Design; tangled-flows/ — анимация первого экрана
│  └─ assets/             шрифты, картинки, логотипы (Vite хеширует и оптимизирует)
├─ public/                копируется как есть: favicon, og-cover.png, manifest
├─ design/                исходники из Figma, скриншоты, прототипы — на сайт не попадают
└─ .github/workflows/     Проверки CI
```

### Partials

Общий HTML вставляется в страницы комментарием:

```html
<!-- @include layout/header.html {"toggleLabel": "Go to UX &amp; Design"} -->
<!-- @include components/product.html {"title": "Flying Ladders", "description": "…", "appStore": "https://…"} -->
```

Файл берётся из `src/partials/`, `{{имя}}` заменяется переданным значением. Значения по умолчанию partial
объявляет в первой строке: `<!-- @defaults {"title": "[Title]"} -->`. Partials могут включать другие partials.
Всегда доступны `{{base}}` (путь сайта, обычно `/`) и `{{siteUrl}}` (полный адрес сайта).
Пути к файлам из `src/` пишутся как `src="@/assets/images/имя.webp"` — с любой страницы.
Реализация — плагин `partials()` в `vite.config.js`, без внешних зависимостей.

### Стили

У каждой страницы свой набор: `src/styles/apps.css` и т. д. Это список `@import` в порядке каскада:
база → общие компоненты → секции страницы сверху вниз. Порядок важен: правило ниже перекрывает правило выше
при равной специфичности. Новый файл секции ставится в набор на место, соответствующее секции на странице.

### Как добавить страницу

1. Создать `src/pages/about/index.html` по образцу `src/pages/terms/index.html` (head, header, footer через `@include`).
2. Создать `src/styles/about.css` (набор `@import`) и `src/scripts/entries/about.js`, который подключает этот CSS и нужные модули.
3. Добавить строку в `PAGES` в `vite.config.js` — страница попадёт в сборку и в `sitemap.xml`.

### Как добавить секцию

- Разметка — в HTML страницы; повторяющиеся блоки — partial в `src/partials/components/`.
- Стили — файл в `src/styles/pages/<страница>/` и `@import` в набор страницы.
- Поведение — модуль в `src/scripts/apps/` или `src/scripts/ux/` и `import` в entry страницы.

### Как добавить игру на главную

Блоки игр — partial `src/partials/components/product.html`. В `src/pages/index.html` заменить заглушку на:

```html
<!-- @include components/product.html {"title": "Flying Ladders", "description": "…", "googlePlay": "https://…", "appStore": "https://…"} -->
```

## Скорость

- Картинки в WebP и под размер показа; всё, что ниже первого экрана, грузится лениво (`loading="lazy"`).
- Шрифты — подмножества: основная латиница (~28 КБ на начертание) и отдельный файл расширенной латиницы,
  который браузер скачивает, только если такие буквы есть на странице. Два шрифта первого экрана и баннер
  hero предзагружаются (`<link rel="preload">`).
- У каждой страницы свой CSS и JS; файлы с хешем в имени можно кэшировать навсегда.
- Слабые устройства и медленная или экономная сеть (`navigator.connection.saveData`, 2G, ≤ 2 ГБ памяти, ≤ 2 ядер):
  самые тяжёлые эффекты (частицы логотипа, поле точек) отключаются, как и при «уменьшить движение» в системе —
  см. `src/scripts/common/motion.js`.
- Анимации вне экрана ставятся на паузу (`src/scripts/common/pause-offscreen.js`).

Проверка: `npm run build`, `npm run preview`, затем Lighthouse в Chrome DevTools (вкладка Lighthouse, режим Mobile).

## SEO

- У каждой страницы свои `title`, `description`, `canonical`, Open Graph и Twitter-карточка
  (`src/partials/layout/head.html`). Превью для соцсетей — `public/og-image.png` 1200×630,
  исходник — `design/og-image.html`.
- Иконки: SVG, PNG 48×48 (для выдачи Google), `apple-touch-icon` 180×180, 192/512 в манифесте.
- JSON-LD: `Organization` и `WebSite` на главной, `Service` на `/ux/`.
- `sitemap.xml` и `robots.txt` генерируются при сборке. Из выдачи убраны (`noindex`) 404, `/styleguide/`
  и пока что `/terms/` и `/privacy/` — у них ещё нет текста. Когда текст появится, верните их в `PAGES`
  в `vite.config.js` и уберите `"robots"` из их `@include layout/head.html`.
- Адрес сайта для canonical и sitemap задаётся переменной `SITE_URL` в Vercel: `https://vickand.com/`.

### Чтобы сайт находили в Google

1. **Свой домен.** Сайт опубликован на `https://vickand.com/` через Vercel; `www` перенаправляет на основной адрес.
2. **Google Search Console** (search.google.com/search-console): добавить сайт, подтвердить владение,
   отправить `sitemap.xml`. То же — в Bing Webmaster Tools.
3. **Тексты.** Главное для позиций — содержание: реальные названия и описания игр вместо `[Title]`,
   описания услуг и кейсов на `/ux/`, ссылки на сторы. Заголовок и описание каждой страницы задаются
   в её `@include layout/head.html`.

## Деплой на Vercel

Сайт публикуется через Git-интеграцию проекта `vickand-site` в Vercel.
Пуш в `main` запускает production-сборку для `https://vickand.com/`.
Другие ветки получают preview-деплой. Проверки кода находятся в `ci.yml`.

GitHub Pages не используется; workflow его публикации удалён.
Серверные обработчики форм и пересылки поддержки выполняются в Vercel.
Переменные окружения, включая секреты Resend, задаются в Vercel → Settings → Environment Variables.

## Что ещё не подключено

- Тексты Terms of Use и Privacy Policy — заглушки.
- Блоки игр на главной — заглушки (`[Title]`, `[Description]`, ссылки на сторы `#`).

## Формы сайта: Vercel + Resend

Обе формы отправляют `POST /api/forms`. Сервер проверяет поля и отправляет уведомление на
фиксированный адрес команды. Посетитель не может изменить получателя. Адрес посетителя
передаётся в Reply-To. Подписка на уведомление сохраняется как письмо команде; это не
автоматическая маркетинговая рассылка и не отдельная база подписчиков.

В Vercel → Settings → Environment Variables задайте серверные переменные из `.env.example`:

- `RESEND_API_KEY` — sending-only ключ, ограниченный подтверждённым доменом;
- `RESEND_FROM_EMAIL` — отправитель на этом домене;
- `CONTACT_TO_EMAIL` — действующий адрес команды;
- `RESEND_CONTACT_TEMPLATE_ID` — опубликованный шаблон заявки с переменными
  `NAME`, `SENDER_EMAIL`, `HELP`, `LINK`, `MESSAGE`;
- `RESEND_WAITLIST_TEMPLATE_ID` — опубликованный шаблон уведомления о подписке с переменной `SENDER_EMAIL`.

Сами шаблоны хранятся в Resend. Сервер экранирует пользовательский текст перед подстановкой.
Не добавляйте секреты в `VITE_*`: эти переменные попадают в браузер.
После изменения переменных нужен новый деплой. Существующий основной домен — `https://vickand.com/`.

В интерфейсе успешная отправка показывается только после подтверждения сервера. При ошибке
введённые данные сохраняются. Повторная попытка использует тот же ключ идемпотентности,
чтобы сетевой сбой не приводил к повторным письмам.

Проверки: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`. Тесты работают без настоящих ключей
и не отправляют письма. Перед вводом в эксплуатацию необходимо проверить обе формы через
опубликованный сайт и статус доставки в Resend.

### Support inbox forwarding

`api/resend-inbound.js` accepts signed `email.received` callbacks and forwards only
mail addressed to `support@vickand.com` to the fixed `CONTACT_TO_EMAIL`. The official
SDK retrieves the original message and attachments. Forwarded mail includes the
original sender and a Reply-To address, so the owner can reply directly from Gmail. Retries use a stable idempotency
key per received email (subject to Resend's idempotency retention). Invalid signatures,
other recipients and unrelated events cannot trigger forwarding.

This route needs **separate** `RESEND_RECEIVING_API_KEY` and
`RESEND_RECEIVING_WEBHOOK_SECRET` secrets. Resend's sending-only key cannot read
received mail. Its current API key model requires full access for this operation.
The owner explicitly approved a separate server-only receiving credential for this
integration. Store it as a sensitive production secret; never expose it in browser code.
The website forms continue to use their domain-restricted sending-only key.

For deployment, configure the Resend webhook at
`https://vickand.com/api/resend-inbound` for `email.received`, save its signing secret
in Vercel, redeploy, then test inbound delivery and forwarding to the fixed mailbox.
