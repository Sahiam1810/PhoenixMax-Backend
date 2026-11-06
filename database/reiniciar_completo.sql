-- ============================================================
-- reiniciar_completo.sql
-- Limpieza total de la base de datos streamstoreDb
-- Permite volver a ejecutar streamstoreDb.sql + npm run seed
-- ============================================================

-- Desactivar restricciones de claves foráneas para poder borrar en cualquier orden
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todas las tablas del esquema
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS compraItems;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS carritoItems;
DROP TABLE IF EXISTS pantallas;
DROP TABLE IF EXISTS cuentas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS plataformas;
DROP TABLE IF EXISTS usuarios;

-- Reactivar restricciones
SET FOREIGN_KEY_CHECKS = 1;

-- Eliminar la base de datos completa (opcional, descomentar si se desea)
-- DROP DATABASE IF EXISTS streamstoreDb;

SELECT 'Limpieza completada. Ahora puedes ejecutar streamstoreDb.sql y luego npm run seed.' AS mensaje;

