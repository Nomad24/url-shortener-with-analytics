**ПЛАН РАЗРАБОТКИ**

**URL Shortener + Analytics Dashboard**

_10 этапов разработки · Node.js + Express + React + PostgreSQL_

|     |     |     |     |
| --- | --- | --- | --- |
| **10**<br><br>Этапов | **~14**<br><br>Дней | **2**<br><br>Части проекта | **∞**<br><br>Опыта |

|     |     |     |     |
| --- | --- | --- | --- |
| **#** | **Этап** | **Результат** | **Срок** |
| **01** | **Инициализация проекта** | Mono-repo структура, конфиги, TypeScript | День 1 |
| **02** | **База данных + Prisma** | Schema, миграции, seed данные | День 1-2 |
| **03** | **Auth API** | Register, Login, Refresh, Logout, /me | День 2-3 |
| **04** | **Links API** | Guest + Auth endpoints, трекинг кликов | День 3-5 |
| **05** | **Analytics API** | 8 endpoints, GROUP BY queries | День 5-6 |
| **06** | **React Setup + Auth UI** | Vite, роутинг, Login, Register, authStore | День 7-8 |
| **07** | **Home + Guest Flow** | Гостевой шортнер, копирование ссылки | День 8-9 |
| **08** | **Dashboard — Links** | Таблица ссылок, формы, управление | День 9-10 |
| **09** | **Analytics Dashboard** | 8 виджетов, фильтры, Recharts | День 11-12 |
| **10** | **Деплой + Финал** | PM2, статика, Oracle Cloud, README | День 13-14 |

|     |     |
| --- | --- |
| **01** | **Инициализация проекта**<br><br>_Структура mono-repo, TypeScript, линтеры, базовые конфиги_ |

Цель: создать чистую основу проекта, в которой удобно работать на протяжении всей разработки. Правильная структура сейчас экономит часы позже.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Mono-repo структура** | Папки /backend и /frontend в корне. Корневой package.json с npm workspaces или просто два независимых проекта. |
| **Backend: Node + TypeScript** | npm init, установка: express, typescript, ts-node-dev (или tsx), @types/node, @types/express, dotenv, zod, cors, helmet, morgan |
| **tsconfig.json** | strict: true, target: ES2022, module: CommonJS, outDir: "./dist", rootDir: "./src" |
| **Структура src/** | routes/, controllers/, services/, middleware/, utils/, config/, types/, prisma/ — создать пустые файлы-плейсхолдеры |
| **app.ts** | Express инстанс, подключение helmet(), cors(), morgan(), express.json(). Базовый GET /health → { status: 'ok' } |
| **server.ts** | app.listen(PORT) + обработка SIGTERM для graceful shutdown |
| **Переменные окружения** | .env файл, .env.example с ключами, валидация через Zod в config/env.ts при старте |
| **ESLint + Prettier** | .eslintrc, .prettierrc, npm scripts: lint, format, dev, build, start |
| **Frontend: Vite + React** | npm create vite@latest frontend -- --template react-ts. Установка: tailwindcss, shadcn/ui init, react-router-dom, axios, zustand, @tanstack/react-query |
| **Tailwind + shadcn/ui** | npx tailwindcss init, npx shadcn-ui@latest init. Добавить базовые компоненты: Button, Input, Card |
| **.gitignore** | node_modules/, dist/, .env, .DS_Store, \*.log |

|     |
| --- |
| **Файловая структура backend/src/** |
| src/ |
| ├── routes/ authRoutes.ts linkRoutes.ts analyticsRoutes.ts |
| ├── controllers/ authController.ts linkController.ts analyticsController.ts |
| ├── services/ authService.ts linkService.ts analyticsService.ts geoService.ts |
| ├── middleware/ authGuard.ts errorHandler.ts rateLimiter.ts |
| ├── utils/ AppError.ts generateCode.ts parseUA.ts |
| ├── config/ env.ts prisma.ts |
| ├── types/ express.d.ts |
| ├── app.ts |
| └── server.ts |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] GET /health возвращает 200 { status: 'ok' } |
| \[ \] ts-node-dev запускает backend без ошибок |
| \[ \] Vite dev server открывается в браузере |
| \[ \] .env читается через config/env.ts с валидацией Zod |
| \[ \] ESLint и Prettier настроены |

|     |     |
| --- | --- |
| **02** | **База данных + Prisma**<br><br>_Schema, миграции, индексы, seed, клиент Prisma_ |

Цель: спроектировать и применить схему БД. Правильные индексы на этом этапе — это быстрые запросы аналитики без рефакторинга.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Установка Prisma** | npm install prisma @prisma/client, npx prisma init → создаёт prisma/schema.prisma и .env с DATABASE_URL |
| **Model: User** | id (cuid), email (unique), name?, password, createdAt, updatedAt. Relations: links\[\], refreshTokens\[\] |
| **Model: Link** | id, shortCode (unique, index), originalUrl, title?, isActive, expiresAt?, userId (nullable), guestId (nullable), createdAt. Индексы на shortCode, userId, guestId |
| **Model: Click** | id, linkId (FK), ip?, country?, city?, device?, browser?, os?, referer?, isUnique (bool), clickedAt. Индексы: \[linkId\], \[clickedAt\], \[linkId, clickedAt\] |
| **Model: RefreshToken** | id, token (unique), userId (FK, onDelete: Cascade), expiresAt, createdAt |
| **Prisma migrate** | npx prisma migrate dev --name init — создаёт миграцию и применяет к БД |
| **Prisma singleton** | config/prisma.ts: global.\__prisma \| new PrismaClient() — избегаем лишних соединений в dev |
| **Seed файл** | prisma/seed.ts — создать тестового пользователя + 3 ссылки + 50 кликов с разными country/device для проверки аналитики |
| **Проверка** | npx prisma studio — визуально проверить таблицы и seed данные |

|     |
| --- |
| **Ключевые индексы в schema.prisma** |
| model Link { |
| @@index(\[shortCode\]) // критично для редиректа |
| @@index(\[userId\]) // список ссылок пользователя |
| @@index(\[guestId\]) // гостевые ссылки |
| }   |
|     |
| model Click { |
| @@index(\[linkId\]) // клики по ссылке |
| @@index(\[clickedAt\]) // фильтрация по дате |
| @@index(\[linkId, clickedAt\]) // аналитика конкретной ссылки за период |
| }   |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] npx prisma migrate dev выполняется без ошибок |
| \[ \] npx prisma db seed заполняет данные |
| \[ \] npx prisma studio показывает все 4 таблицы с данными |
| \[ \] Prisma client импортируется в любом сервисе без ошибок |

|     |     |
| --- | --- |
| **03** | **Auth API**<br><br>_Register, Login, Refresh token, Logout, /me. JWT + bcrypt_ |

Цель: реализовать безопасную авторизацию с access + refresh token flow. Это фундамент для всех защищённых эндпоинтов.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Установка пакетов** | npm install bcryptjs jsonwebtoken cookie-parser. npm install -D @types/bcryptjs @types/jsonwebtoken @types/cookie-parser |
| **POST /api/auth/register** | Zod валидация { email, password, name? }. Проверка email уже занят. bcrypt.hash(password, 12). prisma.user.create(). Возврат { user } без пароля. |
| **POST /api/auth/login** | Найти user по email. bcrypt.compare(). Сгенерировать accessToken (15m) + refreshToken (7d). Сохранить refreshToken в БД. res.cookie('refreshToken', ..., {httpOnly, secure, sameSite}). Вернуть { accessToken, user } |
| **POST /api/auth/refresh** | Читать cookie refreshToken. Найти в БД, проверить expiresAt. jwt.verify(). Ротация: удалить старый, создать новый refreshToken. Вернуть новый accessToken. |
| **POST /api/auth/logout** | Удалить refreshToken из БД по значению cookie. res.clearCookie('refreshToken'). Вернуть 200. |
| **GET /api/auth/me** | authGuard middleware → req.user. Вернуть { id, email, name, createdAt } без пароля. |
| **authGuard middleware** | Читает Authorization: Bearer &lt;token&gt;. jwt.verify(accessToken, JWT_ACCESS_SECRET). При ошибке → AppError(401). Кладёт { id, email } в req.user. |
| **AppError класс** | class AppError extends Error { constructor(statusCode, message). Централизованный errorHandler middleware перехватывает и форматирует ответ. |
| **Rate limiting** | express-rate-limit: max 10 req / 1 min для /api/auth/\* эндпоинтов |

|     |
| --- |
| **JWT Token Strategy** |
| Access Token: HS256 · 15 минут · в Authorization header |
| Refresh Token: HS256 · 7 дней · в httpOnly cookie + stored in DB |
|     |
| Silent Refresh Flow: |
| Axios interceptor перехватывает 401 → |
| POST /api/auth/refresh (cookie автоматически) → |
| Получаем новый accessToken → |
| Повторяем оригинальный запрос с новым токеном |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] POST /register создаёт пользователя, пароль хранится как bcrypt хеш |
| \[ \] POST /login возвращает accessToken и ставит httpOnly cookie |
| \[ \] POST /refresh обновляет токены (старый refresh удаляется из БД) |
| \[ \] authGuard возвращает 401 без токена и 200 с валидным токеном |
| \[ \] GET /me возвращает данные текущего пользователя |
| \[ \] Все эндпоинты протестированы в Postman / Insomnia |

|     |     |
| --- | --- |
| **04** | **Links API + Redirect + Click Tracking**<br><br>_Guest и Auth эндпоинты, редирект, асинхронный трекинг кликов_ |

Цель: ядро приложения — создание коротких ссылок (гость и авторизованный) и механизм редиректа с записью аналитики.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Установка пакетов** | npm install nanoid ua-parser-js. npm install -D @types/ua-parser-js |
| **generateCode() утилита** | nanoid(6) — генерирует 6-символьный код. Проверяет уникальность в БД. Если коллизия (крайне редко) — повторяет генерацию. |
| **POST /api/links/guest** | Public. Zod: { url }. Читать guestId из req.cookies. Если нет — uuid(), set-cookie (httpOnly, 30 дней). generateCode(). prisma.link.create({ userId: null, guestId, shortCode, originalUrl }). Вернуть { shortUrl, shortCode }. |
| **POST /api/links** | authGuard. Zod: { url, title? }. generateCode(). prisma.link.create({ userId: req.user.id, shortCode, originalUrl, title }). Вернуть Link object. |
| **GET /api/links** | authGuard. prisma.link.findMany({ where: { userId }, include: { \_count: { select: { clicks: true } } }, orderBy: { createdAt: 'desc' }, take/skip для пагинации }) |
| **GET /api/links/:id** | authGuard. Проверить что link.userId === req.user.id (ownership). Вернуть link + clicksCount. |
| **PATCH /api/links/:id** | authGuard + ownership check. Обновить: title, isActive, expiresAt. Zod валидация полей. |
| **DELETE /api/links/:id** | authGuard + ownership. Soft delete: prisma.link.update({ isActive: false }). |
| **GET /:shortCode (redirect)** | Найти ссылку. Если !isActive или expiresAt &lt; now() → 404. setImmediate(() =&gt; recordClick(...)) — не блокирует ответ. res.redirect(302, originalUrl). |
| **recordClick() функция** | ip из req.ip. ua-parser-js для device/browser/os. geoService.lookup(ip) через ip-api.com. isUnique: Map&lt;linkId:ip, timestamp&gt; с 24ч TTL. prisma.click.create(...). |
| **geoService** | Запрос к [http://ip-api.com/json/{ip}?fields=country,city](http://ip-api.com/json/%7Bip%7D?fields=country,city). Кешировать результаты в Map (TTL 1 час) чтобы не перегружать API. |

|     |
| --- |
| **Редирект + трекинг (ключевой паттерн)** |
| app.get('/:shortCode', async (req, res) => { |
| const link = await prisma.link.findUnique({ where: { shortCode } }); |
| if (!link \| !link.isActive) return res.status(404)...; |
| if (link.expiresAt && link.expiresAt < new Date()) return res.status(410)...; |
|     |
| // Не ждём — редирект уходит немедленно |
| setImmediate(() => recordClick(link.id, req)); |
|     |
| res.redirect(302, link.originalUrl); |
| }); |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] POST /api/links/guest создаёт ссылку, ставит guestId cookie |
| \[ \] GET /:shortCode делает редирект и записывает клик в БД |
| \[ \] Клик содержит device, browser, country (через ip-api) |
| \[ \] isUnique работает корректно (повторный клик с того же IP не считается) |
| \[ \] authGuard блокирует PATCH/DELETE чужих ссылок с 403 |
| \[ \] Pagination в GET /api/links работает (page, limit query params) |

|     |     |
| --- | --- |
| **05** | **Analytics API**<br><br>_8 endpoints с GROUP BY запросами, фильтры по дате и ссылке_ |

Цель: реализовать все аналитические эндпоинты. Данные должны быть изолированы — каждый пользователь видит только аналитику своих ссылок.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Базовый паттерн** | Все /api/analytics/\* → authGuard. Сначала получаем linkIds пользователя: prisma.link.findMany({ where: { userId }, select: { id } }). Все Click запросы фильтруем по этим linkIds. |
| **Общие query params** | Zod схема: { from?: date, to?: date, period?: '7d'\|'30d'\|'90d'\|'all', linkId?: string }. Utility getDateRange(period, from, to) → { startDate, endDate }. |
| **GET /overview** | { totalClicks, uniqueClicks, activeLinks, totalLinks }. Также дельта vs предыдущий период (для отображения +12% и т.д.) |
| **GET /clicks** | GROUP BY DATE(clickedAt). Prisma.$queryRaw&lt;{date: string, count: number}\[\]&gt;. Заполнить пропущенные дни нулями на уровне JS. |
| **GET /geography** | GROUP BY country ORDER BY count DESC LIMIT 10. Фильтр: WHERE country IS NOT NULL. |
| **GET /devices** | GROUP BY device. Вернуть массив { device, count, percentage }. |
| **GET /browsers** | GROUP BY browser ORDER BY count DESC. Группировать редкие в 'Other'. |
| **GET /referrers** | GROUP BY referer ORDER BY count DESC LIMIT 10. NULL referer → 'Direct'. |
| **GET /heatmap** | SELECT EXTRACT(DOW ...) as dow, EXTRACT(HOUR ...) as hour, COUNT(\*) as count GROUP BY dow, hour. Вернуть массив 168 точек (7\*24). |
| **GET /links/:id/\*** | Те же эндпоинты но с фильтром по конкретной linkId. Проверить ownership: link.userId === req.user.id. |

|     |
| --- |
| **Пример $queryRaw запроса (Clicks Over Time)** |
| const result = await prisma.$queryRaw&lt;{date: string, count: bigint}\[\]&gt;\` |
| SELECT |
| DATE(clicked_at)::text AS date, |
| COUNT(\*) AS count |
| FROM clicks |
| WHERE link_id = ANY(${linkIds}::text\[\]) |
| AND clicked_at BETWEEN ${startDate} AND ${endDate} |
| GROUP BY DATE(clicked_at) |
| ORDER BY date ASC |
| \`; |
|     |
| // BigInt → Number конвертация: |
| return result.map(r => ({ date: r.date, count: Number(r.count) })); |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] GET /overview возвращает корректные цифры (сверить с seed данными) |
| \[ \] GET /clicks возвращает данные для каждого дня выбранного периода |
| \[ \] Фильтр ?period=7d работает и возвращает только данные за 7 дней |
| \[ \] GET /geography сортирует страны по кол-ву кликов |
| \[ \] GET /heatmap возвращает 168 точек (7 дней × 24 часа) |
| \[ \] Пользователь НЕ видит аналитику чужих ссылок (403) |
| \[ \] BigInt корректно конвертируется в Number |

|     |     |
| --- | --- |
| **06** | **React Setup + Auth UI**<br><br>_Vite конфиг, роутинг, Zustand authStore, Login и Register страницы_ |

Цель: настроить frontend основу и реализовать полный auth flow на клиенте. После этого этапа пользователь может войти в аккаунт.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Vite proxy** | vite.config.ts: server.proxy\['/api'\] → [http://localhost:3000](http://localhost:3000/), server.proxy\['/:\*'\] для редиректов. Убирает CORS в разработке. |
| **React Router Setup** | main.tsx: BrowserRouter. App.tsx: &lt;Routes&gt;. Структура: публичные маршруты + &lt;ProtectedRoute&gt; обёртка для /dashboard/\* |
| **ProtectedRoute** | Читает isAuthenticated из authStore. Если false → &lt;Navigate to='/login' /&gt;. Показывает Spinner пока идёт проверка токена. |
| **axios instance** | services/api.ts: axios.create({ baseURL: '/api' }). Request interceptor: добавляет Authorization: Bearer {accessToken}. Response interceptor: при 401 → POST /auth/refresh → retry. |
| **authStore (Zustand)** | { user, accessToken, isAuthenticated, isLoading }. Actions: login(email, pw), logout(), refreshToken(), init(). init() вызывается при загрузке приложения — пробует refresh для восстановления сессии. |
| **Register страница** | Форма: name, email, password, confirmPassword. Zod валидация на клиенте (React Hook Form + zodResolver). POST /auth/register → автоматический логин → redirect /dashboard. |
| **Login страница** | Форма: email, password. POST /auth/login → сохранить accessToken в store → redirect /dashboard. Ошибка: 'Неверный email или пароль'. |
| **Layout компоненты** | AuthLayout — центрированная карточка для Login/Register. DashboardLayout — Sidebar + Header + &lt;Outlet&gt;. Sidebar: навигация (Links, Analytics, Settings) + logout кнопка. |
| **Session restore** | В App.tsx useEffect: authStore.init(). Если refresh успешен → isAuthenticated = true. Иначе → logout(). Предотвращает мигание при перезагрузке страницы. |

|     |
| --- |
| **authStore (Zustand) структура** |
| interface AuthStore { |
| user: User \| null |
| accessToken: string \| null |
| isAuthenticated: boolean |
| isLoading: boolean |
|     |
| login: (email: string, password: string) => Promise&lt;void&gt; |
| logout: () => Promise&lt;void&gt; |
| init: () => Promise&lt;void&gt; // вызывается при старте приложения |
| setAccessToken: (token: string) => void |
| }   |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] Регистрация создаёт аккаунт и перенаправляет на /dashboard |
| \[ \] Вход выдаёт токен, Dashboard открывается |
| \[ \] Обновление страницы на /dashboard не разлогинивает пользователя |
| \[ \] Прямой переход на /dashboard без токена → редирект на /login |
| \[ \] Logout очищает store и перенаправляет на /login |
| \[ \] Sidebar навигация работает |

|     |     |
| --- | --- |
| **07** | **Home Page + Guest Shortener Flow**<br><br>_Главная страница, гостевое сокращение, копирование ссылки, CTA баннер_ |

Цель: реализовать публичную главную страницу где любой посетитель может сократить ссылку без регистрации. Конверсионный сценарий.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Home страница (Layout)** | Hero секция: заголовок, описание. Центрированная форма сокращения ссылки. Внизу: особенности продукта (3 карточки: Fast, Analytics, Free). Навбар с Login/Register. |
| **GuestLinkShortener компонент** | useState: inputUrl, result, isLoading, error. Если !isAuthenticated → POST /api/links/guest. Если isAuthenticated → POST /api/links. Показывает результат inline. |
| **guestId в localStorage** | При первом визите: localStorage.getItem('guestId') \| uuid(). Сохранить в localStorage. Передавать в cookie через axios или просто полагаться на cookie, выданный сервером. |
| **LinkResult компонент** | Показывает shortUrl в инпуте (readonly). Кнопка 'Копировать' → navigator.clipboard.writeText(). Иконка с анимацией при успешном копировании. Кнопка 'Сократить ещё'. |
| **GuestBanner** | Показывается под результатом для неавторизованных. Текст: 'Зарегистрируйтесь чтобы видеть аналитику переходов'. Кнопки: 'Создать аккаунт' и 'Войти'. |
| **Валидация URL** | Клиентская Zod валидация: z.string().url(). Подсветка инпута красным при ошибке. Сообщение: 'Введите корректный URL (начинается с [https://)'](https://%29'/). |
| **UX детали** | Кнопка Сократить disabled + spinner во время запроса. Enter в инпуте сабмитит форму. Автофокус на инпут при загрузке страницы. |
| **Навбар** | Если !isAuthenticated: ссылки Login и Register. Если isAuthenticated: ссылка на Dashboard и кнопка Logout. Логотип слева. |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] Гость вставляет URL, нажимает Сократить → получает короткую ссылку |
| \[ \] Кнопка Копировать работает, иконка меняется на галочку |
| \[ \] GuestBanner отображается после создания ссылки |
| \[ \] Короткая ссылка из результата реально работает (редирект) |
| \[ \] Авторизованный пользователь также может сократить ссылку с Home |
| \[ \] URL валидация показывает ошибку при некорректном адресе |

|     |     |
| --- | --- |
| **08** | **Dashboard — Управление ссылками**<br><br>_Таблица ссылок, создание, редактирование, удаление, статистика_ |

Цель: реализовать полноценный CRUD интерфейс управления ссылками для авторизованных пользователей.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **useLinks() hook** | React Query: useQuery(\['links'\], fetchLinks). useMutation для create, update, delete с автоматической инвалидацией кеша \['links'\]. |
| **LinksTable компонент** | Колонки: Title/URL, Short Link, Clicks, Created, Status, Actions. Пагинация. Сортировка по кликам/дате. Поиск по URL. |
| **LinkRow компонент** | Отображает: оригинальный URL (truncated), shortUrl с иконкой копирования, clicksCount badge, isActive toggle, кнопки Edit и Delete. |
| **CreateLinkDialog** | shadcn/ui Dialog. Форма: URL (required), Title (optional). React Hook Form + Zod. POST /api/links. onSuccess → закрыть диалог + показать toast 'Ссылка создана'. |
| **EditLinkDialog** | Те же поля + toggle isActive + поле expiresAt (date picker). PATCH /api/links/:id. onSuccess → toast 'Сохранено'. |
| **DeleteConfirmDialog** | Подтверждение удаления. DELETE /api/links/:id. Показывает spinner пока идёт запрос. |
| **OverviewCards (Dashboard)** | 4 карточки: Total Links, Total Clicks, Unique Clicks, Active Links. Данные из GET /api/analytics/overview. Skeleton loader пока грузится. |
| **EmptyState** | Если links.length === 0 → красивая пустая страница с иллюстрацией и кнопкой 'Создать первую ссылку'. |
| **Toast уведомления** | shadcn/ui Toaster. Успех (зелёный), ошибка (красный). Позиция: bottom-right. |
| **isActive toggle** | Switch компонент. PATCH /api/links/:id { isActive: !current }. Оптимистичное обновление через React Query. |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] Список ссылок загружается с количеством кликов для каждой |
| \[ \] Кнопка 'Создать ссылку' открывает диалог, ссылка появляется в таблице |
| \[ \] Редактирование сохраняет изменения |
| \[ \] Удаление убирает ссылку из списка |
| \[ \] Toggle isActive меняет статус ссылки |
| \[ \] Копирование shortUrl работает из таблицы |
| \[ \] EmptyState показывается для нового пользователя |
| \[ \] OverviewCards показывают реальные данные |

|     |     |
| --- | --- |
| **09** | **Analytics Dashboard**<br><br>_8 виджетов: линейный график, donut, heatmap, гео, рефереры_ |

Цель: реализовать полный Analytics Dashboard с Recharts визуализацией. Самый визуально сложный этап проекта.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **useAnalytics() hook** | React Query: отдельные useQuery для каждого endpoint. { overview, clicks, geography, devices, browsers, referrers, heatmap }. Параметр period передаётся в query params. |
| **PeriodSelector** | Компонент с кнопками: Сегодня \| 7 дней \| 30 дней \| 90 дней \| Всё. Управляет query param period. Сохраняет выбор в URL (?period=30d). |
| **ClicksLineChart** | Recharts LineChart с CartesianGrid, XAxis (дата), YAxis, Tooltip, Legend. Две линии: Total Clicks и Unique Clicks. Анимация при загрузке. |
| **DevicesDonutChart** | Recharts PieChart (innerRadius). Сегменты: Desktop / Mobile / Tablet. Цвета: синий / зелёный / оранжевый. Custom Tooltip с процентом. |
| **BrowsersBarChart** | Recharts BarChart горизонтальный. Сортировка по убыванию. Custom Bar с rounded corners. |
| **GeographyChart** | Recharts BarChart горизонтальный. Топ-10 стран. Флаг страны рядом с названием (emoji). |
| **ReferrersTable** | Таблица: источник \| количество кликов \| процент. 'Direct' для прямых переходов. Прогресс-бар в каждой строке. |
| **HeatmapChart** | CSS Grid 7×24 или кастомный Recharts. Цвет ячейки от серого до синего по интенсивности. Tooltip: 'Вторник 14:00 — 42 клика'. |
| **LinkDetail страница** | /dashboard/links/:id — те же виджеты но для конкретной ссылки. Заголовок: shortUrl + originalUrl. Back кнопка. |
| **Skeleton loaders** | Каждый виджет показывает Skeleton пока данные грузятся. Анимированный grey placeholder. |
| **NoData state** | Если данных нет (новый аккаунт): заглушка 'Нет данных за выбранный период' с иконкой. |

|     |
| --- |
| **Структура Analytics компонентов** |
| pages/Analytics.tsx |
| ├── PeriodSelector |
| ├── OverviewCards (x4) |
| ├── ClicksLineChart (Recharts LineChart) |
| ├── &lt;div grid-cols-2&gt; |
| │ ├── DevicesDonutChart (Recharts PieChart) |
| │ └── BrowsersBarChart (Recharts BarChart) |
| ├── &lt;div grid-cols-2&gt; |
| │ ├── GeographyChart (Recharts BarChart horizontal) |
| │ └── ReferrersTable (html table + progress bar) |
| └── HeatmapChart (CSS Grid 7x24) |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] Все 8 виджетов рендерятся с реальными данными из БД |
| \[ \] Переключение периода (7d / 30d) обновляет все виджеты |
| \[ \] HeatmapChart визуально показывает часы пиковой активности |
| \[ \] DonutChart корректно показывает device breakdown |
| \[ \] LinkDetail страница работает для каждой ссылки |
| \[ \] Skeleton loaders видны при медленном соединении |
| \[ \] Мобильный вид: виджеты перестраиваются в 1 колонку |

|     |     |
| --- | --- |
| **10** | **Деплой + Финализация**<br><br>_Oracle Cloud, PM2, статика, README, скриншоты, portfolio-ready_ |

Цель: задеплоить приложение на сервер, подготовить README и сделать проект portfolio-ready для показа работодателям.

|     |     |
| --- | --- |
| **Задача** | **Детали реализации** |
| **Build frontend** | npm run build → dist/. Скопировать содержимое dist/ в backend/public/. Express будет отдавать статику через app.use(express.static('public')). |
| **SPA fallback в Express** | Добавить в app.ts ПОСЛЕ роута /:shortCode: app.get('\*', (req, res) => res.sendFile('public/index.html')). Важен порядок маршрутов! |
| **Build backend** | npx tsc → dist/. Проверить что dist/server.js запускается: node dist/server.js. |
| **Oracle Cloud VPS** | Создать instance (Ubuntu 22.04, Free Tier). Добавить SSH ключ. Открыть порт 3000 в Security List (или 80 если занимает root). |
| **Сервер setup** | ssh ubuntu@&lt;ip&gt;. Установить: sudo apt update, curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash -, sudo apt install nodejs postgresql. npm install -g pm2. |
| **PostgreSQL на сервере** | sudo -u postgres psql. CREATE USER urluser WITH PASSWORD '...'; CREATE DATABASE urlshortener OWNER urluser;. Обновить DATABASE_URL в .env. |
| **Деплой приложения** | git clone &lt;repo&gt; на сервер. npm install --production в backend/. cp .env.example .env, заполнить переменные. npx prisma migrate deploy. pm2 start ecosystem.config.js --env production. |
| **ecosystem.config.js** | instances: 2, exec_mode: 'cluster'. pm2 save. pm2 startup — добавить в автозапуск. pm2 logs для просмотра ошибок. |
| **Проверка** | curl [http://&lt;ip&gt;:3000/health](http://%3Cip%3E:3000/health). Открыть в браузере. Создать тестовую ссылку как гость. Войти, проверить Dashboard. |
| **README.md** | Описание проекта, стек, скриншоты (Home, Dashboard, Analytics), ссылка на live demo, инструкция локального запуска (npm install + npm run dev в двух терминалах). |
| **Скриншоты** | Home — гостевой шортнер. Dashboard — список ссылок с кликами. Analytics — все виджеты с данными. Mobile вид. Добавить в README. |

|     |
| --- |
| **Порядок маршрутов в app.ts (критично!)** |
| // 1. Статика (React build) |
| app.use(express.static(path.join(\__dirname, '../public'))); |
|     |
| // 2. API маршруты |
| app.use('/api/auth', authRoutes); |
| app.use('/api/links', linkRoutes); |
| app.use('/api/analytics', analyticsRoutes); |
|     |
| // 3. Редирект — конкретный паттерн ПЕРЕД SPA fallback |
| app.get('/:shortCode(\[a-zA-Z0-9\]{6})', redirectController); |
|     |
| // 4. SPA fallback — ПОСЛЕДНИМ |
| app.get('\*', (req, res) => { |
| res.sendFile(path.join(\__dirname, '../public/index.html')); |
| }); |

|     |
| --- |
| **✓ Definition of Done** |
| \[ \] Приложение открывается по публичному IP сервера |
| \[ \] Гость может сократить ссылку на live сервере |
| \[ \] Короткая ссылка делает редирект |
| \[ \] Авторизация работает на продакшне |
| \[ \] Analytics Dashboard загружается с данными |
| \[ \] pm2 list показывает status 'online' для 2 инстанций |
| \[ \] Перезагрузка сервера: приложение стартует автоматически |
| \[ \] README с live demo ссылкой и скриншотами готов |

**Финальный чеклист проекта**

|     |     |     |     |
| --- | --- | --- | --- |
| **#** | **Backend** | **#** | **Frontend** |
| \[ \] | Auth API (register/login/refresh/logout) | \[ \] | Home с гостевым шортнером |
| \[ \] | Links API (guest + auth) | \[ \] | Login / Register страницы |
| \[ \] | Redirect + Click tracking | \[ \] | authStore с session restore |
| \[ \] | Analytics API (8 endpoints) | \[ \] | Dashboard — список ссылок |
| \[ \] | Geo lookup (ip-api.com) | \[ \] | OverviewCards |
| \[ \] | isUnique detection (in-memory) | \[ \] | ClicksLineChart (Recharts) |
| \[ \] | JWT refresh rotation | \[ \] | DevicesDonutChart |
| \[ \] | authGuard middleware | \[ \] | BrowsersBarChart |
| \[ \] | Ownership checks (403) | \[ \] | GeographyChart |
| \[ \] | Rate limiting на /auth/\* | \[ \] | ReferrersTable |
| \[ \] | Zod validation на все входы | \[ \] | HeatmapChart (7x24) |
| \[ \] | Error handler middleware | \[ \] | LinkDetail страница |
| \[ \] | SPA fallback в Express | \[ \] | PeriodSelector |
| \[ \] | PM2 cluster mode | \[ \] | EmptyState + Skeleton loaders |
| \[ \] | Prisma миграции на проде | \[ \] | Mobile responsive layout |

_© 2026 Adil — URL Shortener · Development Plan_