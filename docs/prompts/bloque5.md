Implementa el Bloque 5 (Compras y pago) del backend de StreamStore (PhoenixMax-Backend): POST /api/compras, POST /api/compras/:id/pagar, GET /api/compras/mias y GET /api/compras/:id. Hoy el dominio compras es solo un esqueleto (501). Respeta CLAUDE.md: TypeScript sin any, tipos desde Zod con z.infer, 4 espacios, comillas dobles, sin punto y coma, sin comentarios, una instrucción por línea (nada de métodos comprimidos en una línea), process.env solo en config.ts, controller async con try/catch, await y ApiResponse.error(res, error), service lanza HttpError, repository solo queries. Nunca leas req.query ni req.params: usa res.locals.query, res.locals.params y el body ya validado. El usuario sale solo de req.user!.id, nunca del body ni de params.

No hagas commit ni push. No toques nada fuera de lo listado (no modifiques seed.ts, el catálogo ni el módulo de cuentas admin). Si algo no está listado y crees que debe cambiarse, repórtalo al final. Antes de escribir código, lee StockRepository y StockService: la definición de stock que ya existe es la fuente de verdad, y la asignación debe usar exactamente la misma elegibilidad.

## 1. Utilidades y ajustes menores
- src/utils/fechas.ts (nuevo): sumarDias(fecha: Date, dias: number): Date, sumando dias * 24 * 60 * 60 * 1000 milisegundos (igual que hace el seed).
- Dinero: usa toCentavos y fromCentavos de formatters.ts (BigInt, nunca Number). Subtotal = precio en centavos * BigInt(cantidad). Total = suma de subtotales.
- CarritoRepository.deleteByUsuario: agrega un parámetro opcional transaction y pásalo a la query. Sin cambiar su comportamiento actual.
- Modelos Compra, CompraItem y Servicio: si no tienen atributos y creation attributes tipados como Usuario o CarritoItem, agrégalos. No cambies columnas ni índices.

## 2. Validators
src/validators/compras/ComprasValidators.ts:
- payCompraSchema: { metodoPago: z.enum(["simulado"]).default("simulado") }. El endpoint debe funcionar SIN body, con body vacío y con { "metodoPago": "simulado" }; verifica cómo llega req.body en Express 5 cuando no hay body y haz que el schema lo soporte.
- listComprasQuerySchema: paginationQuerySchema acotado a limit máximo 50 (sin cambiar el schema compartido).
- Para el :id usa el idParamSchema de CommonValidators con validateSchema(idParamSchema, "params").
- Exporta PayCompraInput y ListComprasQuery con z.infer. Mensajes en español por campo.

## 3. Tipos
src/interfaces/Compra.ts (nuevo):
- CompraItemPublico { id, productoId, cantidad, precioUnitario: string, subtotal: string, producto: { tipo, duracionDias, plataforma: { id, nombre, logoUrl: string | null } } }
- CompraPublica { id, estado: "pendiente" | "pagada" | "cancelada", total: string, metodoPago: string | null, pagadaAt: string | null, createdAt: string, items: CompraItemPublico[] }
Ninguna respuesta incluye usuarioId, updatedAt, cuentaId, pantallaId, emailAcceso, passwordAcceso, nombrePerfil ni pin. Las credenciales solo se ven en /servicios/mios.

## 4. Repositories (solo queries)
src/repositories/compras/ComprasRepository.ts:
- createCompra(data, transaction), bulkCreateItems(items, transaction)
- cancelPendientesByUsuario(usuarioId, transaction): pasa a "cancelada" las compras pendientes del usuario
- findCompraParaPago(id, usuarioId, transaction): compra del usuario con lock FOR UPDATE, SIN include
- findItemsConProducto(compraId, transaction): ítems ordenados por id con su Producto y la Plataforma del producto (sin lock)
- updateCompraPagada(compra, { metodoPago, pagadaAt }, transaction)
- findCompraDetalle(id, usuarioId): compra propia con ítems, producto y plataforma, o null
- findAndCountCompras({ usuarioId, limit, offset }): findAndCountAll con distinct: true, orden createdAt DESC e id DESC, ítems con separate: true

src/repositories/inventario/AsignacionRepository.ts (nuevo):
- lockCuentasByPlataforma(plataformaId, transaction): TODAS las cuentas de la plataforma (cualquier estado) ordenadas por id ASC con lock UPDATE y sin include. Funciona como mutex por plataforma y evita lecturas desactualizadas.
- lockPantallasByCuentas(cuentaIds, transaction): pantallas de esas cuentas ordenadas por cuentaId e id ASC con lock UPDATE, sin include.
- updateCuentasEstado(ids, estado, transaction)
- updatePantallasEstadoByCuentas(cuentaIds, estado, transaction)
- updatePantallasEstado(ids, estado, transaction)
- bulkCreateServicios(servicios, transaction)
Prohibido usar skipLocked: se espera el lock, no se salta. Prohibido sequelize.sync.

## 5. Planificador puro
src/services/compras/planificarAsignacion.ts: función pura, sin acceso a BD, para poder probarla aislada. Entrada: las cuentas de UNA plataforma con sus pantallas ya bloqueadas, y las unidades pedidas (lista de { itemId, tipo }). Salida: el plan de asignación o la cantidad faltante por tipo. Reglas:
1. Elegibilidad según StockRepository: una cuenta "disponible" con todas sus pantallas disponibles sirve para cuenta completa; las pantallas libres de cuentas "disponible" o "parcial" sirven para pantalla; "vendida" e "inactiva" nunca.
2. Primero se asignan las unidades de cuenta completa: cuentas elegibles por id ASC.
3. Luego las unidades de pantalla: primero pantallas libres de cuentas "parcial" (cuenta id ASC, pantalla id ASC) y después de cuentas "disponible" que no quedaron asignadas a una cuenta completa, llenando una cuenta antes de pasar a la siguiente. Así se protege el stock de cuentas completas.
4. Cada unidad de cuenta marca la cuenta "vendida" y todas sus pantallas "vendida". Cada unidad de pantalla marca esa pantalla "vendida" y su cuenta pasa a "parcial" (si estaba "disponible"); una cuenta parcial se queda "parcial" aunque se vendan todas sus pantallas.
5. Si faltan unidades, no asigna nada y devuelve el faltante.
Prueba el planificador con un script temporal que borres después: (a) 2 cuentas libres de 5 pantallas, pedir 3 pantallas → las 3 salen de la misma cuenta; (b) cuenta A parcial con 4 libres y B libre: pedir 1 cuenta → B; pedir 4 pantallas → todas de A; (c) pedir más de lo disponible → faltante y cero asignaciones; (d) ejemplo del reto: 2 cuentas de 5, vender 1 pantalla de A deja stock 1 de cuenta y 9 de pantalla; vender B completa deja 0 y 4.

## 6. Service
src/services/compras/ComprasService.ts: ya no extiende NotImplementedService. Constructor con ComprasRepository, AsignacionRepository, CarritoService, CarritoRepository y la instancia de Sequelize. Servicio creado una sola vez en el controller.

create(usuarioId):
1. Obtén el carrito con CarritoService.get. Si no tiene ítems → HttpError("El carrito está vacío", 400).
2. Si algún ítem es noDisponible → 409 "<Plataforma> <tipo> ya no está disponible. Ajusta tu carrito."; si es agotado o excedeStock → 409 "<Plataforma> <tipo> ya no tiene stock suficiente. Ajusta tu carrito." Con varios productos problemáticos, un solo mensaje que los liste separados por coma y el verbo en plural. Usa 409 para exceso de stock (es lo que dice el contrato). Si CarritoService usa otro código para el mismo caso, NO lo cambies: repórtalo.
3. En una transacción: cancela las compras pendientes anteriores del usuario, crea la compra "pendiente" con total en centavos, y crea los ítems con precioUnitario y subtotal. No toca stock, no toca el carrito.
4. Devuelve CompraPublica (201).

pagar(usuarioId, compraId, { metodoPago }):
1. Transacción en READ COMMITTED. Si el error es un deadlock de MySQL (errno 1213), reintenta la transacción completa hasta 2 veces; los HttpError nunca se reintentan.
2. findCompraParaPago con lock; no existe o no es del usuario → HttpError("Compra no encontrada", 404). Estado "pagada" → 409 "La compra ya fue pagada". Estado "cancelada" → 409 "La compra fue cancelada. Vuelve a hacer el pedido desde tu carrito". Sin ítems → 400 "La compra no tiene productos".
3. Carga ítems con producto y plataforma. Un producto o plataforma inactivos cuenta como faltante.
4. Agrupa las unidades por plataforma y procesa las plataformas en orden de plataformaId ASC (orden fijo para evitar deadlocks). Por cada plataforma: lockCuentasByPlataforma, lockPantallasByCuentas y planificarAsignacion. Calcula primero el plan de TODAS las plataformas en memoria, sin escribir nada.
5. Si hay faltantes: lanza HttpError 409 listando TODOS los productos sin stock: uno solo → "Netflix pantalla ya no tiene stock suficiente. Ajusta tu carrito."; varios → "Netflix pantalla, Max cuenta ya no tienen stock suficiente. Ajusta tu carrito." Rollback total.
6. Si hay stock, aplica el plan: actualiza estados de cuentas y pantallas, y crea un Servicio por cada unidad: compraItemId, usuarioId, cuentaId, pantallaId (null si es cuenta completa), fechaInicio = ahora, fechaVencimiento = sumarDias(ahora, duracionDias), estado "activo". Usa un único valor "ahora" para todo el pago.
7. Marca la compra "pagada" con metodoPago y pagadaAt = ahora, y vacía el carrito del usuario con deleteByUsuario dentro de la misma transacción.
8. Se cobra el precio guardado en los ítems de la compra, no el precio actual del producto. Devuelve CompraPublica de la compra pagada (200).
9. Captura solo errores de Sequelize que debas traducir; cualquier otro error se relanza. Nunca expongas error.message de Sequelize.

list(usuarioId, query): paginación con pagination(), solo compras propias, CompraPublica por elemento. Con cero compras: paginación válida con total 0 y data [].
getById(usuarioId, id): findCompraDetalle; si no existe o no es del usuario → 404 "Compra no encontrada" (nunca 403).

## 7. Controller y routes
- src/controllers/compras/ComprasController.ts: métodos estáticos async con try/catch y await. create → ApiResponse.created(res, compra, "Compra creada"); pagar → success "Pago realizado correctamente"; list → success "Compras obtenidas"; getById → success "Compra obtenida".
- src/routes/compras/ComprasRoutes.ts: authenticate y requireRole("cliente") para todo el router. POST / ; POST /:id/pagar con validateSchema(idParamSchema, "params") y validateSchema(payCompraSchema); GET /mias con validateSchema(listComprasQuerySchema, "query"); GET /:id con validateSchema(idParamSchema, "params"). Declara GET /mias ANTES de GET /:id. Cada ruta en su propia línea. Verifica el montaje bajo /compras en routes/index.ts.

## 8. Verificación
Antes de empezar, guarda una foto de la base: estados de cuentas y pantallas, y conteos de usuarios, compras, compraItems y servicios.
1. npx tsc --noEmit sin errores.
2. Muéstrame el resultado de las pruebas del planificador (sección 5).
3. Pruebas curl con cliente1@streamstore.test, mostrándome cada comando y respuesta:
   - Sin token → 401; token de admin → 403
   - POST /compras con carrito vacío → 400
   - Carrito con 2 pantallas de Netflix, 1 pantalla de Disney+ y 1 cuenta de Max → POST /compras → 201, estado "pendiente", total como string con dos decimales, ítems con precios. Confirma con GET /api/productos que el stock NO cambió y con GET /api/carrito que el carrito sigue intacto.
   - POST /compras otra vez → la primera pasa a "cancelada" (compruébalo con SQL) y la nueva queda "pendiente"
   - POST /compras/:id/pagar sin body → 200, estado "pagada" y pagadaAt. Con SQL verifica: 4 servicios nuevos con fechaVencimiento = pagadaAt + duracionDias; las 2 pantallas de Netflix salieron de la cuenta que ya estaba "parcial"; la cuenta de Max quedó "vendida" con todas sus pantallas "vendida" y pantallaId null en su servicio; carrito vacío. Muéstrame el stock de GET /api/productos antes y después (esperado: Netflix pantalla -2, Disney+ pantalla -1, Max cuenta 1→0 y Max pantalla 4→0).
   - Pagar de nuevo la misma compra → 409; pagar una compra cancelada → 409
   - Compra de cliente2 consultada o pagada por cliente1 → 404; id inexistente → 404; id 0 o "abc" → 400
   - Pago con stock agotado a mitad: arma una compra pendiente con 1 pantalla de Netflix y 1 cuenta de Max, consume esa cuenta de Max con otro cliente, y paga la compra → 409 con el mensaje nombrando Max cuenta. Confirma con SQL que NADA cambió: compra sigue "pendiente", cero servicios nuevos, la pantalla de Netflix sigue libre y el carrito intacto.
   - Producto inactivo al momento de pagar (desactívalo temporalmente y restáuralo) → 409
   - GET /compras/mias: paginado, orden createdAt DESC, solo compras propias (cliente2 ve las suyas), ?limit=100 → 400, página sin resultados con total correcto. GET /compras/:id con detalle de ítems.
   - Ninguna respuesta incluye los campos prohibidos de la sección 3, y todo el dinero sale como string con dos decimales.
4. Cero sobreventa (lo más importante), con scripts temporales que borres después y usuarios temporales que elimines al terminar:
   a. Último producto: deja exactamente 1 cuenta completa de Max libre. cliente1 y cliente2 tienen cada uno esa cuenta en su carrito y crean su compra. Lanza los dos pagos en paralelo. Esperado: un 200 y un 409, un solo servicio para esa cuenta, sin respuestas 500. Repite la prueba 10 veces restaurando el estado entre rondas.
   b. Última pantalla: deja 1 sola pantalla libre en una plataforma (temporalmente), dos clientes pagan en paralelo, exactamente uno pasa.
   c. Estrés: con 3 pantallas libres en una plataforma, 6 usuarios temporales pagan 1 pantalla cada uno en paralelo. Esperado: 3 respuestas 200, 3 respuestas 409, cero 500 y ninguna pantalla asignada dos veces (consulta con GROUP BY que no haya cuentaId o pantallaId repetidos entre servicios nuevos de pantalla).
   d. Doble clic: el mismo usuario paga la misma compra dos veces en paralelo → un 200 y un 409, un solo juego de servicios.
   e. Deadlocks: dos clientes pagan en paralelo compras con las mismas dos plataformas agregadas en orden inverso en el carrito (Netflix+Disney+ contra Disney++Netflix), con stock suficiente. Esperado: ambos 200, cero 500.
5. Regresión: GET /api/productos, GET /api/carrito y GET /api/admin/cuentas siguen respondiendo igual.
6. Limpieza: elimina en orden servicios → compraItems → compras todo lo que crearon las pruebas, elimina usuarios temporales, restaura los estados de cuentas y pantallas comparando con la foto inicial, y deja carritoItems vacío. Confirma la base original: 4 plataformas, 8 productos, 12 cuentas, 48 pantallas, 4 compras, 4 compraItems, 4 servicios, y el stock de cuenta/pantalla en Netflix 2/14, Disney+ 2/11, Prime Video 3/9, Max 1/4.
7. Muéstrame git status y el resumen de archivos modificados. No hagas commit.

## Reporte final
Dime qué pruebas pasaron, qué archivos cambiaste y qué encontraste que no estaba en este prompt (por ejemplo diferencias de códigos de error con el carrito). Incluye el texto en markdown de la sección de Compras del ContratoApi: las cuatro rutas con ejemplos de request y response, los mensajes de error 400/404/409, y la nota de que el carrito no aparta stock y que las credenciales se consultan en /servicios/mios.