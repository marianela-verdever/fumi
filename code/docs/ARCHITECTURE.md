
fumi — Project Snapshot
Estado actual: Marzo 2026

Tech Stack
Capa
Tecnología
Framework
Next.js 15 (App Router)
Lenguaje
TypeScript
Estilos
Tailwind CSS v4 (@theme inline, variables --color-fumi-*)
Base de datos
Supabase (PostgreSQL)
Auth
Supabase Auth — magic link (OTP email)
Storage
Supabase Storage — bucket entry-media (público)
IA — chat
OpenAI GPT-4o-mini (/api/chat)
IA — capítulos
OpenAI GPT-4o-mini (/api/chapters/generate)
Deploy
Vercel — auto-deploy desde main en GitHub
PDF export
jsPDF
Node
v22.14.0 (arm64, path: ~/.local/node-v22.14.0-darwin-arm64/bin/)

Estructura de rutas
app/
  page.tsx                  ← router raíz (auth-aware)
  login/page.tsx            ← magic link login
  auth/callback/page.tsx    ← PKCE callback (client-side)
  onboarding/page.tsx       ← nombre + fecha del bebé
  timeline/page.tsx         ← home / lista de momentos
  agregar/page.tsx          ← nuevo momento (texto + fotos + tags)
  entry/[id]/page.tsx       ← editar/eliminar momento
  conversar/page.tsx        ← chat con IA
  capitulos/page.tsx        ← lista de capítulos por mes
  capitulos/[id]/page.tsx   ← editor de capítulo
  libro/page.tsx            ← preview del libro + export PDF
  settings/page.tsx         ← nombre bebé, fecha, idioma, logout

  api/
    chat/route.ts           ← GPT-4o-mini chat
    chapters/generate/route.ts ← GPT-4o-mini capítulos
    transcribe/route.ts     ← placeholder (Whisper no implementado)

components/
  layout/
    AppShell.tsx            ← wrapper: top bar (logo + settings) + NavBar
    NavBar.tsx              ← navegación inferior (5 ítems)
    Header.tsx              ← título + subtítulo de página

lib/
  types.ts                  ← tipos: Baby, Entry, Chapter, Voice, etc.
  i18n.ts                   ← strings EN/ES (todos los textos de UI)
  lang-context.tsx          ← LangProvider + useLang()
  auth-context.tsx          ← AuthProvider + useAuth()
  utils.ts                  ← formatDate, getTodayISO, getMonthNumber, etc.
  sample-data.ts            ← datos mock (solo referencia, no en producción)
  supabase/
    client.ts               ← createBrowserClient (singleton)
    server.ts               ← createServerClient (sin uso activo)
    types.ts                ← row shapes + mappers rowToBaby/rowToEntry/rowToChapter
    storage.ts              ← uploadEntryMedia()

Supabase — Schema
Tabla babies
Columna
Tipo
Notas
id
uuid PK
auto
name
text

birth_date
date

user_id
uuid
FK → auth.users
created_at
timestamptz

Tabla entries
Columna
Tipo
Notas
id
uuid PK

baby_id
uuid FK

date
date

type
text
text | photo | audio | mixed
content
text

media_urls
text[]
URLs públicas de Supabase Storage
tags
text[]
primera vez | milestone | gracioso | familia | salud
created_at
timestamptz

updated_at
timestamptz

Tabla chapters
Columna
Tipo
Notas
id
uuid PK

baby_id
uuid FK

month
int
número de mes de vida
period
text
ej: "Nov — Dic 2024"
status
text
collecting | draft | approved
voice
text
yo | nosotros | baby
generated_content
text
texto generado por IA
own_text_blocks
jsonb
bloques de texto propio del usuario
entry_ids
text[]
IDs de entries incluidos
created_at
timestamptz

updated_at
timestamptz

Storage — bucket entry-media
	•	Público (URLs accesibles sin auth)
	•	Políticas RLS: INSERT y SELECT habilitados
	•	Path: {baby_id}/{timestamp}_{filename}
RLS activo en todas las tablas
	•	Acceso basado en user_id del usuario autenticado

Auth Flow
Login → /login
  └─ signInWithOtp({ email, emailRedirectTo: /auth/callback })
       └─ Supabase envía magic link al email

Magic link → /auth/callback?code=...
  └─ Supabase browser client detecta ?code= automáticamente (PKCE)
       └─ onAuthStateChange dispara SIGNED_IN
            └─ router.replace("/")
                 └─ app/page.tsx detecta user + baby → /timeline
                                                 (o /onboarding si no hay baby)

Logout → signOut() en settings
  └─ supabase.auth.signOut()
  └─ localStorage.removeItem("fumi_baby")
  └─ router.push("/login")
Decisión clave: El callback es una página client-side (app/auth/callback/page.tsx), NO una route handler. Esto soluciona el problema de PKCE en browsers móviles (el in-app browser no comparte cookies con Safari).
Estado de la sesión: Supabase maneja tokens en cookies automáticamente con @supabase/ssr. La sesión persiste entre cierres de browser.

LocalStorage
Key
Contenido
Se limpia en
fumi_baby
{ id, name, birthDate, createdAt }
logout / signOut()
fumi_lang
"en" o "es"
nunca (persiste entre sesiones)
hydrateLocalBaby(userId) en auth-context.tsx re-hidrata fumi_baby desde Supabase si no está en localStorage (ej: primer login en dispositivo nuevo).

IA — OpenAI Integration
Chat (/api/chat/route.ts)
	•	Modelo: gpt-4o-mini
	•	max_tokens: 300, temperature: 0.8
	•	Historial: últimos 20 mensajes
	•	System prompt: fumi como asistente cálido, español neutro / inglés
Capítulos (/api/chapters/generate/route.ts)
	•	Modelo: gpt-4o-mini
	•	max_tokens: 1500, temperature: 0.8 (generación) / 0.7 (regeneración)
	•	3 flujos:
	1	Sin entries → placeholder estático
	2	Con entries → genera capítulo narrativo
	3	Con instruction + currentContent → reescribe según instrucción
	•	3 voces con system prompts distintos: yo, nosotros, baby
	•	Español neutro (no rioplatense)
Variables de entorno necesarias
NEXT_PUBLIC_SUPABASE_URL=https://xdfzhopzunoosmhlshcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=sk-proj-...
(En .env.local local + Vercel Environment Variables)

Deploy
	•	Repo: https://github.com/marianela-verdever/fumi.git
	•	Plataforma: Vercel
	•	URL producción: fumi-baby-story-app.vercel.app
	•	Branch: main → auto-deploy
	•	ESLint: deshabilitado en builds (eslint: { ignoreDuringBuilds: true })
	•	Supabase Auth — URLs configuradas:
	◦	Site URL: https://fumi-baby-story-app.vercel.app
	◦	Redirect URLs: incluye https://fumi-baby-story-app.vercel.app/auth/callback y http://localhost:3000/auth/callback

Decisiones arquitectónicas tomadas
	1	No Next.js Image component para fotos de usuario — se usa <img> directo para evitar complejidad con dominios remotos (ESLint warnings ignorados).
	2	Auth callback client-side en lugar de route handler — solución al bug de PKCE en mobile in-app browsers.
	3	localStorage como caché de baby — evita fetch a Supabase en cada render. hydrateLocalBaby lo sincroniza al hacer login en nuevo dispositivo.
	4	Español neutro en todos los system prompts de IA — no rioplatense, para funcionar en cualquier país hispanohablante.
	5	@supabase/ssr con createBrowserClient — único cliente en uso. server.ts existe pero no está en uso activo.
	6	Capítulos linkean entries por ID (entry_ids[]), no hay FK real — permite flexibilidad sin joins.

Bugs conocidos / Pendientes técnicos
Issue
Prioridad
Notas
Date picker en desktop
~~bug~~ resuelto
showPicker() + overlay
API key OpenAI compartida en chat
acción requerida
Regenerar en platform.openai.com y actualizar .env.local + Vercel
Audio / Whisper
no implementado
/api/transcribe es placeholder vacío
lib/supabase/server.ts
deuda técnica menor
Existe pero sin uso, se puede eliminar

Backlog resumido
Alta prioridad: batch import de momentos, audio + Whisper, Google OAuth Media: notificaciones semanales, fotos dentro de capítulos, export PDF mejorado Baja: compartir capítulos, múltiples bebés, dark mode, ilustraciones IA, búsqueda
