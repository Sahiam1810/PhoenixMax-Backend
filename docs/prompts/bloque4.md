Implementa el Bloque 4 (Admin, inventario) del backend de StreamStore (PhoenixMax-Backend) a partir de la auditoría previa: POST y GET /api/admin/cuentas, más el endurecimiento del cifrado y de la base de datos que la auditoría marcó como previo. Respeta CLAUDE.md: TypeScript sin any, tipos desde Zod con z.infer, 4 espacios, comillas dobles, sin punto y coma, sin comentarios, una instrucción por línea (nada de métodos comprimidos en una sola línea), process.env solo en config.ts, controller async con try/catch, await y ApiResponse.error(res, error), service lanza HttpError, repository solo queries. Nunca leas req.query ni req.params: usa res.locals.query, res.locals.params y el body ya validado.

No hagas commit ni push. No toques nada fuera de lo listado aquí (no modifiques seed.ts, carrito, catálogo ni pagination.ts). Si algo no está listado y crees que debe cambiarse, repórtalo al final. El database/migrations/.gitkeep eliminado es preexistente: no lo restaures.

## 1. Cifrado autenticado y validación de AES_SECRET
- src/config/config.ts: AES_SECRET debe ser obligatorio en TODOS los entornos y tener al menos 32 caracteres; si falta o es más corto, lanza un error claro al arrancar (sin imprimir el valor). No cambies la lectura de las demás variables.
- src/utils/crypto.ts: cambia de AES-256-CBC a AES-256-GCM. Mantén la derivación de clave actual (sha256 del secreto) y conserva los nombres encrypt y decrypt. IV aleatorio de 12 bytes. Formato de salida: base64(iv):base64(tag):base64(ciphertext). decrypt valida las tres partes, fija el authTag y, si el texto está alterado o malformado, lanza un Error("Texto cifrado inválido") sin detalles internos.
- Las 12 cuentas del seed ya existen con formato CBC (iv hex:hex). Migra sus contraseñas con un script temporal (por ejemplo scripts-tmp/reencrypt.ts): descifra con la lógica CBC antigua inline, cifra con el nuevo encrypt y actualiza cada fila. Ejecútalo una vez, verifica que las 12 se descifran con el nuevo decrypt y que los textos coinciden con el patrón Clave-<plataforma>-<n>, y BORRA el script y la carpeta al terminar.
- Pruebas de crypto (script temporal que borras): ida y vuelta correcta, ciphertext distinto para el mismo texto, texto alterado (cambia un carácter) → lanza, texto malformado → lanza, y que nada imprima la clave ni el texto plano en logs.

## 2. Modelos, SQL y migración
- src/models/Cuenta.ts y src/models/Pantalla.ts: agrega atributos y creation attributes tipados como en CarritoItem y Usuario. Declara onDelete "RESTRICT" en las FK plataformaId (Cuenta) y cuentaId (Pantalla). No cambies columnas.
- database/streamstoreDb.sql: refleja ON DELETE RESTRICT en esas dos FK y agrega los índices únicos uq_cuentas_plataforma_email (plataformaId, emailAcceso) y uq_pantallas_cuenta_perfil (cuentaId, nombrePerfil). Verifica que idx_cuentas_plataforma_estado e idx_pantallas_cuenta_estado estén declarados; si faltan, agrégalos.
- Antes de crear la migración, revisa database/migrations: la auditoría indica que existe o debía existir una migración de inventario que no está aplicada en la base actual. Si existe, extiéndela en lugar de duplicarla; si no, crea database/migrations/20261106_inventario_indices.sql. Debe ser idempotente (revisa information_schema.STATISTICS y REFERENTIAL_CONSTRAINTS antes de crear o recrear cada índice y cada FK; obtén los nombres reales de las FK con SHOW CREATE TABLE) y debe contener: los dos únicos, los dos índices compuestos y las dos FK con RESTRICT. Antes de crear los únicos, consulta que no haya duplicados existentes y, si los hay, detente y repórtalos.
- Ejecútala dos veces para comprobar idempotencia y muéstrame SHOW CREATE TABLE cuentas y SHOW CREATE TABLE pantallas al final.

## 3. Validators
src/validators/admin/cuentas/CuentasValidators.ts (reemplaza el cuentaSchema actual):
- createCuentaSchema: { plataformaId: z.coerce.number().int().positive(), emailAcceso: z.string().trim().toLowerCase().email().max(160), passwordAcceso: z.string().min(8).max(255) }. No hagas trim a la contraseña: se guarda tal cual la escribió el admin.
- listCuentasQuerySchema: paginationQuerySchema.extend({ plataforma: z.coerce.number().int().positive().optional(), estado: z.enum(["disponible", "parcial", "vendida", "inactiva"]).optional() }). El límite máximo de limit es 50; si paginationQuerySchema permite más, acótalo aquí sin cambiar el schema compartido.
- Exporta CreateCuentaInput y ListCuentasQuery con z.infer. Mensajes en español por campo.
- Esperado: email inválido, contraseña de 7 caracteres, plataformaId 0, "abc" o ausente, body vacío, limit 100, estado "otro" → 400 { error: "Datos inválidos", errors: {...} }.

## 4. Tipos
src/interfaces/Inventario.ts (nuevo):
- PantallaPublica { id, nombrePerfil, estado: "disponible" | "vendida" }
- CuentaPublica { id, plataformaId, plataforma: { id, nombre }, emailAcceso, estado, pantallasTotal, pantallasDisponibles, pantallasVendidas, pantallas: PantallaPublica[] }
Ni passwordAcceso (cifrada ni descifrada) ni pin salen en ninguna respuesta admin.

## 5. Repository (solo queries)
src/repositories/admin/cuentas/CuentasRepository.ts:
- findPlataformaById(id): plataforma sin filtrar por activo, para que el service distinga 404 de inactiva.
- createCuenta(data, transaction)
- bulkCreatePantallas(pantallas, transaction)
- findCuentaConPantallas(id, transaction?): cuenta con su plataforma { id, nombre } y sus pantallas ordenadas por id ASC.
- findAndCountCuentas({ limit, offset, plataforma?, estado? }): findAndCountAll con distinct: true, orden createdAt DESC e id DESC, con el include de la plataforma; las pantallas se cargan con separate: true (sin N+1 y sin romper el límite por el hasMany).

## 6. Service
src/services/admin/cuentas/CuentasService.ts: ya no extiende NotImplementedService. Constructor con CuentasRepository y la instancia de Sequelize inyectada.
- Helper de perfiles y PIN en src/services/admin/cuentas/generarPantallas.ts (no en el repository): genera "Perfil 1" a "Perfil N" y PINs de cuatro dígitos con crypto.randomInt(1000, 10000), sin repetirse dentro de la misma cuenta. Exporta una función pura reutilizable.
- create(usuarioId no es necesario, no hay auditoría en estas tablas) recibe { plataformaId, emailAcceso, passwordAcceso }:
  1. findPlataformaById; inexistente → HttpError("Plataforma no encontrada", 404); inactiva → HttpError("La plataforma está inactiva", 400).
  2. maxPantallas debe ser entero entre 1 y 20; si no, HttpError("La plataforma tiene una configuración de pantallas inválida", 400).
  3. Cifra la contraseña con encrypt antes de persistir.
  4. Transacción con nivel READ COMMITTED: crea la cuenta en estado "disponible", genera las pantallas con el helper y las inserta con bulkCreate, todas "disponible". Cualquier fallo revierte cuenta y pantallas.
  5. Captura SOLO UniqueConstraintError y conviértelo en HttpError("Ya existe una cuenta para esta plataforma con ese correo", 409). Cualquier otro error se relanza. Nunca expongas error.message de Sequelize.
  6. Devuelve CuentaPublica de la cuenta creada.
- list(query): paginación con el util pagination() existente, filtros plataforma y estado, cálculo de pantallasTotal, pantallasDisponibles y pantallasVendidas desde las pantallas cargadas. Con cero cuentas devuelve paginación válida con total 0 y data [].

## 7. Controller y routes
- src/controllers/admin/cuentas/CuentasController.ts: métodos estáticos async con try/catch y await, cada instrucción en su línea. list lee res.locals.query as ListCuentasQuery → ApiResponse.success(res, resultado, "Cuentas obtenidas"). create usa el body validado → ApiResponse.created(res, cuenta, "Cuenta creada"). El service se crea una sola vez con sus dependencias inyectadas.
- src/routes/admin/cuentas/CuentasRoutes.ts: GET / con validateSchema(listCuentasQuerySchema, "query") y POST / con validateSchema(createCuentaSchema). Cada ruta en su propia línea. No agregues authenticate ni requireRole aquí: ya están en el montaje global de /admin.

## 8. Verificación
1. npx tsc --noEmit sin errores.
2. Crypto: muéstrame el resultado de las pruebas de la sección 1 y que las 12 cuentas del seed se descifran bien tras la migración de formato.
3. Muéstrame las dos ejecuciones de la migración y los SHOW CREATE TABLE.
4. Pruebas curl con el token de admin@streamstore.test, mostrándome cada comando y respuesta:
   - POST y GET sin token → 401; con token de cliente → 403
   - POST válido (Netflix, correo nuevo) → 201 con 5 pantallas "Perfil 1" a "Perfil 5", todas disponibles, cuenta "disponible"
   - Consulta SQL de apoyo: la contraseña guardada tiene el formato de tres partes y no es el texto plano; los PIN de esa cuenta son de 4 dígitos y distintos entre sí
   - Mismo correo y misma plataforma → 409; mismo correo en otra plataforma → 201
   - plataformaId inexistente → 404; plataforma inactiva (desactívala temporalmente y restáurala) → 400
   - Validaciones: email inválido, contraseña corta, plataformaId 0 o "abc", body vacío → 400 con errors por campo
   - GET sin filtros: paginado, ordenado por createdAt DESC; con ?plataforma=1; con ?estado=disponible; con ?estado=inactiva (vacío con total 0 y data []); con ?limit=100 → 400
   - Ninguna respuesta incluye passwordAcceso, pin, usuarioId ni createdAt/updatedAt
5. Efecto en el stock: tras crear una cuenta de Netflix, GET /api/productos debe mostrar +1 en stock de cuenta y +5 en stock de pantalla respecto al estado anterior. Muéstrame el antes y el después.
6. Rollback: con un script temporal que borres después, ejecuta el service con un repository que falle al insertar las pantallas y confirma que no queda ninguna cuenta huérfana.
7. Concurrencia: lanza 5 POST simultáneos con el mismo correo y plataforma y confirma que se crea exactamente una cuenta con sus pantallas y las demás responden 409, sin 500.
8. Regresión: GET /api/productos y GET /api/carrito (con login de cliente) siguen respondiendo igual.
9. Limpieza: elimina las cuentas y pantallas que creaste en las pruebas y restaura cualquier fila que hayas tocado. Confirma que la base vuelve a 4 plataformas, 8 productos, 12 cuentas y 48 pantallas, 0 carritoItems, y los estados originales.
10. Muéstrame git status y el resumen de archivos modificados. No hagas commit.

## Reporte final
Dime qué pruebas pasaron, qué archivos cambiaste y qué encontraste que no estaba en este prompt. Incluye el texto en markdown de la sección de Inventario del ContratoApi (POST y GET /admin/cuentas con ejemplos de request y response, filtros, errores 400/404/409 y la nota de que no se devuelven contraseña ni PIN) para pegarlo en el documento compartido.