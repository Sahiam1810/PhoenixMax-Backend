# StreamStore Backend

Esqueleto del backend de StreamStore con Node.js, Express 5, TypeScript y MySQL.

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev`: inicia el servidor en desarrollo.
- `npm run build`: compila TypeScript en `dist`.
- `npm start`: ejecuta la versión compilada.
- `npm run type-check`: valida tipos sin emitir archivos.

## Variables de entorno

Usa `.env.example` como referencia. Configura la conexión MySQL, secretos JWT, clave AES, URLs de cliente y proveedor de correo antes de implementar los módulos.

## Endpoints

Todas las rutas usan el prefijo `/api`: `GET /health`, autenticación en `/auth`, catálogo en `/plataformas` y `/productos`, carrito, compras, servicios y administración en `/admin/*`.

## Usuarios de prueba

Pendientes de datos semilla: un administrador y dos clientes ficticios se añadirán posteriormente.
