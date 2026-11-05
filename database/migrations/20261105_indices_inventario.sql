USE streamstoreDb;

SET @existe = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cuentas'
      AND INDEX_NAME = 'idx_cuentas_plataforma_estado'
);
SET @sql = IF(@existe = 0, 'CREATE INDEX idx_cuentas_plataforma_estado ON cuentas (plataformaId, estado)', 'SELECT ''idx_cuentas_plataforma_estado ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pantallas'
      AND INDEX_NAME = 'idx_pantallas_cuenta_estado'
);
SET @sql = IF(@existe = 0, 'CREATE INDEX idx_pantallas_cuenta_estado ON pantallas (cuentaId, estado)', 'SELECT ''idx_pantallas_cuenta_estado ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND INDEX_NAME = 'idx_productos_activo_plataforma'
);
SET @sql = IF(@existe = 0, 'CREATE INDEX idx_productos_activo_plataforma ON productos (activo, plataformaId)', 'SELECT ''idx_productos_activo_plataforma ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
