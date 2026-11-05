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

SET @existe = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cuentas'
      AND INDEX_NAME = 'uq_cuentas_plataforma_email'
);
SET @sql = IF(@existe = 0, 'CREATE UNIQUE INDEX uq_cuentas_plataforma_email ON cuentas (plataformaId, emailAcceso)', 'SELECT ''uq_cuentas_plataforma_email ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pantallas'
      AND INDEX_NAME = 'uq_pantallas_cuenta_perfil'
);
SET @sql = IF(@existe = 0, 'CREATE UNIQUE INDEX uq_pantallas_cuenta_perfil ON pantallas (cuentaId, nombrePerfil)', 'SELECT ''uq_pantallas_cuenta_perfil ya existe'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cuentas'
      AND REFERENCED_TABLE_NAME = 'plataformas'
    LIMIT 1
);
SET @regla = (
    SELECT DELETE_RULE
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cuentas'
      AND CONSTRAINT_NAME = @fk
);
SET @sql = IF(@fk IS NOT NULL AND @regla <> 'RESTRICT', CONCAT('ALTER TABLE cuentas DROP FOREIGN KEY `', @fk, '`'), 'SELECT ''fk de cuentas sin cambios'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = IF(@fk IS NULL OR @regla <> 'RESTRICT', 'ALTER TABLE cuentas ADD CONSTRAINT fk_cuentas_plataforma FOREIGN KEY (plataformaId) REFERENCES plataformas(id) ON DELETE RESTRICT', 'SELECT ''fk_cuentas_plataforma ya es RESTRICT'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pantallas'
      AND REFERENCED_TABLE_NAME = 'cuentas'
    LIMIT 1
);
SET @regla = (
    SELECT DELETE_RULE
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pantallas'
      AND CONSTRAINT_NAME = @fk
);
SET @sql = IF(@fk IS NOT NULL AND @regla <> 'RESTRICT', CONCAT('ALTER TABLE pantallas DROP FOREIGN KEY `', @fk, '`'), 'SELECT ''fk de pantallas sin cambios'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = IF(@fk IS NULL OR @regla <> 'RESTRICT', 'ALTER TABLE pantallas ADD CONSTRAINT fk_pantallas_cuenta FOREIGN KEY (cuentaId) REFERENCES cuentas(id) ON DELETE RESTRICT', 'SELECT ''fk_pantallas_cuenta ya es RESTRICT'' AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
