Implementa el Bloque 6 (Servicios y correos) del backend de StreamStore (PhoenixMax-Backend): GET /api/servicios/mios, la revisión de vencimientos con correos (service + job con node-cron) y POST /api/admin/cron/ejecutar. Hoy son esqueletos (501). Respeta CLAUDE.md: TypeScript sin any, tipos desde Zod con z.infer, 4 espacios, comillas dobles, sin punto y coma, sin comentarios, una instrucción por línea (nada de métodos comprimidos en una línea), process.env solo en config.ts, controller async con try/catch, await y ApiResponse.error(res, error), service lanza HttpError, repository solo queries. Nunca leas req.query ni req.params. El usuario sale solo de req.user!.id.

No hagas commit ni push. No toques nada fuera de lo listado (no modifiques seed.ts, catálogo, carrito, compras ni cuentas admin). Si algo no está listado y crees que debe cambiarse, repórtalo al final.

Antes de escribir código, lee: utils/mailer.ts, config/config.ts (claves de correo, APP_TIMEZONE y CLIENT_URL), jobs/vencimientosJob.ts, server.ts, los archivos existentes de servicios y de admin/cron, utils/fechas.ts, utils/logger.ts y las asociaciones de los modelos Servicio, CompraItem, Compra, Producto, Cuenta y Pantalla. Si falta alguna asociación belongsTo necesaria para las queries de abajo, agrégala sin cambiar columnas ni índices. Modelos Servicio y Notificacion con atributos y creation attributes tipados si aún no los tienen.

## 1. Utilidades de fechas (src/utils/fechas.ts, junto a sumarDias)
Funciones puras:
- diasRestantes(fechaVencimiento: Date, ahora: Date): number → Math.ceil((vencimiento - ahora) / 24h); mínimo 0.
- estadoServicio(fechaVencimiento: Date, ahora: Date): "activo" | "por_vencer" | "vencido" → "vencido" si fechaVencimiento <= ahora; "por_vencer" si no está vencido y diasRestantes <= 3; "activo" en otro caso.
- diferenciaDiasCalendario(fechaVencimiento: Date, ahora: Date, timeZone: string): number → diferencia en días de calendario entre la fecha de vencimiento y la de hoy, ambas en la zona horaria dada (usa Intl.DateTimeFormat con timeZone para obtener año-mes-día y resta con Date.UTC; no uses librerías nuevas). Vence hoy = 0, mañana = 1.
Prueba estas funciones con un script temporal que borres después: 3 días + 1 minuto → activo con 4 días; exactamente 3 días → por_vencer con 3; 1 hora → por_vencer con 1; pasado → vencido con 0; y el cálculo calendario cerca de medianoche en la zona del proyecto (por ejemplo 23:30 hoy vs 00:30 mañana debe dar 1 aunque sean 1 hora de diferencia).

## 2. Tipos (src/interfaces/Servicio.ts, nuevo)
- ServicioEstado = "activo" | "por_vencer" | "vencido"
- ServicioPublico { id, plataforma: { id, nombre, logoUrl: string | null }, tipo: "cuenta" | "pantalla", emailAcceso: string | null, passwordAcceso: string | null, nombrePerfil: string | null, pin: string | null, fechaInicio: string, fechaVencimiento: string, diasRestantes: number, estado: ServicioEstado }
- ResultadoVencimientos { revisados: number, notificacionesEnviadas: number, serviciosVencidos: number, errores: number }
Ninguna respuesta incluye usuarioId, compraItemId, cuentaId, pantallaId, createdAt ni updatedAt.

## 3. GET /api/servicios/mios
Repository src/repositories/servicios/ServiciosRepository.ts (solo queries): findByUsuario(usuarioId): servicios del usuario con include de CompraItem → Compra (required: true, where estado "pagada"), CompraItem → Producto → Plataforma, Cuenta (emailAcceso, passwordAcceso) y Pantalla (required: false, nombrePerfil y pin). Orden fechaVencimiento ASC, id ASC.
Service src/services/servicios/ServiciosService.ts (constructor con el repository, ya no extiende NotImplementedService) método list(usuarioId):
- Un único valor "ahora" por llamada. estado y diasRestantes con las funciones de la sección 1, calculados por fecha (no por la columna estado).
- Si el servicio NO está vencido: descifra passwordAcceso con decrypt y devuelve emailAcceso, passwordAcceso, y nombrePerfil y pin si es pantalla (null si es cuenta completa).
- Si el servicio está vencido: emailAcceso, passwordAcceso, nombrePerfil y pin salen en null y no se descifra nada.
- Si decrypt falla para un servicio: registra con logger solo el id del servicio (nunca el texto cifrado, la clave ni el correo) y lanza HttpError("No se pudieron obtener las credenciales", 500). Nunca expongas el mensaje del Error original.
- Con cero servicios devuelve [] (sin paginación).
Controller src/controllers/servicios/ServiciosController.ts: método estático async con try/catch; antes de responder agrega el header Cache-Control: no-store; ApiResponse.success(res, servicios, "Servicios obtenidos"). Service creado una sola vez en el controller.
Routes src/routes/servicios/ServiciosRoutes.ts: authenticate y requireRole("cliente") para todo el router; GET /mios en su propia línea. Verifica el montaje bajo /servicios en routes/index.ts.

## 4. Correo
- src/utils/mailer.ts: si solo exporta el transporter, agrega una función enviarCorreo({ to, subject, text, html }): Promise<void> que usa config (MAIL_FROM incluido). Nada de process.env fuera de config.ts. Define el tipo EnviarCorreo para poder inyectar una versión falsa en las pruebas.
- src/services/vencimientos/plantillaVencimiento.ts: función pura plantillaVencimiento({ nombreCliente, plataforma, tipoServicio, tipoAlerta, fechaVencimiento, yaVencio, timeZone, urlRenovar }) → { subject, text, html }.
  - Asuntos: "Tu pantalla de Netflix vence en 3 días", "Tu pantalla de Netflix vence mañana", "Tu pantalla de Netflix vence hoy" (si yaVencio es true: "venció hoy"). Para cuentas completas, "Tu cuenta de Netflix ...". tipoAlerta es "3_dias" | "1_dia" | "vencido".
  - Contenido: nombre del cliente, plataforma, modalidad, fecha y hora de vencimiento formateadas con Intl en es-CO y la zona horaria dada, y un botón "Renovar" que enlaza a urlRenovar. HTML con estilos en línea, versión texto plano equivalente.
  - NUNCA incluye correo de acceso, contraseña, perfil ni PIN. Escapa el HTML de los textos que vienen del usuario.
  - urlRenovar = primera URL de CLIENT_URL (si config la guarda como lista, toma la primera; si no, repórtalo) + "/mi-cuenta".

## 5. Revisión de vencimientos
Repository src/repositories/vencimientos/VencimientosRepository.ts (solo queries):
- findServiciosActivos(): servicios con estado "activo" y compra pagada, con Usuario (nombre, email) y Producto → Plataforma (nombre) más el tipo del producto.
- createNotificacion({ servicioId, tipo, enviadaAt })
- deleteNotificacion(id)
- marcarVencidos(ahora): UPDATE de estado a "vencido" donde estado "activo" y fechaVencimiento <= ahora; devuelve la cantidad afectada.
Service src/services/vencimientos/VencimientosService.ts: constructor con el repository y una función EnviarCorreo inyectada; método ejecutar(ahora: Date = new Date()): Promise<ResultadoVencimientos>.
Reglas:
1. Una bandera de instancia "ejecutando": si ya hay una revisión en curso, lanza HttpError("Ya hay una revisión en curso", 409). Se libera siempre en finally.
2. Obtén los servicios activos y calcula diferenciaDiasCalendario con la zona de APP_TIMEZONE (lee la clave exacta en config.ts). tipoAlerta: diferencia 3 → "3_dias", 1 → "1_dia", 0 → "vencido". Cualquier otra diferencia no genera correo.
3. Por cada servicio con alerta, en orden y de forma secuencial (no en paralelo):
   a. Registra primero la notificación con createNotificacion. Si lanza UniqueConstraintError, ya se envió o lo está enviando otro proceso: omítelo sin contar error. Captura SOLO UniqueConstraintError.
   b. Envía el correo con la plantilla (yaVencio = fechaVencimiento <= ahora).
   c. Si el envío falla, borra la notificación recién creada (para que el próximo ciclo lo reintente), suma 1 a errores, registra con logger solo el id del servicio y el tipo (nunca el correo ni el contenido) y continúa con el siguiente.
   d. Si el envío sale bien, suma 1 a notificacionesEnviadas.
4. Después de las notificaciones, marcarVencidos(ahora) y devuelve la cantidad en serviciosVencidos. Al vencer NO se libera inventario ni se tocan cuentas o pantallas.
5. Registra con logger un resumen al terminar (solo conteos).
Si el envío es lento o Mailtrap rechaza por límite de envíos, agrega una pausa configurable entre correos y repórtalo; no cambies la regla de envío secuencial.

## 6. Job
src/jobs/vencimientosJob.ts: exporta iniciarVencimientosJob() que programa "0 8 * * *" con node-cron usando la zona horaria de APP_TIMEZONE, ejecuta VencimientosService.ejecutar dentro de try/catch (los errores se registran con logger, nunca tumban el proceso) y devuelve la tarea para poder detenerla. server.ts: inicia el job después de conectar la base de datos y lo detiene en el apagado limpio. Si server.ts ya lo registra, ajústalo sin duplicarlo. Debe usarse una sola instancia de VencimientosService compartida entre el job y el endpoint (por ejemplo un módulo que la cree una vez).

## 7. POST /api/admin/cron/ejecutar
Usa los archivos existentes de admin/cron. Controller async con try/catch: llama a ejecutar() y responde ApiResponse.success(res, resultado, "Revisión de vencimientos ejecutada") con data { revisados, notificacionesEnviadas, serviciosVencidos, errores }. No lleva body ni validators. No agregues authenticate ni requireRole: ya están en el montaje global de /admin.

## 8. Verificación
Antes de empezar, guarda una foto de la base: estados y fechas de los 4 servicios, estados de cuentas y pantallas, y conteos de usuarios, compras, compraItems, servicios y notificaciones. Si MAIL_HOST, MAIL_USER o MAIL_PASS están vacíos en .env, no inventes valores: haz las pruebas con una función EnviarCorreo falsa y dime que faltan los datos de Mailtrap. Nunca imprimas contraseñas ni claves.
1. npx tsc --noEmit sin errores.
2. Resultado de las pruebas de fechas (sección 1).
3. Pruebas de la plantilla con un script temporal: asuntos de los tres tipos para pantalla y cuenta (incluido "venció hoy"), que ni el texto ni el HTML contengan una contraseña o PIN de ejemplo que pases como dato, y que un nombre como <script>alert(1)</script> salga escapado.
4. GET /servicios/mios con curl, mostrando cada comando y respuesta:
   - Sin token → 401; token de admin → 403.
   - cliente1@streamstore.test: debe ver su pantalla de Netflix (por_vencer, diasRestantes 3) con correo, contraseña descifrada (patrón Clave-netflix-1), perfil y PIN, y su cuenta de Max (activo, diasRestantes 20) con nombrePerfil y pin en null. cliente2: Disney+ (por_vencer, 1) y Max (activo, 12). Calcula las expectativas con las fechas reales de la tabla servicios; si ya no coinciden con 3 y 1 días, re-fecha temporalmente con UPDATE y restáuralo al final.
   - Confirma el header Cache-Control: no-store, el orden por fechaVencimiento ASC y que no salen los campos prohibidos de la sección 2. Confirma en los logs del servidor que no apareció ninguna contraseña.
   - Servicio vencido: con UPDATE temporal pon fechaVencimiento en el pasado en un servicio (sin tocar su columna estado) y comprueba que sale vencido, diasRestantes 0 y las cuatro credenciales en null. Restaura.
   - Compra no pagada: pasa temporalmente la compra de un servicio a "cancelada" y comprueba que ese servicio desaparece de la lista. Restaura.
   - Flujo completo: cliente1 compra y paga 1 pantalla de Prime Video (carrito → POST /compras → pagar) y aparece en /servicios/mios con credenciales. Limpia después.
5. Vencimientos con función de correo falsa (script temporal que borres después, que cuente envíos y los imprima sin datos sensibles):
   - Con los servicios del seed: 1 correo "3_dias" y 1 "1_dia", serviciosVencidos 0, 2 filas en notificaciones. Segunda ejecución: 0 enviados (sin duplicados).
   - Vence hoy: pon un servicio con fechaVencimiento hoy a las 23:59 en APP_TIMEZONE → correo tipo "vencido" con asunto "vence hoy", y su estado en base sigue "activo".
   - Ya venció: pon otro con fechaVencimiento hace 1 hora → serviciosVencidos 1, estado "vencido" en base, sin correo adicional.
   - Falla de envío: con un mailer que siempre falla, errores = cantidad de alertas, ninguna fila queda en notificaciones y no hay 500; luego una ejecución con mailer correcto envía todo.
   - Concurrencia: dos instancias de VencimientosService en paralelo (sin compartir la bandera) con el mismo mailer falso: cada (servicio, tipo) se envía exactamente una vez. Y dos POST /admin/cron/ejecutar simultáneos por HTTP: una responde 200 y la otra 409, sin 500.
6. Correo real con Mailtrap (solo si hay datos SMTP): limpia las notificaciones de prueba, ejecuta POST /admin/cron/ejecutar con token de admin y muestra la respuesta (esperado notificacionesEnviadas 2). Dime qué debo ver en el inbox (remitente, asuntos y destinatarios) para comprobarlo yo.
7. Cron: arranca el servidor y confirma en logs que el job quedó programado con "0 8 * * *" y la zona horaria del proyecto; valida la expresión con cron.validate. No esperes a las 8:00. Comprueba que el apagado lo detiene sin colgar el proceso.
8. Seguridad: POST /admin/cron/ejecutar sin token → 401 y con cliente → 403.
9. Regresión: GET /api/productos, GET /api/carrito, GET /api/compras/mias y GET /api/admin/cuentas siguen respondiendo igual.
10. Limpieza: borra las notificaciones y todo lo que crearon las pruebas (servicios → compraItems → compras), restaura fechas, estados de servicios, cuentas y pantallas contra la foto inicial. Confirma la base original: 4 plataformas, 8 productos, 12 cuentas, 48 pantallas, 4 compras, 4 compraItems, 4 servicios, 0 carritoItems, y notificaciones como estaba en la foto.
11. Muéstrame git status y el resumen de archivos modificados. No hagas commit.

## Reporte final
Dime qué pruebas pasaron, qué archivos cambiaste y qué encontraste que no estaba en este prompt. Incluye:
- El texto en markdown de la sección de Servicios del ContratoApi (GET /servicios/mios con ejemplo de pantalla y de cuenta, los tres estados, los 4 campos de credenciales en null cuando está vencido, el header no-store) y la de POST /admin/cron/ejecutar (respuesta con revisados, notificacionesEnviadas, serviciosVencidos y errores; 409 si ya hay una revisión en curso), para pegarlos en el documento compartido.
- Un bloque SQL listo para la demo que re-fecha los dos servicios semilla a ahora + 3 días y ahora + 1 día y borra sus filas de notificaciones, para poder repetir el envío de correos cuando quieran.