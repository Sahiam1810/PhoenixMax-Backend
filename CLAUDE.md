# Reglas de código

- TypeScript estricto sin `any`; los tipos se derivan de Zod con `z.infer`.
- Usar indentación de 4 espacios, comillas dobles y no usar punto y coma ni comentarios.
- `process.env` solo se lee en `src/config/config.ts`.
- Cada variable nueva debe añadirse a `.env.example`.
- Las contraseñas de usuarios usan bcrypt y las cuentas de streaming se cifran con AES.
- Los controllers usan try/catch y `ApiResponse.error(res, error)`.
- Los services lanzan `HttpError` (404, 409, 403, 400).
- Los repositories solo contienen queries.
- Cada modelo nuevo se registra en `src/config/database.ts`.
