# StreamStore Backend (PhoenixMax)

API REST de StreamStore, una tienda de cuentas y pantallas de plataformas de streaming. El backend cubre registro e inicio de sesión con JWT, catálogo con stock calculado, carrito, compras con pago simulado y asignación de inventario, consulta de servicios con credenciales cifradas, alertas de vencimiento por correo con un job diario y la carga de inventario por parte del administrador.

## Stack

| Componente | Versión (package.json) |
|---|---|
| Node.js | 22 (`.nvmrc`) |
| TypeScript | ^5.9.3 |
| Express | ^5.1.0 |
| Sequelize / sequelize-typescript | ^6.37.7 / ^2.1.6 |
| mysql2 (MySQL 8) | ^3.14.4 |
| Zod | ^4.1.12 |
| jsonwebtoken | ^9.0.2 |
| bcrypt | ^6.0.0 |
| nodemailer | ^7.0.10 |
| node-cron | ^4.2.1 |
| winston | ^3.18.3 |
| tsx (desarrollo) | ^4.20.6 |

Las contraseñas de usuarios se guardan con bcrypt. Las contraseñas de las cuentas de streaming se cifran con AES-256-GCM (`src/utils/crypto.ts`).

## Requisitos

- Node.js 22 (si usas nvm: `nvm use`).
- MySQL 8 con un usuario que pueda crear bases de datos.
- Un cliente para ejecutar archivos SQL: `mysql` o MySQL Shell (`mysqlsh`).

## Instalación

1. Clonar e instalar dependencias:

```bash
git clone https://github.com/Sahiam1810/PhoenixMax-Backend.git
cd PhoenixMax-Backend
nvm use
npm install
```

2. Crear el archivo de entorno y completar los valores (ver [Variables de entorno](#variables-de-entorno)). Como mínimo `DB_PASSWORD`, `JWT_SECRET` y `AES_SECRET`:

```bash
cp .env.example .env
```

3. Crear la base de datos con el script base:

```bash
mysql -u root -p < database/streamstoreDb.sql
```

4. Aplicar las migraciones en orden de fecha:

```bash
mysql -u root -p streamstoreDb < database/migrations/20261105_indices_inventario.sql
mysql -u root -p streamstoreDb < database/migrations/20261106_carrito_on_delete.sql
mysql -u root -p streamstoreDb < database/migrations/20261109_renovar_servicio.sql
mysql -u root -p streamstoreDb < database/migrations/20261109_usuarios_activo.sql
```

Con MySQL Shell los pasos 3 y 4 son:

```bash
mysqlsh --sql --uri root@127.0.0.1:3306 -f database/streamstoreDb.sql
mysqlsh --sql --uri root@127.0.0.1:3306/streamstoreDb -f database/migrations/20261105_indices_inventario.sql
mysqlsh --sql --uri root@127.0.0.1:3306/streamstoreDb -f database/migrations/20261106_carrito_on_delete.sql
mysqlsh --sql --uri root@127.0.0.1:3306/streamstoreDb -f database/migrations/20261109_renovar_servicio.sql
mysqlsh --sql --uri root@127.0.0.1:3306/streamstoreDb -f database/migrations/20261109_usuarios_activo.sql
```

Las migraciones revisan si sus columnas, índices o llaves foráneas ya existen antes de crearlos, por lo que se pueden volver a ejecutar.
La migración de renovación mantiene `servicioIdIndice` sincronizada con triggers para conservar el índice único y permitir borrar servicios con `ON DELETE CASCADE`.

5. Cargar los datos semilla y arrancar:

```bash
npm run seed
npm run dev
```

6. Comprobar:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada: `{"message":"Servicio disponible","data":{"database":"connected"}}`.

## Variables de entorno

`process.env` solo se lee en `src/config/config.ts`. Si una variable no está definida se usa el valor por defecto de la tabla.

| Variable | Uso | Por defecto | Obligatoria |
|---|---|---|---|
| `NODE_ENV` | Entorno. Con `production` se exigen los secretos JWT. | `development` | No |
| `PORT` | Puerto HTTP. | `3000` | No |
| `CLIENT_URL` | URLs del front separadas por coma. Se usan para CORS; la primera también se usa en el enlace "Renovar" de los correos (`<url>/mi-cuenta`). | `http://localhost:5173` | No |
| `DB_HOST` | Host de MySQL. | `127.0.0.1` | No |
| `DB_PORT` | Puerto de MySQL. | `3306` | No |
| `DB_DATABASE` | Nombre de la base. | `streamstoreDb` | No |
| `DB_USERNAME` | Usuario de MySQL. | `root` | No |
| `DB_PASSWORD` | Contraseña de MySQL. | vacío | Según tu MySQL |
| `DB_TIMEZONE` | Zona con la que Sequelize guarda y lee fechas. | `-05:00` | No |
| `JWT_SECRET` | Firma de los tokens de acceso. | vacío | Sí en `production`. En desarrollo, si está vacío el login responde 500 y toda ruta protegida responde 401. |
| `JWT_REFRESH_SECRET` | Configurado pero ningún endpoint lo usa todavía. | vacío | Sí en `production` |
| `JWT_ACCESS_EXPIRES_IN` | Duración del token (formato de jsonwebtoken). | `8h` | No |
| `JWT_REFRESH_EXPIRES_IN` | Configurado pero sin uso todavía. | `7d` | No |
| `AES_SECRET` | Clave para cifrar las contraseñas de las cuentas de streaming. | ninguno | Sí, siempre. El servidor no arranca si falta o tiene menos de 32 caracteres. |
| `MAIL_HOST` | Host SMTP. | vacío | Para enviar correos |
| `MAIL_PORT` | Puerto SMTP. | `587` | Para enviar correos |
| `MAIL_USER` | Usuario SMTP. | vacío | Para enviar correos |
| `MAIL_PASS` | Contraseña SMTP. | vacío | Para enviar correos |
| `MAIL_FROM` | Remitente de los correos, por ejemplo `StreamStore <no-reply@streamstore.test>`. | vacío | Para enviar correos |
| `APP_TIMEZONE` | Zona horaria del cron y del cálculo de días de calendario de las alertas. Usar un nombre IANA. | `-05:00` (`.env.example` trae `America/Bogota`) | No |

Si `MAIL_PORT` existe en `.env` pero está vacío, el puerto queda en 0 (el valor por defecto solo aplica cuando la variable no existe). Ponle un valor o borra la línea.

Generar `JWT_SECRET`, `JWT_REFRESH_SECRET` y `AES_SECRET` (cada comando da 96 caracteres; ejecútalo una vez por variable):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Si cambias `AES_SECRET` después de sembrar, las contraseñas ya cifradas no se pueden descifrar y `/servicios/mios` responde 500. En ese caso vuelve a crear la base y a ejecutar el seed.

Datos SMTP de Mailtrap:

1. Crear una cuenta en https://mailtrap.io y entrar a Email Testing > Inboxes.
2. Abrir el inbox, pestaña SMTP Settings, y copiar host, puerto, usuario y contraseña.
3. Ponerlos en `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER` y `MAIL_PASS`. Usa el puerto 2525 o 587: el transporte no activa TLS directo, así que el 465 no funciona.

Sin datos SMTP la app funciona igual. Al ejecutar la revisión de vencimientos los envíos fallan, se cuentan en `errores` y se reintentan en la siguiente ejecución.

## Scripts de npm

| Script | Comando | Qué hace |
|---|---|---|
| `predev` | `tsx src/scripts/liberarProcesos.ts` | Se ejecuta solo antes de `dev`. Termina servidores anteriores de este backend (`tsx ... src/server.ts`) y el proceso node que ocupe `PORT`. |
| `dev` | `tsx watch src/server.ts` | Servidor en desarrollo con recarga. |
| `build` | `tsc` | Compila a `dist/`. |
| `start` | `node dist/server.js` | Ejecuta la versión compilada (requiere `build`). |
| `type-check` | `tsc --noEmit` | Valida tipos. |
| `seed` | `tsx src/seeds/seed.ts` | Carga los datos semilla. |
| `demo:reset` | `tsx src/seeds/demoReset.ts` | Vuelve a dejar los dos servicios de demo a 3 días y 1 día de vencer y borra sus notificaciones. |

## Datos semilla

`npm run seed` crea lo que falta y no duplica nada al repetirse (usa `findOrCreate`). Los servicios solo se crean si la tabla `servicios` está vacía. El seed no devuelve a "disponible" el inventario que ya se vendió.

Usuarios de prueba:

| Correo | Contraseña | Rol |
|---|---|---|
| admin@streamstore.test | Admin123* | admin |
| cliente1@streamstore.test | Cliente123* | cliente |
| cliente2@streamstore.test | Cliente123* | cliente |

Plataformas, con un producto `cuenta` y uno `pantalla` de 30 días cada una:

| Plataforma | Pantallas por cuenta | Precio cuenta | Precio pantalla |
|---|---|---|---|
| Netflix | 5 | 60000.00 | 15000.00 |
| Disney+ | 4 | 45000.00 | 12000.00 |
| Prime Video | 3 | 35000.00 | 12000.00 |
| Max | 4 | 50000.00 | 14000.00 |

Inventario: 3 cuentas por plataforma (12 en total) con sus pantallas (48 en total). Las credenciales son ficticias: correo `<plataforma><n>@streamstore.test` y contraseña `Clave-<plataforma>-<n>`, por ejemplo `netflix1@streamstore.test` / `Clave-netflix-1`.

Servicios sembrados, cada uno con su compra pagada:

| Cliente | Servicio | Vence en |
|---|---|---|
| cliente1 | Netflix pantalla | 3 días |
| cliente2 | Disney+ pantalla | 1 día |
| cliente1 | Max cuenta | 20 días |
| cliente2 | Max cuenta | 12 días |

Stock resultante: Netflix cuenta 2 / pantalla 14, Disney+ cuenta 2 / pantalla 11, Prime Video cuenta 3 / pantalla 9, Max cuenta 1 / pantalla 4. Max cuenta es el producto con stock bajo.

## Endpoints

Prefijo `/api`. Las rutas con token usan `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | /health | Público | Estado del servidor y la base (503 si la base no responde). |
| POST | /auth/register | Público | Registra un cliente. |
| POST | /auth/login | Público | Devuelve `token` y `usuario`. |
| GET | /auth/me | Token | Usuario del token. |
| GET | /plataformas | Público | Plataformas activas. |
| GET | /productos | Público | Productos activos con stock. Paginado; filtros `plataforma` y `tipo`. |
| GET | /productos/:id | Público | Detalle de un producto con stock. |
| GET | /carrito | Cliente | Carrito con stock por ítem y total. |
| POST | /carrito | Cliente | Agrega un producto o suma la cantidad. |
| PATCH | /carrito/:itemId | Cliente | Cambia la cantidad de un ítem. |
| DELETE | /carrito/:itemId | Cliente | Quita un ítem. |
| DELETE | /carrito | Cliente | Vacía el carrito. |
| POST | /compras | Cliente | Crea una compra pendiente desde el carrito. |
| POST | /compras/:id/pagar | Cliente | Paga (simulado) y asigna inventario. |
| GET | /compras/mias | Cliente | Compras del cliente, paginadas. |
| GET | /compras/:id | Cliente | Detalle de una compra propia. |
| GET | /servicios/mios | Cliente | Servicios con credenciales, días restantes y estado. |
| GET | /admin/cuentas | Admin | Inventario de cuentas, paginado; filtros `plataforma` y `estado`. |
| POST | /admin/cuentas | Admin | Crea una cuenta y sus pantallas. |
| POST | /admin/cron/ejecutar | Admin | Ejecuta la revisión de vencimientos. |
| GET, POST | /admin/plataformas | Admin | No implementado (501). |
| PATCH, DELETE | /admin/plataformas/:id | Admin | No implementado (501). |
| GET, POST | /admin/productos | Admin | No implementado (501). |
| PATCH, DELETE | /admin/productos/:id | Admin | No implementado (501). |
| GET | /admin/compras | Admin | No implementado (501). |
| GET | /admin/resumen | Admin | No implementado (501). |

Bodies (validados con Zod):

| Ruta | Body |
|---|---|
| POST /auth/register | `{ "nombre": string, "email": correo, "password": mínimo 8, "telefono"?: string }` |
| POST /auth/login | `{ "email": correo, "password": string }` |
| POST /carrito | `{ "productoId": entero > 0, "cantidad": 1 a 100 }` |
| PATCH /carrito/:itemId | `{ "cantidad": 1 a 100 }` |
| POST /compras/:id/pagar | Opcional: `{ "metodoPago": "simulado" }` |
| POST /admin/cuentas | `{ "plataformaId": entero > 0, "emailAcceso": correo (máx. 160), "passwordAcceso": 8 a 255 }` |

Paginación (`/productos`, `/compras/mias`, `/admin/cuentas`): `page` (por defecto 1) y `limit` (por defecto 10, máximo 50).

### Formato de respuesta

Éxito (200 o 201):

```json
{ "message": "Productos obtenidos", "data": {} }
```

Listados paginados: `data` es `{ previousPage, currentPage, nextPage, total, totalPages, limit, data: [] }`.

Errores: `{ "error": "<mensaje>" }`. La validación agrega `errors` por campo.

| Status | Mensajes reales |
|---|---|
| 400 | `Datos inválidos` (con `errors`), `JSON inválido`, `El carrito está vacío`, `El producto está agotado`, `Solo hay N unidades disponibles`, `Solo hay N unidades disponibles y ya tienes M en el carrito`, `El producto ya no está disponible`, `La compra no tiene productos`, `La plataforma está inactiva` |
| 401 | `Token requerido`, `Token inválido o vencido`, `Credenciales incorrectas` |
| 403 | `No tienes permiso` |
| 404 | `Ruta no encontrada`, `Producto no encontrado`, `Ítem no encontrado`, `Compra no encontrada`, `Usuario no encontrado`, `Plataforma no encontrada` |
| 409 | `El correo ya está registrado`, `La compra ya fue pagada`, `La compra fue cancelada. Vuelve a hacer el pedido desde tu carrito`, `<Plataforma tipo> ya no tiene stock suficiente. Ajusta tu carrito.`, `<Plataforma tipo> ya no está disponible. Ajusta tu carrito.`, `Ya existe una cuenta para esta plataforma con ese correo`, `Ya hay una revisión en curso` |
| 500 | `Error interno del servidor`, `No se pudieron obtener las credenciales` |
| 501 | `No implementado` |
| 503 | `Base de datos no disponible` (solo `/health`) |

## Reglas de negocio

Stock (`src/repositories/inventario/StockRepository.ts`):

- Producto `cuenta`: número de cuentas en estado `disponible` que tienen al menos una pantalla y ninguna vendida.
- Producto `pantalla`: número de pantallas `disponible` de cuentas en estado `disponible` o `parcial`.
- Solo se listan productos activos de plataformas activas.

Carrito y compra:

- El carrito no aparta stock. Al agregar o cambiar una cantidad se valida contra el stock actual.
- Al leer el carrito cada ítem trae `stock`, `agotado`, `excedeStock` y `noDisponible`. El total solo suma los ítems disponibles con stock.
- `POST /compras` vuelve a validar el carrito (409 si algo no está disponible o no alcanza), cancela las compras pendientes anteriores del cliente y crea una compra `pendiente` con los precios actuales. No toca el inventario.

Pago y asignación (`ComprasService.pagar` y `planificarAsignacion.ts`):

- Todo ocurre en una transacción (READ COMMITTED). Se bloquea la compra con `SELECT ... FOR UPDATE`. Si ya está pagada o cancelada responde 409.
- Por cada plataforma, en orden de id, se bloquean (`FOR UPDATE`) sus cuentas y pantallas ordenadas por id.
- Cuentas completas: se asignan las primeras cuentas `disponible` con todas sus pantallas disponibles, por id ascendente. La cuenta y todas sus pantallas pasan a `vendida`.
- Pantallas: primero se usan las pantallas libres de cuentas `parcial` y luego las de cuentas `disponible` no asignadas completas, por id de cuenta y de pantalla. La pantalla pasa a `vendida` y una cuenta `disponible` pasa a `parcial`.
- Si falta inventario para cualquier ítem responde 409 y no se modifica nada.
- Se crea un servicio por unidad comprada con `fechaInicio` igual a la fecha del pago y `fechaVencimiento` igual al pago más `duracionDias`. La compra pasa a `pagada` con `pagadaAt` y el carrito se vacía.
- Ante un deadlock de MySQL (errno 1213) el pago se reintenta hasta 2 veces.

Servicios (`GET /servicios/mios`):

- Solo aparecen servicios de compras `pagada`, ordenados por `fechaVencimiento` y luego por id.
- `diasRestantes` = días que faltan redondeados hacia arriba, mínimo 0.
- `estado` se calcula con la fecha, no con la columna: `vencido` si la fecha ya pasó, `por_vencer` si faltan 3 días o menos, `activo` en otro caso.
- Si no está vencido, la contraseña se descifra; `nombrePerfil` y `pin` solo vienen en servicios de tipo pantalla. Si está vencido, `emailAcceso`, `passwordAcceso`, `nombrePerfil` y `pin` llegan en null.
- La respuesta lleva `Cache-Control: no-store`.

Vencimientos y correos (`VencimientosService`):

- El job corre todos los días a las 08:00 (`0 8 * * *`) en la zona de `APP_TIMEZONE`. `POST /admin/cron/ejecutar` ejecuta la misma revisión.
- Revisa los servicios con estado `activo` de compras pagadas. Compara días de calendario en `APP_TIMEZONE`: 3 días genera el aviso `3_dias`, 1 día `1_dia` y el mismo día `vencido`. Los asuntos son "vence en 3 días", "vence mañana", "vence hoy" o "venció hoy" si la hora ya pasó.
- Los correos se envían de a uno. Antes de cada envío se inserta la fila en `notificaciones`; el índice único `(servicioId, tipo)` impide repetir un aviso, también entre procesos. Si el envío falla, la fila se borra para reintentar en la siguiente ejecución.
- Después de enviar, los servicios con fecha vencida pasan a `vencido`. Vencer no libera cuentas ni pantallas.
- Los correos no incluyen credenciales e incluyen un botón "Renovar" hacia `<primera CLIENT_URL>/mi-cuenta`.
- Si ya hay una revisión en curso en el mismo proceso, responde 409.

Inventario (`POST /admin/cuentas`): la contraseña se cifra con AES y se generan `maxPantallas` pantallas (`Perfil 1`...`Perfil N`) con PIN aleatorio de 4 dígitos. Las respuestas de admin no incluyen la contraseña ni los PIN.

## Estructura

```
.
├── database/
│   ├── streamstoreDb.sql
│   └── migrations/
│       ├── 20261105_indices_inventario.sql
│       └── 20261106_carrito_on_delete.sql
├── docs/
│   ├── PhoenixMax.postman_collection.json
│   ├── PhoenixMax.postman_environment.json
│   └── prompts/
├── src/
│   ├── config/          config.ts, database.ts, zod.ts
│   ├── controllers/     auth, carrito, compras, plataformas, productos, servicios, admin/*
│   ├── interfaces/      tipos de las respuestas públicas
│   ├── jobs/            vencimientosJob.ts
│   ├── middlewares/     AuthMiddleware, RoleMiddleware, ValidateSchema, ErrorMiddleware, NotFoundMiddleware
│   ├── models/          Usuario, Plataforma, Producto, Cuenta, Pantalla, CarritoItem, Compra, CompraItem, Servicio, Notificacion
│   ├── repositories/    consultas por dominio (inventario, vencimientos, admin/*, ...)
│   ├── routes/          index.ts y un router por dominio
│   ├── scripts/         liberarProcesos.ts
│   ├── seeds/           seed.ts, demoReset.ts
│   ├── services/        reglas de negocio por dominio
│   ├── types/express/   tipo de req.user
│   ├── utils/           apiResponse, httpError, crypto, fechas, formatters, logger, mailer, pagination
│   ├── validators/      esquemas Zod por dominio
│   └── server.ts
├── .env.example
├── .nvmrc
├── contratoApi.md
├── package.json
└── tsconfig.json
```

Los errores también se escriben en `logs/errors.log`.

## Colección de Postman

Archivos en `docs/`:

- `PhoenixMax.postman_collection.json`: una carpeta por dominio y la carpeta "Flujo demo".
- `PhoenixMax.postman_environment.json`: `baseUrl` y las credenciales de prueba del seed.

Importar: en Postman, Import, seleccionar los dos archivos y elegir el entorno "PhoenixMax local". Los tokens e ids se guardan solos en variables de la colección (`tokenCliente`, `tokenAdmin`, `productoId`, `itemId`, `compraId`, `plataformaId`).

Para las carpetas por dominio, ejecuta primero "Login cliente" y "Login admin" en Auth. "Flujo demo" se corre completa con el Collection Runner sin editar nada. Cada corrida registra un cliente nuevo (`demo<timestamp>@streamstore.test`), compra una pantalla de Netflix y una de Disney+ y crea una cuenta de Disney+. Con el seed se puede repetir unas 14 veces antes de agotar las pantallas de Netflix.

## Guía de demo

Preparación (con el servidor detenido o en marcha):

```bash
npm run seed
npm run demo:reset
npm run dev
```

`demo:reset` deja la pantalla de Netflix de cliente1 a 3 días de vencer y la de Disney+ de cliente2 a 1 día, con estado `activo`, y borra sus notificaciones para poder enviar los correos otra vez.

Orden de la presentación (carpeta "Flujo demo" de Postman):

1. Registro de un cliente nuevo y login: mostrar el token y que la respuesta no trae `passwordHash`.
2. Catálogo `GET /productos`: stock por producto; Max cuenta con stock 1.
3. Agregar una pantalla de Netflix y una de Disney+ al carrito; ver el carrito con `totalItems` y `total`.
4. Crear la compra (estado `pendiente`) y pagarla (estado `pagada`). Volver a `GET /productos` para mostrar que bajó el stock.
5. `GET /servicios/mios`: credenciales descifradas, perfil, PIN y días restantes. Con cliente1 se ven además los servicios sembrados (Netflix `por_vencer` a 3 días).
6. `GET /compras/mias`.
7. Login de admin, crear una cuenta en `POST /admin/cuentas` (se generan sus pantallas) y listar el inventario con filtros.
8. Correo: `POST /admin/cron/ejecutar` con el token de admin. Con datos de Mailtrap llegan 2 correos: "Tu pantalla de Netflix vence en 3 días" a cliente1 y "Tu pantalla de Disney+ vence mañana" a cliente2. Si se ejecuta otra vez no se repiten; para repetir la demo usa `npm run demo:reset`.

## Estado actual

Implementado:

- Auth: registro, login con JWT y usuario actual.
- Catálogo: plataformas y productos con stock calculado.
- Carrito completo (ver, agregar, cambiar cantidad, quitar, vaciar).
- Compras: crear, pagar con asignación de inventario en transacción, listar y detalle.
- Servicios del cliente con credenciales descifradas y estado por fecha.
- Alertas de vencimiento por correo (job diario y endpoint manual) sin notificaciones repetidas.
- Admin: alta y listado del inventario de cuentas.
- Datos semilla, `demo:reset` y colección de Postman.

Pendiente:

- `/admin/plataformas`, `/admin/productos`, `/admin/compras` y `/admin/resumen` responden 501.
- No hay refresh token ni logout: `JWT_REFRESH_SECRET` y `JWT_REFRESH_EXPIRES_IN` están configurados pero sin uso.
- No hay pruebas automatizadas.
