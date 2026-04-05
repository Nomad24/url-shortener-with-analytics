**PRODUCT REQUIREMENTS DOCUMENT**

**URL Shortener with Analytics Dashboard**

_Guest shortening · Auth-gated analytics_

|     |     |
| --- | --- |
| **Версия** | 2.0.0 |
| **Дата** | Апрель 2026 |
| **Автор** | Adil |
| **Статус** | Draft |
| **Стек** | Node/Express + React + PostgreSQL |

**1\. Обзор продукта**

**1.1 Концепция**

URL Shortener with Analytics Dashboard — веб-приложение с двухуровневым доступом:

|     |     |
| --- | --- |
| **Гостевой доступ (Public)**<br><br>Любой пользователь без регистрации может сократить ссылку и сразу получить результат. Ссылки гостей не привязаны к аккаунту. | **Авторизованный доступ (Auth)**<br><br>Зарегистрированный пользователь управляет своими ссылками и получает полный доступ к Analytics Dashboard. |

**1.2 Технологический стек**

|     |     |     |
| --- | --- | --- |
| **Слой** | **Технология** | **Назначение** |
| Frontend | React 18 + TypeScript | SPA интерфейс |
| Frontend | Vite | Dev-сервер и сборка |
| Frontend | Zustand | Auth state (user, token) |
| Frontend | Tailwind CSS + shadcn/ui | UI компоненты |
| Frontend | Recharts | Графики аналитики |
| Frontend | React Query (TanStack) | Server state + кеш |
| Frontend | React Router v6 | Клиентский роутинг |
| Backend | Node.js + Express.js | REST API |
| Backend | Prisma ORM | Работа с БД |
| Backend | PostgreSQL | Основная БД |
| Backend | JWT (access + refresh) | Авторизация |
| Backend | Nanoid | Генерация короткого кода |
| Backend | ua-parser-js | Парсинг User-Agent |
| Backend | Zod | Валидация запросов |
| Деплой | PM2 | Process manager для Node.js |
| Деплой | Oracle Cloud (VPS) | Хостинг (Free Tier) |

**1.3 Что убрано из предыдущей версии**

|     |
| --- |
| **Исключено из проекта** |
| Docker / Docker Compose — запуск напрямую через Node.js + PM2 |
| Nginx — не нужен для портфолио; Express отдаёт статику сам |
| Redis — кеширование упрощено до in-memory Map (опционально добавить позже) |
| Rate limiting через Redis — используем express-rate-limit (in-memory) |
| QR-коды, bulk operations, password-protected links — вне MVP скоупа |

**2\. Пользовательские сценарии**

**2.1 Гостевой поток (без регистрации)**

|     |
| --- |
| **Flow: Гость сокращает ссылку** |
| 1\. Пользователь заходит на главную страницу (Landing / Home) |
| 2\. Вставляет длинный URL в поле ввода |
| 3\. Нажимает «Сократить» |
| 4\. POST /api/links/guest — создаётся ссылка без userId (guestId = UUID из cookie) |
| 5\. На странице появляется короткая ссылка с кнопкой «Копировать» |
| 6\. Гость видит баннер: «Зарегистрируйтесь, чтобы видеть статистику переходов» |
| 7\. Ссылка работает и трекает клики, но аналитика недоступна без логина |

**2.2 Авторизованный поток**

|     |
| --- |
| **Flow: Зарегистрированный пользователь** |
| 1\. Регистрация / Вход → получает JWT access + refresh token |
| 2\. Создаёт ссылки через Dashboard (форма с опциями) |
| 3\. Видит список своих ссылок с кратким количеством кликов |
| 4\. Переходит в Analytics Dashboard — графики, таблицы, фильтры |
| 5\. Может редактировать / деактивировать / удалять свои ссылки |

**2.3 Редирект (публичный)**

|     |
| --- |
| **Flow: GET /:shortCode** |
| 1\. Запрос приходит с коротким кодом |
| 2\. Lookup в PostgreSQL по shortCode |
| 3\. Проверка: ссылка активна? не истекла? |
| 4\. Асинхронно записывается клик (IP, device, browser, country, referer) |
| 5\. HTTP 302 редирект на originalUrl |
| 6\. Если ссылка не найдена / деактивирована → 404 страница |

**3\. Модели данных (Prisma Schema)**

|     |
| --- |
| **Model: User** |
| id String @id @default(cuid()) |
| email String @unique |
| name String? |
| password String // bcrypt hash |
| createdAt DateTime @default(now()) |
| updatedAt DateTime @updatedAt |
| links Link\[\] |
| refreshTokens RefreshToken\[\] |

|     |
| --- |
| **Model: Link** |
| id String @id @default(cuid()) |
| shortCode String @unique // nanoid(6) |
| originalUrl String |
| title String? // опционально, для отображения |
| isActive Boolean @default(true) |
| expiresAt DateTime? // опционально |
| userId String? // NULL для гостевых ссылок |
| user User? @relation(...) |
| guestId String? // UUID из cookie для гостей |
| clicks Click\[\] |
| createdAt DateTime @default(now()) |
| @@index(\[shortCode\]) |
| @@index(\[userId\]) |
| @@index(\[guestId\]) |

|     |
| --- |
| **Model: Click** |
| id String @id @default(cuid()) |
| linkId String |
| link Link @relation(fields: \[linkId\], references: \[id\]) |
| ip String? |
| country String? |
| city String? |
| device String? // desktop \| mobile \| tablet |
| browser String? |
| os String? |
| referer String? |
| isUnique Boolean @default(false) |
| clickedAt DateTime @default(now()) |
| @@index(\[linkId\]) |
| @@index(\[clickedAt\]) |
| @@index(\[linkId, clickedAt\]) |

|     |
| --- |
| **Model: RefreshToken** |
| id String @id @default(cuid()) |
| token String @unique |
| userId String |
| user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade) |
| expiresAt DateTime |
| createdAt DateTime @default(now()) |

**Ключевое решение: userId nullable — одна модель Link покрывает и гостей, и авторизованных.**

**4\. REST API Endpoints**

**4.1 Auth (только для авторизованных)**

|     |     |     |
| --- | --- | --- |
| **Method + Path** | **Auth** | **Описание** |
| POST /api/auth/register | Public | Регистрация (email + password) |
| POST /api/auth/login | Public | Вход, выдача токенов |
| POST /api/auth/refresh | Cookie | Обновление access token |
| POST /api/auth/logout | JWT | Инвалидация refresh token |
| GET /api/auth/me | JWT | Данные текущего пользователя |

**4.2 Links**

|     |     |     |
| --- | --- | --- |
| **Method + Path** | **Auth** | **Описание** |
| POST /api/links/guest | Public | Создать ссылку без авторизации (guestId в cookie) |
| GET /api/links | JWT | Список ссылок текущего пользователя |
| POST /api/links | JWT | Создать ссылку с привязкой к аккаунту |
| GET /api/links/:id | JWT | Детали одной ссылки |
| PATCH /api/links/:id | JWT | Обновить title, isActive, expiresAt |
| DELETE /api/links/:id | JWT | Мягкое удаление (isActive = false) |

**4.3 Analytics (только авторизованные)**

|     |     |     |
| --- | --- | --- |
| **Method + Path** | **Auth** | **Описание** |
| GET /api/analytics/overview | JWT | Cards: total clicks, unique, links count, CTR |
| GET /api/analytics/clicks | JWT | Клики по дням (line chart) |
| GET /api/analytics/geography | JWT | Клики по странам |
| GET /api/analytics/devices | JWT | Разбивка: desktop / mobile / tablet |
| GET /api/analytics/browsers | JWT | Разбивка по браузерам |
| GET /api/analytics/referrers | JWT | Топ источников трафика |
| GET /api/analytics/heatmap | JWT | 7x24 heatmap активности |
| GET /api/analytics/links/:id | JWT | Аналитика конкретной ссылки |

**4.4 Public Redirect**

|     |     |     |
| --- | --- | --- |
| **Method + Path** | **Auth** | **Описание** |
| GET /:shortCode | Public | Редирект + асинхронная запись клика |

**4.5 Query параметры аналитики**

- ?from=2026-01-01&to=2026-04-01 — диапазон дат
- ?period=7d|30d|90d|all — быстрый выбор периода
- ?linkId=xxx — фильтр по конкретной ссылке (для /analytics/clicks и др.)

**5\. Frontend Архитектура**

**5.1 Маршруты**

|     |     |     |
| --- | --- | --- |
| **Маршрут** | **Доступ** | **Страница** |
| /   | Public | Home — поле сокращения ссылки + результат для гостя |
| /register | Public | Форма регистрации |
| /login | Public | Форма входа |
| /dashboard | JWT | Список ссылок + overview cards |
| /dashboard/analytics | JWT | Полный Analytics Dashboard |
| /dashboard/links/:id | JWT | Аналитика конкретной ссылки |
| /dashboard/settings | JWT | Настройки профиля, смена пароля |
| /:shortCode/not-found | Public | 404 — ссылка не найдена |

**5.2 Структура src/**

|     |
| --- |
| **Frontend project structure** |
| components/ |
| ui/ — shadcn/ui базовые компоненты (Button, Input, Card...) |
| charts/ — ClicksLineChart, DevicesDonut, HeatmapChart, GeoBar |
| links/ — LinkCard, LinkTable, CreateLinkForm, GuestLinkResult |
| analytics/ — OverviewCards, DateRangePicker, PeriodSelector |
| layout/ — Sidebar, Header, ProtectedRoute, GuestBanner |
| pages/ — Home, Login, Register, Dashboard, Analytics, LinkDetail, Settings |
| store/ — authStore (Zustand: user, accessToken, isAuth) |
| hooks/ — useLinks, useAnalytics, useAuth (React Query wrappers) |
| services/ — api.ts (axios instance) + endpoints (auth, links, analytics) |
| types/ — Link, Click, User, AnalyticsData интерфейсы |
| utils/ — formatDate, formatNumber, getDeviceIcon |

**5.3 Гостевой виджет на Home странице**

|     |
| --- |
| **Компонент: GuestLinkShortener** |
| State: inputUrl, shortLink, isLoading, error |
| POST /api/links/guest при сабмите |
| guestId хранится в localStorage (UUID, создаётся при первом визите) |
| После успеха: показывает shortLink + кнопку 'Copy' |
| Показывает GuestBanner: 'Создайте аккаунт для аналитики переходов' |
| Если пользователь авторизован: POST /api/links (привязка к аккаунту) |

**5.4 State Management**

- Zustand authStore: { user, accessToken, isAuthenticated, login(), logout() }
- React Query: useLinks(), useAnalytics() — кеш + автоматическая инвалидация
- Axios interceptor: прикрепляет Bearer token к каждому запросу
- Axios interceptor: silent refresh при 401 → повтор оригинального запроса
- ProtectedRoute компонент: редиректит на /login если !isAuthenticated

**5.5 Analytics Dashboard виджеты**

|     |     |
| --- | --- |
| **Виджет** | **Описание** |
| Overview Cards | Total clicks / Unique clicks / Active links / CTR за период |
| Clicks Over Time | Line chart — клики по дням с quick-select (7d/30d/90d) |
| Top Links | Таблица топ-10 ссылок по кликам |
| Devices Breakdown | Donut chart: Desktop / Mobile / Tablet |
| Browsers Chart | Bar chart: Chrome / Safari / Firefox / Edge / Other |
| Geography | Horizontal bar chart по странам (топ-10) |
| Referrers Table | Источники трафика с количеством кликов |
| Hourly Heatmap | 7×24 матрица — активность по дням недели и часам |

**6\. Backend Архитектура**

**6.1 Структура src/**

|     |
| --- |
| **Backend project structure** |
| routes/ — authRoutes.ts, linkRoutes.ts, analyticsRoutes.ts, redirectRoute.ts |
| controllers/ — authController.ts, linkController.ts, analyticsController.ts |
| services/ — authService.ts, linkService.ts, analyticsService.ts, geoService.ts |
| middleware/ — authGuard.ts, errorHandler.ts, requestLogger.ts, rateLimiter.ts |
| prisma/ — schema.prisma, migrations/ |
| utils/ — generateCode.ts, parseUA.ts, hashPassword.ts, AppError.ts |
| config/ — env.ts (Zod validation), prisma.ts (singleton client) |
| types/ — express augmentation (req.user), shared types |
| app.ts — Express setup (middleware, routes, error handler) |
| server.ts — listen + graceful shutdown |

**6.2 Гостевые ссылки — реализация**

|     |
| --- |
| **POST /api/links/guest — логика** |
| 1\. Валидация тела (Zod): { url: string } |
| 2\. Читаем guestId из req.cookies.guestId |
| 3\. Если нет — генерируем UUID, ставим в cookie (httpOnly, 30 дней) |
| 4\. Генерируем shortCode = nanoid(6), проверяем уникальность |
| 5\. Создаём Link { userId: null, guestId, originalUrl, shortCode } |
| 6\. Возвращаем { shortUrl, shortCode, originalUrl } |
| 7\. Для авторизованного: POST /api/links — то же самое, но userId = req.user.id |

**6.3 Трекинг кликов**

|     |
| --- |
| **GET /:shortCode — логика** |
| 1\. Найти Link по shortCode в БД |
| 2\. Если не найден → redirect /not-found |
| 3\. Если !isActive или expiresAt < now() → redirect /not-found |
| 4\. setImmediate(() => recordClick(linkId, req)) — НЕ блокирует редирект |
| 5\. res.redirect(302, link.originalUrl) |
|     |
| recordClick(linkId, req): |
| \- ip = req.ip (X-Forwarded-For если за проксей) |
| \- ua = ua-parser-js(req.headers\['user-agent'\]) |
| \- device = ua.device.type \| 'desktop' |
| \- browser = ua.browser.name |
| \- os = ua.os.name |
| \- country = await geoLookup(ip) // ip-api.com free tier |
| \- referer = req.headers.referer |
| \- isUnique: проверка по ip+linkId за 24ч через in-memory Map с TTL |
| \- prisma.click.create({ data: { linkId, ip, device, browser, os, country, referer, isUnique } }) |

**6.4 JWT Auth Flow**

- Access token: HS256, 15 минут, в Authorization: Bearer header
- Refresh token: HS256, 7 дней, хранится в httpOnly cookie + БД (RefreshToken)
- POST /auth/refresh: валидирует cookie → ротация refresh token → новый access
- Logout: удаляет RefreshToken из БД, очищает cookie
- authGuard middleware: декодирует access token, кладёт user в req.user

**6.5 Analytics Queries**

- Clicks Over Time: GROUP BY DATE(clickedAt) — через Prisma.$queryRaw&lt;T&gt;
- Devices / Browsers / OS: GROUP BY field + COUNT(\*) + WHERE linkId IN (userLinks)
- Geography: GROUP BY country ORDER BY count DESC LIMIT 10
- Heatmap: GROUP BY EXTRACT(DOW ...), EXTRACT(HOUR ...) FROM clickedAt
- Все запросы фильтруют только ссылки текущего пользователя через userId join

**7\. Запуск и деплой**

**7.1 Локальный запуск**

|     |
| --- |
| **Команды для локальной разработки** |
| \# Установка зависимостей |
| cd backend && npm install |
| cd frontend && npm install |
|     |
| \# Запуск PostgreSQL (локально или через PostgreSQL app) |
| \# Настройка .env (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET...) |
|     |
| \# Prisma миграции |
| npx prisma migrate dev |
| npx prisma generate |
|     |
| \# Запуск backend (development) |
| npm run dev # ts-node-dev или tsx watch |
|     |
| \# Запуск frontend |
| npm run dev # Vite dev server |

**7.2 Production деплой (Oracle Cloud VPS)**

|     |
| --- |
| **Шаги деплоя без Docker** |
| 1\. SSH на сервер Oracle Cloud (Ubuntu 22.04) |
| 2\. Установка: Node.js 20 LTS, npm, PostgreSQL 16, PM2 |
| 3\. git clone репозитория на сервер |
| 4\. cd backend → npm install --production |
| 5\. npx prisma migrate deploy |
| 6\. cd frontend → npm install → npm run build |
| 7\. Скопировать dist/ в backend/public/ (Express отдаёт статику) |
| 8\. pm2 start dist/server.js --name url-shortener |
| 9\. pm2 save && pm2 startup (автозапуск при перезагрузке) |
| 10\. Приложение доступно на [http://&lt;ip&gt;:3000](http://%3Cip%3E:3000/) |

**7.3 Express — отдача статики**

|     |
| --- |
| **Serving React build from Express** |
| // app.ts |
| app.use(express.static(path.join(\__dirname, 'public'))); |
|     |
| // SPA fallback — все маршруты кроме /api и /:shortCode |
| app.get(/^(?!\\/api\|\\/\[a-zA-Z0-9\]{6}$).\*/, (req, res) => { |
| res.sendFile(path.join(\__dirname, 'public', 'index.html')); |
| }); |
|     |
| // Редирект — ПЕРЕД SPA fallback |
| app.get('/:shortCode', redirectController); |

**7.4 Environment Variables**

|     |     |
| --- | --- |
| **Переменная** | **Значение / Описание** |
| DATABASE_URL | postgresql://user:pass@localhost:5432/urlshortener |
| JWT_ACCESS_SECRET | Случайная строка ≥ 32 символа |
| JWT_REFRESH_SECRET | Другая случайная строка ≥ 32 символа |
| JWT_ACCESS_EXPIRES | 15m |
| JWT_REFRESH_EXPIRES | 7d  |
| BASE_URL | [https://yourdomain.com](https://yourdomain.com/) (для формирования короткой ссылки) |
| PORT | 3000 |
| NODE_ENV | production |

**7.5 PM2 конфигурация**

|     |
| --- |
| **ecosystem.config.js** |
| module.exports = { |
| apps: \[{ |
| name: 'url-shortener', |
| script: 'dist/server.js', |
| instances: 2, // cluster mode, 2 воркера |
| exec_mode: 'cluster', |
| env_production: { |
| NODE_ENV: 'production', |
| PORT: 3000, |
| }   |
| }\] |
| };  |

**8\. Нефункциональные требования**

|     |     |     |
| --- | --- | --- |
| **Категория** | **Требование** | **Метрика** |
| Performance | Редирект латентность | < 100ms (без Redis) |
| Performance | API response time | < 300ms для 95% запросов |
| Security | Пароли | bcrypt, cost factor 12 |
| Security | Refresh token | httpOnly cookie, Secure, SameSite=Strict |
| Security | SQL Injection | Полная защита через Prisma ORM |
| Security | XSS | Helmet.js headers |
| Security | Rate limiting | express-rate-limit: 10 req/min на /auth |
| UX  | Responsive | Tailwind адаптивные классы (mobile first) |
| UX  | Гостевой UX | Результат сразу, без модалки регистрации |
| UX  | Пустые состояния | Empty state компоненты для новых пользователей |

**9\. Roadmap реализации**

|     |     |     |
| --- | --- | --- |
| **Фаза** | **Задачи** | **Срок** |
| Phase 1<br><br>Core Backend | Prisma schema, auth (register/login/refresh), POST /api/links/guest, GET /:shortCode редирект + трекинг кликов | Дни 1-3 |
| Phase 2<br><br>Auth Links API | GET /api/links (список), POST /api/links (auth), PATCH, DELETE. JWT middleware. Тест через Postman/Insomnia | Дни 4-5 |
| Phase 3<br><br>Analytics API | Все /api/analytics/\* endpoints. Prisma.$queryRaw для GROUP BY запросов. Geo lookup через ip-api.com | Дни 6-7 |
| Phase 4<br><br>Frontend Core | Vite + React setup, роутинг, Home с гостевым шортнером, Login/Register страницы, authStore (Zustand) | Дни 8-9 |
| Phase 5<br><br>Dashboard | Links таблица, Create/Edit форма, Analytics Dashboard с 8 виджетами (Recharts), DateRange picker | Дни 10-12 |
| Phase 6<br><br>Deploy + Polish | Build React → backend/public, PM2 setup, Oracle Cloud деплой, README, скриншоты | Дни 13-14 |

**10\. Definition of Done (MVP)**

|     |
| --- |
| **Чеклист MVP** |
| \[ \] Гость может сократить ссылку без регистрации за < 3 секунды |
| \[ \] Короткая ссылка работает и делает 302 редирект |
| \[ \] Клики трекаются: device, browser, country, referer, isUnique |
| \[ \] Регистрация и JWT refresh flow работают корректно |
| \[ \] Авторизованный пользователь видит только свои ссылки |
| \[ \] Analytics Dashboard отображает все 8 виджетов с реальными данными |
| \[ \] Фильтрация по периоду (7d / 30d / 90d / all) работает |
| \[ \] Аналитика недоступна без авторизации (401 на /api/analytics/\*) |
| \[ \] Express отдаёт React build как статику (SPA fallback) |
| \[ \] PM2 запускает приложение в cluster mode на сервере |
| \[ \] README с описанием, live URL, скриншотами Dashboard |

_© 2026 Adil — URL Shortener PRD v2.0_