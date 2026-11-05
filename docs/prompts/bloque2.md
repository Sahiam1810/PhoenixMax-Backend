Implementa el Bloque 2 (Catálogo con stock) del backend de StreamStore (PhoenixMax-Backend) a partir de la auditoría previa. Respeta CLAUDE.md: TypeScript sin any, tipos desde Zod con z.infer, 4 espacios, comillas dobles, sin punto y coma, sin comentarios, una instrucción por línea (nada de métodos comprimidos en una sola línea), process.env solo en config.ts, controller async con try/catch, await y ApiResponse.error(res, error), service lanza HttpError, repository solo queries.

No hagas commit ni push. No toques nada fuera de lo listado aquí. Si algo no está listado y crees que debe cambiarse, repórtalo al final.

## 1. Validators
- src/validators/CommonValidators.ts: revisa paginationQuerySchema. Debe tener page con default 1 (entero positivo, coerce) y limit con default 10 (entero positivo, coerce, máximo 50). Si ya existe, ajústalo a eso sin romper otros usos. Mensajes en español.
- src/validators/productos/ProductosValidators.ts: listProductosQuerySchema = paginationQuerySchema.extend({ plataforma: z.coerce.number().int().positive().optional(), tipo: z.enum(["cuenta", "pantalla"]).optional() }). Exporta ListProductosQuery con z.infer.
- Mensajes en español por campo (por ejemplo "El tipo debe ser cuenta o pantalla", "La plataforma debe ser un número entero positivo", "El límite máximo es 50").
- Resultado esperado: ?tipo=otro, ?plataforma=abc, ?limit=100000, ?limit=0, ?page=0 responden 400 con { error: "Datos inválidos", errors: {...} }.

## 2. Tipos y mappers
- src/interfaces/Catalogo.ts (nuevo): PlataformaPublica { id, nombre, descripcion: string | null, logoUrl: string | null, maxPantallas }, ProductoPublico { id, plataformaId, tipo, duracionDias, precio: string, stock: number, agotado: boolean, plataforma: { id, nombre, logoUrl: string | null } }.
- src/utils/formatters.ts: agrega toPlataformaPublica(plataforma) y toProductoPublico(producto, stock). precio siempre como string con dos decimales (Number(precio).toFixed(2)). agotado = stock === 0. No debe salir ningún campo extra (createdAt, updatedAt, activo, etc.).

## 3. Repositories (solo queries)
src/repositories/plataformas/PlataformasRepository.ts:
- findActivas(): plataformas con activo = true, ordenadas por id.

src/repositories/productos/ProductosRepository.ts:
- findAndCountActivos({ plataforma, tipo, limit, offset }): productos con activo = true cuya plataforma tenga activo = true (include de Plataforma con required: true y where activo), filtros opcionales por plataformaId y tipo, order [plataformaId, tipo, duracionDias, id], con limit y offset. El count debe ser correcto con el include (usa distinct o count separado si hace falta).
- findActivoById(id): producto con activo = true y plataforma activa, con include de Plataforma, o null.
- stockCuentasPorPlataforma(plataformaIds: number[]): Promise<Map<number, number>> con esta query (sequelize.query, QueryTypes.SELECT, replacements, tipado sin any):
  SELECT cuentasElegibles.plataformaId, COUNT(*) AS stock
  FROM (
      SELECT c.id, c.plataformaId
      FROM cuentas c
      INNER JOIN pantallas p ON p.cuentaId = c.id
      WHERE c.plataformaId IN (:plataformaIds)
        AND c.estado = 'disponible'
      GROUP BY c.id, c.plataformaId
      HAVING COUNT(p.id) > 0
         AND SUM(p.estado = 'vendida') = 0
  ) AS cuentasElegibles
  GROUP BY cuentasElegibles.plataformaId
- stockPantallasPorPlataforma(plataformaIds: number[]): Promise<Map<number, number>> con:
  SELECT c.plataformaId, COUNT(*) AS stock
  FROM cuentas c
  INNER JOIN pantallas p ON p.cuentaId = c.id
  WHERE c.plataformaId IN (:plataformaIds)
    AND c.estado IN ('disponible', 'parcial')
    AND p.estado = 'disponible'
  GROUP BY c.plataformaId
- Los COUNT llegan de mysql2 como número o string: conviértelos con Number(). Si plataformaIds está vacío, devuelve un Map vacío sin ejecutar la query (IN () es inválido).
- Los tres estados de cuenta que no cuentan para nada son "inactiva" y "vendida". Una cuenta sin pantallas no cuenta como cuenta completa. Una cuenta "disponible" con alguna pantalla vendida no cuenta como cuenta completa pero sus pantallas libres sí cuentan.

## 4. Services
src/services/plataformas/PlataformasService.ts: ya no extiende NotImplementedService. Constructor con repository inyectado. list() devuelve PlataformaPublica[].

src/services/productos/ProductosService.ts: ya no extiende NotImplementedService. Constructor con repository inyectado.
- list(query): calcula offset, obtiene la página de productos, saca los plataformaId distintos de esa página, hace las dos queries de stock UNA vez para toda la página (sin N+1), y mapea: tipo "cuenta" usa el mapa de cuentas, tipo "pantalla" el de pantallas, y 0 si la plataforma no está en el mapa. Devuelve el resultado con el helper de src/utils/pagination.ts en el formato { previousPage, currentPage, nextPage, total, totalPages, limit, data }. Revisa la firma real del helper y úsalo como está.
- getById(id): findActivoById; si no existe, HttpError("Producto no encontrado", 404). Calcula el stock con las mismas dos queries para esa plataforma y devuelve ProductoPublico.

## 5. Controllers
Reemplaza los controllers de plataformas y productos por métodos async con try/catch y await, cada instrucción en su línea:
- PlataformasController.list → ApiResponse.success(res, plataformas, "Plataformas obtenidas")
- ProductosController.list → lee res.locals.query as ListProductosQuery → ApiResponse.success(res, resultado, "Productos obtenidos")
- ProductosController.getById → lee res.locals.params as { id: number } → ApiResponse.success(res, producto, "Producto obtenido")
Crea cada service una sola vez con su repository inyectado. Nunca leas req.query ni req.params (Express 5).

## 6. Routes
- src/routes/plataformas/*: GET / sin AuthMiddleware.
- src/routes/productos/*: GET / con validateSchema(listProductosQuerySchema, "query") y GET /:id con validateSchema(idParamSchema, "params"). Sin AuthMiddleware. Verifica que en src/routes/index.ts sigan montadas como públicas.

## 7. Base de datos
- Crea database/migrations/20261105_indices_inventario.sql, idempotente (revisa information_schema.STATISTICS antes de crear cada índice). Índices: cuentas (plataformaId, estado), pantallas (cuentaId, estado), productos (activo, plataformaId).
- Agrega esos mismos índices al CREATE TABLE de database/streamstoreDb.sql.
- En database/streamstoreDb.sql corrige el comentario que dice que los datos semilla están pendientes: debe indicar que se cargan con npm run seed.
- Ejecuta la migración contra la base local, ejecútala una segunda vez para comprobar que es idempotente, y muéstrame SHOW INDEX de cuentas, pantallas y productos.

## 8. Limpieza de estilo (sin cambiar comportamiento)
- src/models/Plataforma.ts: quita el espacio final antes de @HasMany.
- src/routes/index.ts: separa las instrucciones comprimidas del health check en líneas propias y quita los puntos y coma.
- src/seeds/seed.ts: quita los comentarios y separa las líneas comprimidas. No cambies la lógica ni los datos del seed.

## 9. Verificación
1. npx tsc --noEmit sin errores.
2. Arranca el servidor y prueba con curl, mostrándome cada comando y su respuesta:
   - GET /api/plataformas → 200 con las 4 plataformas
   - GET /api/productos → 200 paginado, con stock y agotado
   - GET /api/productos?tipo=pantalla, ?plataforma=1, ?plataforma=1&tipo=cuenta
   - GET /api/productos?limit=3&page=2 → comprueba previousPage, nextPage, total, totalPages
   - ?tipo=otro, ?plataforma=abc, ?limit=100000, ?limit=0, ?page=0 → 400 con errors por campo
   - GET /api/productos/1 → 200; GET /api/productos/99999 → 404 "Producto no encontrado"; GET /api/productos/abc → 400
   - Confirma que ninguna respuesta incluye emailAcceso, passwordAcceso, nombrePerfil, pin, ids de cuentas ni createdAt, updatedAt, activo.
   - Confirma que precio sale como string con dos decimales.
3. Stock del seed: muéstrame el stock de cada uno de los 8 productos tal como lo devuelve la API y confirma que coincide con Netflix 2/14, Disney+ 2/11, Prime Video 3/9, Max 1/4.
4. Prueba del reto con datos temporales (limpia todo al terminar): crea una plataforma temporal con maxPantallas 5, sus dos productos (cuenta y pantalla), y 2 cuentas con 5 pantallas cada una. Consulta GET /api/productos?plataforma=<id temporal> en cada paso y muéstrame los números:
   - Inicial: cuenta 2, pantalla 10, agotado false
   - Vender 1 pantalla de la cuenta A (pantalla "vendida" y cuenta A "parcial"): cuenta 1, pantalla 9
   - Vender la cuenta B completa (cuenta B "vendida" y sus 5 pantallas "vendida"): cuenta 0 con agotado true, pantalla 4
   Con la misma plataforma temporal prueba los casos borde y dime el resultado de cada uno: cuenta "inactiva" (no cuenta en nada), cuenta sin pantallas (no cuenta como cuenta completa), producto inactivo (no aparece en el listado y el detalle da 404), plataforma inactiva (no aparece en /plataformas ni en /productos y el detalle de sus productos da 404).
5. Borra todo lo temporal en orden de llaves foráneas y confirma que la base volvió a 4 plataformas, 8 productos, 12 cuentas y 48 pantallas.
6. Muéstrame git status y el resumen de archivos modificados. No hagas commit.

## Reporte final
Dime qué pruebas pasaron, qué archivos cambiaste y qué encontraste que no estaba en este prompt. Incluye también el texto en markdown de la sección 4 de ContratoApi (GET /plataformas, GET /productos paginado con ?page=&limit= y el ejemplo de respuesta, GET /productos/:id) actualizado a lo implementado, para que yo lo pegue en el documento compartido.