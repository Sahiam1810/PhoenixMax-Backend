Implementa el Bloque 7 (Entrega) del backend de StreamStore (PhoenixMax-Backend): datos semilla listos para la demo, colección de Postman, README y un ensayo completo del flujo. REGLA PRINCIPAL: toda la documentación y la colección se escriben leyendo el código real del repositorio (routes, validators, controllers, services, config.ts, .env.example, package.json, models, database/*.sql, seed). No inventes endpoints, campos, variables, scripts, versiones, mensajes ni comportamientos. Si algo no está en el código, no se documenta; si dudas, repórtalo. Si un endpoint existe pero responde 501, no lo incluyas en la colección y documéntalo como "no implementado".

Respeta CLAUDE.md en todo el código TypeScript que escribas: TypeScript sin any, tipos desde Zod con z.infer, 4 espacios, comillas dobles, sin punto y coma, sin comentarios, una instrucción por línea, process.env solo en config.ts. Los JSON de Postman van con 4 espacios de indentación.

No hagas commit ni push. NO corrijas bugs del código de la aplicación (routes, controllers, services, repositories, models, validators, middlewares, utils): el desarrollador los está depurando. Si encuentras uno durante el ensayo, repórtalo con archivo, línea y cómo reproducirlo. Puedes modificar solo: src/seeds/*, package.json (únicamente la sección scripts), README.md, docs/ y archivos temporales que borrarás al terminar. Si algo fuera de eso necesita cambio, repórtalo.

## 1. Lectura previa (obligatoria)
Antes de escribir nada, lee y resume para ti: package.json, .nvmrc, .env.example, config/config.ts, database/streamstoreDb.sql, database/migrations/ (nombres y orden), src/seeds/seed.ts, routes/index.ts y todos los archivos de routes con sus validators, utils/apiResponse.ts, utils/httpError.ts, middlewares, server.ts y el README.md actual. Si existe docs/CONTRATO_API.md (u otro contrato en docs/), léelo también.

## 2. Datos semilla para la demo
- Compara src/seeds/seed.ts con estos mínimos del reto: 1 admin, 2 clientes, 4 plataformas (Netflix, Disney+, Prime Video, Max), 2 productos por plataforma (cuenta y pantalla a 30 días), 3 cuentas por plataforma con sus pantallas, 1 servicio que vence en 3 días, 1 servicio que vence en 1 día y 1 producto con stock bajo (1 o 2 unidades). Corrige en el seed solo lo que falte; no cambies credenciales ni cantidades que ya cumplan.
- Verifica que el seed sigue funcionando con el cifrado actual y los índices únicos: córrelo dos veces sobre una base limpia (ver sección 6) y confirma cero duplicados y que las contraseñas de las cuentas se descifran con decrypt.
- Crea src/seeds/demoReset.ts y el script "demo:reset" en package.json. Debe, de forma idempotente y sin tocar nada más: re-fechar los dos servicios de la demo (el de 3 días y el de 1 día; identifícalos como lo hace seed.ts, por usuario y plataforma) a ahora + 3 días y ahora + 1 día, manteniendo coherentes fechaInicio (vencimiento menos duracionDias) y el pagadaAt de su compra como hace el seed; poner su estado en "activo"; y borrar las filas de notificaciones de esos dos servicios para poder repetir el envío de correos. Imprime qué hizo sin mostrar contraseñas ni claves. Si algún servicio de demo no existe, falla con un mensaje claro indicando que hay que correr el seed.
- Prueba demo:reset: ejecútalo, comprueba con SQL las fechas y que las notificaciones desaparecieron, ejecútalo otra vez y confirma que el resultado es el mismo.

## 3. Colección de Postman
Crea docs/PhoenixMax.postman_collection.json (Postman Collection v2.1) y docs/PhoenixMax.postman_environment.json.
- Variables de colección o entorno: baseUrl (valor por defecto tomado del PORT real de .env.example), tokenCliente, tokenAdmin, productoId, itemId, compraId, plataformaId y cualquier otra que el flujo necesite. Sin secretos reales. Las credenciales de los usuarios de prueba se toman de seed.ts, no de este prompt.
- Una carpeta por dominio, con UNA request por cada endpoint que exista y responda en el código (no 501): salud, Auth, Plataformas, Productos, Carrito, Compras, Servicios, Admin (cuentas y cron). Cada request con su método, URL con {{baseUrl}}, headers (Content-Type y Authorization con la variable de token que corresponda), body de ejemplo que cumpla EXACTAMENTE el validator real de esa ruta, y una descripción corta basada en el código (qué hace, rol requerido, códigos de error reales que puede devolver).
- Scripts de test (pm.test) en las requests clave: el login de cliente y el de admin guardan su token en la variable correspondiente; listar productos guarda productoId; agregar al carrito guarda itemId; crear la compra guarda compraId; verifican el status esperado y la forma { message, data }.
- Añade una carpeta "Flujo demo" con el orden de la presentación: registro, login cliente, productos, agregar varios productos al carrito, ver carrito, crear compra, pagar, mis servicios, mis compras, login admin, crear cuenta en inventario, listar inventario, ejecutar cron. Debe poder correrse completa con el Collection Runner sin editar nada, con un usuario nuevo en cada corrida (genera el correo con una variable dinámica, por ejemplo {{$timestamp}}) y sin depender de datos que la propia corrida no cree o que el seed no tenga.
- Valida: que ambos JSON parsean (node -e con JSON.parse), que cada request apunta a una ruta que existe en el código (script temporal que cruce los routers montados con la colección y que borres), y ejecuta la colección: primero con "npx newman run" contra el servidor local; si no se puede, simula el flujo con un script temporal que haga las mismas llamadas en el mismo orden. Muéstrame el resultado de cada request.

## 4. README.md
Actualiza el README existente (conserva lo que ya está bien, corrige lo desactualizado). Contenido, todo verificado contra el código:
1. Descripción corta del proyecto y de qué cubre el backend.
2. Stack con las versiones reales de package.json y la versión de Node de .nvmrc.
3. Requisitos (Node, MySQL) y pasos de instalación en orden exacto, probados en la sección 6: clonar, nvm use si aplica, npm install, copiar .env.example a .env, crear la base con database/streamstoreDb.sql, aplicar las migraciones de database/migrations/ en orden de fecha (lista real de archivos), sembrar datos y arrancar.
4. Variables de entorno: tabla con TODAS las de config.ts/.env.example, para qué sirve cada una, cuáles son obligatorias (según config.ts), cómo generar JWT_SECRET, JWT_REFRESH_SECRET y AES_SECRET (indica la regla real de longitud mínima del AES_SECRET que aplica config.ts) y cómo obtener los datos SMTP en Mailtrap. Ningún valor secreto.
5. Scripts de npm: tabla con los reales de package.json, incluido seed y demo:reset.
6. Datos semilla: qué crea y la tabla de usuarios de prueba (correo, contraseña, rol) leída de seed.ts. Aclara que las credenciales de las cuentas de streaming son ficticias.
7. Endpoints: tabla con todas las rutas reales (método, ruta, acceso, descripción) leídas de los routers, indicando cuáles responden 501 como "no implementado". Formato de respuesta y errores según utils/apiResponse.ts y los mensajes reales.
8. Reglas de negocio implementadas, descritas desde el código: cálculo de stock, asignación al pagar (transacción, bloqueo, orden de asignación), vencimiento, estados de servicio, alertas por correo y regla de no repetir notificaciones, horario del cron.
9. Estructura de carpetas real (genérala del árbol, no de memoria).
10. Guía de demo paso a paso: cómo preparar (seed y demo:reset), qué mostrar en cada paso en el orden de la presentación, y cómo disparar el correo con POST /admin/cron/ejecutar. Incluye la colección de Postman y cómo importarla.
11. Estado actual: qué está implementado y qué falta (endpoints 501, extras), sin adornos.
Si docs/CONTRATO_API.md existe, compárala con el código real y actualízala solo para que coincida con él (campos, códigos y mensajes); dame la lista exacta de cada diferencia que corregiste.

## 5. Estilo de la documentación
Español, directo, sin adornos ni marketing, sin emojis. Comandos en bloques de código listos para copiar. Nada de texto de relleno.

## 6. Verificación e instalación desde cero
No toques la base de datos principal. Crea una base temporal con otro nombre (por ejemplo streamstoreDb_verify): ejecuta el SQL base cambiando el nombre de la base con una copia temporal del archivo, aplica las migraciones en el orden que documentaste (si apuntan al nombre original, usa copias temporales ajustadas) y arranca con DB_DATABASE sobreescrita por variable de entorno inline. Sigue el README paso a paso como lo haría alguien nuevo y confirma que cada comando funciona tal como está escrito. Corre el seed dos veces, demo:reset, la colección de Postman y el ensayo de la sección 7 en esa base temporal. Al terminar elimina SOLO esa base temporal y los archivos temporales. Si algún paso del README falla, corrígelo en el README y repórtalo.

## 7. Ensayo del flujo completo (en la base temporal)
Con curl o un script temporal (que borrarás), ejecuta el flujo de la presentación y muéstrame cada comando y respuesta, resumiendo los cuerpos largos:
1. Registro de un cliente nuevo y login. Registro con correo repetido → 409 y con datos inválidos → 400.
2. Catálogo: GET /productos y la fila de stock bajo.
3. Carrito con varios productos: una pantalla de Netflix, dos pantallas de Disney+ y una cuenta de Max. Ver carrito, cambiar una cantidad, quitar y volver a agregar un producto.
4. Crear compra y pagar. Antes y después: stock de GET /productos, estados de cuentas y pantallas (SQL), servicios creados con fechaVencimiento correcto y carrito vacío.
5. Mis servicios: credenciales descifradas, días restantes, estado, y servicios sembrados por vencer. Mis compras y detalle.
6. Panel admin: login de admin, crear una cuenta (verifica sus pantallas generadas y el cambio de stock), listar inventario con filtros, y que un cliente reciba 403 en /admin.
7. Correo: demo:reset, POST /admin/cron/ejecutar con token de admin y comprobación de notificaciones en la base; segunda ejecución sin duplicados. Si MAIL_HOST, MAIL_USER y MAIL_PASS tienen valores en .env, envía correos reales a Mailtrap y dime qué debo ver en el inbox (remitente, asuntos, destinatarios); si están vacíos, usa un mailer falso temporal y dime que faltan los datos.
8. Sobreventa: un pago doble simultáneo del último producto de stock bajo con dos clientes, exactamente uno debe pasar.
9. Anota cada comportamiento inesperado, error 500, inconsistencia con el README o con la colección, y cada diferencia entre el código y el contrato.

## 8. Limpieza y cierre
Elimina la base temporal, los scripts, las copias de SQL y todo archivo temporal. Confirma que la base principal no fue modificada (mismos conteos que al empezar; tómalos al inicio). Muéstrame git status y el resumen de archivos creados o modificados. No hagas commit.

## Reporte final
Dime qué pruebas pasaron, qué archivos creaste o cambiaste, y entrega una lista de hallazgos de la aplicación (bugs, riesgos, diferencias con el contrato) ordenada por gravedad, cada uno con archivo, línea, cómo reproducirlo y una sugerencia de arreglo sin aplicarla. Termina con una lista corta "Antes de la demo" con lo que hay que hacer el día de la presentación (comandos exactos, en orden).