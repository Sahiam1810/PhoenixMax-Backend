# Contrato de la API: StreamStore (PhoenixMax)

Documento compartido entre backend y frontend. Si algo cambia, se avisa y se actualiza aquí en el mismo PR.

Estado: propuesta para acordar. Los puntos marcados con (DECIDIR) hay que confirmarlos entre los dos antes de programar.

## 1. Convenciones generales

- URL base: `http://localhost:3000/api`
- Formato: JSON en peticiones y respuestas.
- Nombres de propiedades en **camelCase** (`productoId`, `maxPantallas`, `fechaVencimiento`).
- Autenticación: header `Authorization: Bearer <token>`. El token llega en la respuesta del login.
- Los `id` son números.
- Dinero: llega como **string** con dos decimales (`"60000.00"`). El front lo convierte para mostrarlo.
- Fechas: ISO 8601 (`"2026-11-08T14:30:00.000Z"`).
- `message` va en español y pensado para mostrarlo al usuario.

### Respuesta exitosa (200 / 201)

```json
{ "message": "Producto agregado al carrito", "data": { } }
```

### Listado paginado

Se pide con `?page=1&limit=10`.

```json
{
    "message": "Compras obtenidas",
    "data": {
        "previousPage": null,
        "currentPage": 1,
        "nextPage": 2,
        "total": 25,
        "totalPages": 3,
        "limit": 10,
        "data": []
    }
}
```

### Errores

| Caso | Status | Cuerpo |
|---|---|---|
| Datos inválidos (Zod) | 400 | `{ "error": "Datos inválidos", "errors": { "email": ["Correo inválido"] } }` |
| Sin token o token inválido | 401 | `{ "error": "Token requerido" }` |
| Sin permiso (rol) | 403 | `{ "error": "No tienes permiso" }` |
| No encontrado | 404 | `{ "error": "Producto no encontrado" }` |
| Conflicto (duplicado, sin stock) | 409 | `{ "error": "Netflix pantalla ya no tiene stock suficiente" }` |
| Error inesperado | 500 | `{ "error": "Error interno del servidor" }` |

Regla para el front: si la respuesta no es 2xx, mostrar `error`. Si trae `errors`, mostrar el mensaje de cada campo.

## 2. Estados y reglas que el front debe conocer

- `tipo` de producto: `"cuenta"` o `"pantalla"`.
- `stock`: lo calcula el backend. Si es `0`, el producto está agotado y no se puede comprar (`agotado: true`).
- El carrito **no aparta stock**. El stock se valida de nuevo al pagar.
- Estado de un servicio en `/servicios/mios`: `"activo"` (faltan más de 3 días), `"por_vencer"` (3 días o menos) y `"vencido"`. Lo calcula el backend; en la base solo existen activo y vencido.
- Las credenciales (`emailAcceso`, `passwordAcceso`, `nombrePerfil`, `pin`) solo se ven en `/servicios/mios`, y solo de compras pagadas.
- Roles: `"cliente"` y `"admin"`. Las rutas `/admin/*` solo para admin.
- Estados de compra: `"pendiente"`, `"pagada"`, `"cancelada"`.

## 3. Autenticación

### POST /auth/register (público)

Body:
```json
{ "nombre": "Ana Pérez", "email": "ana@correo.com", "password": "Clave123*", "telefono": "3001234567" }
```
`telefono` es opcional. Respuesta 201:
```json
{ "message": "Usuario registrado", "data": { "id": 4, "nombre": "Ana Pérez", "email": "ana@correo.com", "telefono": "3001234567", "rol": "cliente" } }
```
Errores: 400 datos inválidos, 409 correo ya registrado.

### POST /auth/login (público)

Body: `{ "email": "ana@correo.com", "password": "Clave123*" }`

Respuesta 200:
```json
{
    "message": "Sesión iniciada",
    "data": {
        "token": "eyJhbGciOi...",
        "usuario": { "id": 4, "nombre": "Ana Pérez", "email": "ana@correo.com", "telefono": "3001234567", "rol": "cliente" }
    }
}
```
Errores: 401 credenciales incorrectas.

### GET /auth/me (cliente o admin)

Respuesta 200: `data` es el objeto `usuario` de arriba.

## 4. Catálogo (público)

### GET /plataformas

```json
{ "message": "Plataformas obtenidas", "data": [
    { "id": 1, "nombre": "Netflix", "descripcion": "Series, películas y documentales", "logoUrl": null, "maxPantallas": 5 }
] }
```

### GET /productos

Query opcional: `?plataforma=<plataformaId>&tipo=cuenta|pantalla`. Sin paginación.

```json
{ "message": "Productos obtenidos", "data": [
    {
        "id": 2,
        "plataformaId": 1,
        "tipo": "pantalla",
        "duracionDias": 30,
        "precio": "15000.00",
        "stock": 14,
        "agotado": false,
        "plataforma": { "id": 1, "nombre": "Netflix", "logoUrl": null }
    }
] }
```

### GET /productos/:id

Mismo objeto de arriba en `data`. Error 404 si no existe.

## 5. Carrito (cliente)

Todas las respuestas del carrito devuelven el **carrito completo actualizado**, para que el front refresque lista, total y contador con una sola respuesta.

```json
{
    "message": "Carrito obtenido",
    "data": {
        "items": [
            {
                "id": 7,
                "productoId": 2,
                "cantidad": 2,
                "precioUnitario": "15000.00",
                "subtotal": "30000.00",
                "stock": 14,
                "producto": { "tipo": "pantalla", "duracionDias": 30, "plataforma": { "nombre": "Netflix", "logoUrl": null } }
            }
        ],
        "total": "30000.00",
        "totalItems": 2
    }
}
```

`totalItems` es la suma de cantidades (es el número del ícono del carrito).

| Método | Ruta | Body | Notas |
|---|---|---|---|
| GET | /carrito | | |
| POST | /carrito | `{ "productoId": 2, "cantidad": 1 }` | Si el producto ya está, suma la cantidad. 409 si supera el stock. |
| PATCH | /carrito/:itemId | `{ "cantidad": 3 }` | 409 si supera el stock. |
| DELETE | /carrito/:itemId | | Quita un ítem. |
| DELETE | /carrito | | Vacía el carrito. |

## 6. Compras (cliente)

### POST /compras (checkout)

Sin body: usa el carrito del usuario. Crea la compra en estado `pendiente`. Respuesta 201:

```json
{
    "message": "Compra creada",
    "data": {
        "id": 12,
        "estado": "pendiente",
        "total": "30000.00",
        "metodoPago": null,
        "pagadaAt": null,
        "createdAt": "2026-11-05T15:00:00.000Z",
        "items": [
            { "id": 20, "productoId": 2, "cantidad": 2, "precioUnitario": "15000.00", "subtotal": "30000.00",
              "producto": { "tipo": "pantalla", "duracionDias": 30, "plataforma": { "nombre": "Netflix" } } }
        ]
    }
}
```
Errores: 400 si el carrito está vacío.

### POST /compras/:id/pagar

Pago simulado. Body opcional: `{ "metodoPago": "simulado" }`. Respuesta 200: la compra con `estado: "pagada"` y `pagadaAt`.

Si algún producto ya no tiene stock: **409** y no se cobra nada.
```json
{ "error": "Netflix pantalla ya no tiene stock suficiente. Ajusta tu carrito." }
```
Si la compra ya estaba pagada: 409.

### GET /compras/mias

Paginado (`?page=&limit=`). Cada elemento de `data.data` es una compra como la de arriba.

### GET /compras/:id

Detalle de una compra propia. 404 si no existe o no es del usuario.

## 7. Servicios (cliente)

### GET /servicios/mios

Sin paginación. Ordenado por vencimiento.

```json
{ "message": "Servicios obtenidos", "data": [
    {
        "id": 1,
        "plataforma": { "nombre": "Netflix", "logoUrl": null },
        "tipo": "pantalla",
        "emailAcceso": "netflix1@streamstore.test",
        "passwordAcceso": "Clave-netflix-1",
        "nombrePerfil": "Perfil 1",
        "pin": "1011",
        "fechaInicio": "2026-10-09T15:00:00.000Z",
        "fechaVencimiento": "2026-11-08T15:00:00.000Z",
        "diasRestantes": 3,
        "estado": "por_vencer"
    }
] }
```
Si el servicio es una cuenta completa: `nombrePerfil` y `pin` llegan en `null`.

## 8. Administración (solo admin)

### POST /admin/cuentas

Carga una cuenta y genera sus pantallas automáticamente (según `maxPantallas` de la plataforma).

Body:
```json
{ "plataformaId": 1, "emailAcceso": "netflix9@streamstore.test", "passwordAcceso": "Clave-netflix-9" }
```
Respuesta 201: la cuenta con sus pantallas (sin `passwordAcceso`).

### GET /admin/cuentas

Paginado. Query opcional: `?plataformaId=&estado=disponible|parcial|vendida|inactiva`.

```json
{ "id": 1, "plataformaId": 1, "plataforma": { "nombre": "Netflix" }, "emailAcceso": "netflix1@streamstore.test",
  "estado": "parcial", "pantallasTotal": 5, "pantallasVendidas": 1,
  "pantallas": [ { "id": 1, "nombrePerfil": "Perfil 1", "pin": "1011", "estado": "vendida" } ] }
```
La contraseña de la cuenta no se devuelve en el listado del admin.

### Deseables (se definen cuando se vayan a hacer)

- CRUD `/admin/plataformas` y `/admin/productos` (el estado se cambia con `PATCH /:id/estado`; no se borra).
- `GET /admin/compras` con filtros y paginación.
- `GET /admin/resumen`: totales de ventas del día y del mes, y stock por plataforma.
- `POST /admin/cron/ejecutar`: corre la revisión de vencimientos a mano. Respuesta: `{ "message": "...", "data": { "notificacionesEnviadas": 2, "serviciosVencidos": 0 } }`.

## 9. Usuarios de prueba (datos semilla)

| Rol | Correo | Contraseña |
|---|---|---|
| admin | admin@streamstore.test | Admin123* |
| cliente | cliente1@streamstore.test | Cliente123* |
| cliente | cliente2@streamstore.test | Cliente123* |

## 10. Puntos para decidir entre los dos (DECIDIR)

1. Token: va en `Authorization: Bearer` (propuesto) o en cookie httpOnly.
 - Se decidio dejarlo en `Authorization: Bearer`
2. `/productos` sin paginación (propuesto, son pocos productos).
 - Agregar paginacion, si despues se agregan mas productos se va a necesitar
3. Tras el registro el front llama a `/auth/login` (propuesto), o el registro devuelve también el token.
 - Si que el front llame a `/auth/login`