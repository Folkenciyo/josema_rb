# JOSEMA RB

Plataforma para que un entrenador personal lleve a sus clientes: rutinas, dietas,
seguimiento del físico y entrega de todo en PDF o Word.

No es un SaaS ni pretende serlo. Es la herramienta de trabajo de **un** entrenador:
un solo usuario, sus clientes y sus planes, sin registro público ni multiempresa.

En producción: **https://josema.fholk.com**

---

## Qué hace

**Clientes**
Ficha con datos de contacto (pulsables desde el móvil: email, teléfono y WhatsApp),
objetivos y notas. Baja sin pérdida: desactivar un cliente conserva todo su historial,
y reactivarlo lo devuelve al listado tal y como estaba.

**Panel de avisos**
La portada abre con lo que reclama atención: quién no tiene rutina o dieta activa, qué
planes se acaban esta semana (o ya vencieron sin archivarse), quién lleva más de un mes
sin pesarse y quién está de baja, con un botón para reactivarlo ahí mismo. Los clientes
dados de alta hace menos de un mes no cuentan como "sin pesarse": aún no les ha dado
tiempo.

**Entrenamiento**
Librería de **873 ejercicios** traducidos al español con imágenes, más los que el
entrenador añada con su propia foto. Los planes se estructuran en plan → semanas →
días → ejercicios, con series, repeticiones, descanso, tempo y superseries. Una semana
se duplica en un clic y los días sin ejercicios son descanso, sin más.

**Dieta**
Catálogo de **605 alimentos** con ficha nutricional completa de etiqueta europea
(calorías, proteína, hidratos, azúcares, grasas, saturadas, fibra y sal). Los alimentos
se agrupan en comidas reutilizables y estas en menús de día, que se asignan a los días
de la semana de golpe. Las macros se calculan solas al indicar la cantidad real
("150 g", "2 unidades") y se guardan como foto fija: editar un alimento después no
altera los menús ya montados.

**Seguimiento corporal**
Historial de pesajes con IMC y gráfica de evolución, y fotos de progreso frontal,
lateral y trasera por fecha, con galería y un comparador que enfrenta dos momentos
pose con pose, mostrando bajo cada foto el peso de ese día.

**Portal del cliente**
Cada cliente tiene un enlace privado propio (`/p/<token>`) que abre sin contraseña y
está pensado para el móvil: su rutina con las fotos de cada ejercicio, sus menús con las
macros del día y su histórico de peso con gráfica, más la descarga en PDF o Word. Todo
en solo lectura y siempre al día, porque sale de la misma base que ve el entrenador.

El cliente solo puede escribir dos cosas: su peso del día —siempre con la fecha de hoy,
y si lo apunta dos veces la segunda corrige a la primera en lugar de duplicar el día— y
el **cuestionario inicial**. Las fotos las sigue subiendo solo el entrenador.

**Cuestionario inicial**
Las preguntas las escribe el entrenador en Ajustes, las que quiera y en el orden que
quiera, eligiendo el tipo de respuesta (corta, larga, número, sí/no o una lista de
opciones) y cuáles son obligatorias. El cliente lo rellena desde su enlace y puede
volver y corregirlo. Cada respuesta guarda **la pregunta tal y como se le hizo**: si el
entrenador reescribe o borra una pregunta después, lo ya contestado se queda intacto y
solo pierde el vínculo con la pregunta viva.

El enlace se entrega desde la propia ficha, por WhatsApp o por email. El mensaje sale ya
montado con el nombre del cliente y su enlace, y **el entrenador escribe el suyo** en
Ajustes con los comodines `{nombre}`, `{nombre_completo}`, `{enlace}` y `{entrenador}`,
uno para WhatsApp y otro para el correo. Antes de enviar, el texto sigue siendo
editable en la ficha para el retoque de ese cliente concreto, que no merece cambiar la
plantilla. Vaciar un campo en Ajustes recupera el texto de fábrica. WhatsApp abre el
chat con el borrador puesto y además deja el texto en el portapapeles, porque la
aplicación de escritorio no siempre respeta el borrador.

El token es de 32 bytes, no caduca, se regenera cuando hace falta —el anterior muere en
ese mismo instante— y se anula de un clic. Ninguna ruta del portal acepta un
identificador de cliente: todo se resuelve desde el token, así que un enlace nunca puede
alcanzar los datos de otra persona. Las respuestas tampoco llevan ids internos ni las
notas privadas del entrenador. Dar de baja a un cliente cierra su enlace sin tocarlo.

**Entrega al cliente**
Cualquier plan de entrenamiento o dieta se descarga en PDF o Word, con las imágenes
de los ejercicios y los totales de macros por comida y por día.

**Aplicación instalable**
Son **dos aplicaciones instalables**, no una: el entrenador instala JOSEMA RB entera y
cada cliente instala su propio enlace, con su icono aparte, porque el manifiesto se
genera por token y arranca en `/p/<token>`. Las dos pueden convivir en el mismo móvil.
La invitación a instalar aparece en la portada de cada una y desaparece sola en cuanto
la aplicación corre desde la pantalla de inicio; en iPhone, donde el navegador no
ofrece el diálogo, explica los dos toques que hacen falta.

Sin cobertura —el caso del gimnasio— sigue viéndose todo lo ya abierto: rutina, dieta,
menús y las fotos de los ejercicios. Con red se pide siempre la versión fresca y solo
se recurre a la copia guardada si la respuesta tarda más de tres segundos y medio o no
llega. Lo que nunca se guarda: la sesión, las descargas en PDF y cualquier escritura.
Apuntar el peso sin cobertura falla y lo dice, en lugar de fingir que se ha guardado.

---

## Arquitectura

Todo vive detrás de **un único dominio**. El navegador solo habla con el frontend, que
reenvía `/api` y `/static` al backend por la red interna de Docker.

```mermaid
flowchart LR
    B[Navegador] -->|HTTPS, un solo origen| T[Traefik]
    T --> F["Next.js<br/>src/proxy.ts"]
    F -->|red interna| A["FastAPI"]
    A --> P[(PostgreSQL)]
    A --> V1[["volumen<br/>exercise_images"]]
    A --> V2[["volumen<br/>client_photos"]]
```

Esa decisión es la que sostiene el resto: como no hay cambio de origen, la cookie de
sesión (`httpOnly`, `Secure`) viaja sola en cada petición, no hace falta CORS ni
`SameSite=None`, y un `<img src="/api/photos/…">` se autentica sin escribir una línea
de JavaScript.

El proxy vive en `frontend/src/proxy.ts` (el middleware de Next 16) y **no** en
`rewrites()` de `next.config.ts`: los rewrites se evalúan al construir la imagen, así
que el destino se quedaba congelado dentro del contenedor.

### Stack

| Capa            | Tecnología                                                                               |
| --------------- | ---------------------------------------------------------------------------------------- |
| Backend         | FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · uv                                      |
| Frontend        | Next.js 16 (App Router) · TypeScript · Tailwind v4 · React Query · React Hook Form + Zod |
| Base de datos   | PostgreSQL 16                                                                            |
| Documentos      | WeasyPrint (PDF) · python-docx (Word)                                                    |
| Imágenes        | Pillow                                                                                   |
| Infraestructura | Docker Compose · Dokploy · Traefik                                                       |

En números: **80 endpoints**, **19 tablas**, 8 migraciones y ~18.000 líneas entre
`backend/app` y `frontend/src`.

---

## Modelo de datos

```mermaid
erDiagram
    TRAINER ||--o{ CLIENT : "lleva"
    TRAINER ||--o{ EXERCISE : "crea"
    TRAINER ||--o{ FOOD : "crea"
    CLIENT ||--o{ TRAINING_PLAN : ""
    CLIENT ||--o{ DIET_PLAN : ""
    CLIENT ||--o{ MEASUREMENT : "pesajes"
    CLIENT ||--o{ PHOTO : "fotos"
    CLIENT ||--o{ ANSWER : "cuestionario"
    TRAINER ||--o{ QUESTION : "pregunta"
    QUESTION |o--o{ ANSWER : "contestada (copia el enunciado)"
    TRAINING_PLAN ||--o{ TRAINING_WEEK : ""
    TRAINING_WEEK ||--o{ TRAINING_DAY : ""
    TRAINING_DAY ||--o{ DAY_EXERCISE : ""
    DAY_EXERCISE }o--|| EXERCISE : "referencia"
    DIET_PLAN ||--o{ DIET_WEEK : ""
    DIET_WEEK ||--o{ DIET_DAY : ""
    DIET_DAY }o--o| MENU : "menú del día"
    MENU ||--o{ MENU_MEAL : ""
    MENU_MEAL }o--|| MEAL_TEMPLATE : ""
    MEAL_TEMPLATE ||--o{ MEAL_ITEM : ""
    MEAL_ITEM }o--o| FOOD : "referencia"
```

Dos ideas que explican el diagrama:

- **Los menús son reutilizables.** Un día de dieta no contiene comidas: apunta a un
  menú. "El mismo menú toda la semana" es el mismo `menu_id` siete veces.
- **Las macros se copian, no se calculan en vivo.** Cada línea de una comida guarda
  sus valores en el momento de crearla, así que corregir un alimento no reescribe
  dietas ya entregadas.

---

## Puesta en marcha

Requisitos: Docker y, para trabajar en el código, [uv](https://docs.astral.sh/uv/) y
Node 20+.

### Todo en Docker

```bash
docker compose up -d --build
```

El contenedor del backend, al arrancar, aplica las migraciones y siembra los 873
ejercicios, la cuenta del entrenador y los 605 alimentos. Los tres pasos son
idempotentes: reiniciar no duplica nada.

| Servicio   | URL                                    |
| ---------- | -------------------------------------- |
| Frontend   | http://localhost:3001                  |
| API        | http://localhost:8001/docs             |
| PostgreSQL | `localhost:5432` (`josema` / `josema`) |

Credenciales de desarrollo: **`trainer@example.com`** / **`change-me`**.

### Desarrollo con recarga en caliente

```bash
docker compose up -d db                 # solo la base de datos

cd backend
uv sync
uv run alembic upgrade head
uv run python -m scripts.seed_exercises # y seed_trainer, seed_foods
uv run uvicorn app.main:app --reload --port 8000

cd frontend
npm install
BACKEND_URL=http://localhost:8000 npm run dev
```

> Los scripts de `backend/scripts/` se ejecutan **como módulo**
> (`python -m scripts.seed_trainer`), nunca como archivo suelto: importan de `app.` y
> necesitan `backend/` en el `PYTHONPATH`.

---

## Comandos

```bash
# Backend
uv run pytest                 # 105 tests
uv run ruff check .
uv run alembic upgrade head
uv run alembic revision -m "..."

# Frontend
npm run test                  # 144 tests
npm run lint
npm run build
npx tsc --noEmit
```

Los tests de backend necesitan PostgreSQL levantado: cada test corre dentro de una
transacción que se revierte al terminar, así que no ensucian la base.

Tres tests de exportación a PDF se saltan solos en máquinas sin las librerías nativas
de WeasyPrint (Pango, Cairo), que en Windows no están de serie. No es un fallo.

---

## Despliegue

Se despliega en **Dokploy** desde `docker-compose.prod.yml`. Cada push a `main` lanza
el despliegue automáticamente a través de la integración con GitHub.

Diferencias con el compose de desarrollo:

- Sin puertos publicados: Traefik llega por la red de Docker, y los puertos del host
  chocarían con los otros proyectos del servidor.
- `COOKIE_SECURE=true`, porque Traefik termina el TLS.
- Los secretos vienen del entorno, sin valores por defecto:
  `POSTGRES_PASSWORD`, `JWT_SECRET`, `TRAINER_EMAIL`, `TRAINER_PASSWORD`.
- Tres volúmenes que deben sobrevivir a cualquier redespliegue: `pgdata`,
  `exercise_images` (fotos que sube el entrenador) y `client_photos` (fotos de
  progreso, irremplazables).

Solo el frontend necesita dominio. Las migraciones y los seeds se aplican al arrancar
el contenedor, así que desplegar es empujar a `main` y esperar.

---

## Decisiones que conviene conocer antes de tocar nada

Casi todas nacieron de un problema real en producción.

**Los servicios del compose llevan prefijo (`josema-db`, `josema-backend`, …).**
Dokploy conecta todos los stacks del servidor a la misma red compartida, así que un
nombre genérico como `backend` resuelve al contenedor de **otro** proyecto que
registrase ese alias antes. Pasó: el frontend acabó hablando con el backend de otro
proyecto y toda la API devolvía 404.

**El frontend fija `HOSTNAME=0.0.0.0` en su Dockerfile.**
El servidor standalone de Next escucha en `$HOSTNAME`, y Docker inyecta ahí el id del
contenedor. Ese nombre resuelve a una sola IP, de modo que el contenedor atendía por
una de sus dos redes y dejaba muda la otra, justo por la que entra Traefik: Bad Gateway
con la aplicación perfectamente viva.

**WeasyPrint se importa dentro de la función, no al principio del módulo.**
Enlaza con librerías nativas que en Windows no existen; con un import normal, arrancar
la aplicación (y por tanto toda la suite de tests) fallaría en local.

**El IMC no se guarda en la base de datos.**
Se deriva de la altura del cliente al leer, así que corregir una altura mal apuntada
arregla el histórico entero de una vez.

**Las fotos de los clientes viven fuera de `app/static`.**
Ese directorio se sirve sin pedir sesión. Las fotos corporales salen por un endpoint
autenticado, se redimensionan a 1600 px y se les borran los metadatos EXIF, que
incluyen las coordenadas GPS de dónde se tomó la foto.

**Los ejercicios importados están protegidos; los alimentos precargados no.**
Editar o borrar un ejercicio de la librería base devuelve 403. Los 605 alimentos
sembrados, en cambio, son del entrenador y puede tocarlos libremente: fue una decisión
expresa de producto.

**La contraseña usa `bcrypt` directamente, sin `passlib`.**
`passlib` está sin mantenimiento y es incompatible con bcrypt ≥ 4.1.

**El token del portal se guarda en claro, no hasheado.**
Un hash obligaría a regenerar el enlace cada vez que el entrenador quisiera volver a
enviárselo al cliente meses después, que es justo el caso de uso. El token no da acceso
a la cuenta del entrenador ni permite escribir nada, se anula de un clic y la página
que abre lleva `noindex`. Si algún día se filtrase la base de datos habría que
regenerar todos los enlaces, y con eso quedaría cerrado.

**Cerrar sesión le pide al service worker que borre lo que cacheó.**
Sin eso, un móvil en modo avión seguiría mostrando la lista de clientes desde la caché
después de haber salido de la cuenta. Se borran los datos y las pantallas visitadas; la
página de «sin conexión» sobrevive, porque no guarda nada personal y solo se precarga
al instalar el worker.

**El service worker no se registra en desarrollo.**
Cachearía los chunks de `next dev` y pelearía con la recarga en caliente. Para probarlo
hay que levantar `npm run build && npm start`, que además es el único modo en que el
navegador considera la aplicación instalable.

**El límite de intentos del portal vive en memoria del proceso.**
Veinte fallos por IP cada cinco minutos, contando solo los que fallan, así que un
cliente recargando su enlace no se bloquea nunca. Si la API llegara a correr en varias
réplicas habría que moverlo a Redis: cada réplica contaría por su cuenta.

---

## Estructura

```
backend/
├── app/
│   ├── api/            # routers FastAPI
│   ├── core/           # configuración, seguridad, sesión de BD
│   ├── models/         # SQLAlchemy
│   ├── schemas/        # Pydantic
│   ├── repositories/   # acceso a datos
│   ├── services/       # lógica de negocio
│   ├── templates/pdf/  # plantillas de los documentos
│   ├── alembic/        # migraciones
│   └── tests/
└── scripts/            # seeds e importación de datos

frontend/
├── public/
│   ├── sw.js           # service worker: caché offline
│   └── icons/          # iconos de la aplicación instalable
└── src/
    ├── app/            # rutas (App Router)
    ├── components/     # UI por dominio
    ├── hooks/          # React Query
    ├── lib/            # cliente HTTP y lógica pura (con sus tests)
    ├── types/
    └── proxy.ts        # middleware: reenvía /api y /static al backend
```

La lógica que merece la pena probar vive en `frontend/src/lib/` como funciones puras
—borradores de semana, cálculo de macros, agrupación de fotos, evolución del peso— y
los componentes solo la llaman. Por eso hay tests de frontend que no montan ni un
componente.
