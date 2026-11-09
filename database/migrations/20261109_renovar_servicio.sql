SET @schema_name = DATABASE();

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND COLUMN_NAME = 'servicioId') = 0,
    'ALTER TABLE carritoItems ADD COLUMN servicioId INT UNSIGNED NULL AFTER productoId',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND COLUMN_NAME = 'servicioIdIndice') = 0,
    'ALTER TABLE carritoItems ADD COLUMN servicioIdIndice INT UNSIGNED NOT NULL DEFAULT 0 AFTER servicioId',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND COLUMN_NAME = 'servicioIdIndice'
       AND EXTRA LIKE '%GENERATED%') > 0,
    'ALTER TABLE carritoItems MODIFY COLUMN servicioIdIndice INT UNSIGNED NOT NULL DEFAULT 0',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

DROP TRIGGER IF EXISTS bi_carritoitems_servicio_indice;
CREATE TRIGGER bi_carritoitems_servicio_indice
BEFORE INSERT ON carritoItems
FOR EACH ROW
SET NEW.servicioIdIndice = IFNULL(NEW.servicioId, 0);

DROP TRIGGER IF EXISTS bu_carritoitems_servicio_indice;
CREATE TRIGGER bu_carritoitems_servicio_indice
BEFORE UPDATE ON carritoItems
FOR EACH ROW
SET NEW.servicioIdIndice = IFNULL(NEW.servicioId, 0);

UPDATE carritoItems
SET servicioIdIndice = IFNULL(servicioId, 0)
WHERE servicioIdIndice IS NULL
   OR servicioIdIndice <> IFNULL(servicioId, 0);

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND COLUMN_NAME = 'servicioIdIndice'
       AND IS_NULLABLE = 'YES') > 0,
    'ALTER TABLE carritoItems MODIFY COLUMN servicioIdIndice INT UNSIGNED NOT NULL DEFAULT 0',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND INDEX_NAME = 'uq_carrito_usuario_producto_servicio') = 0,
    'ALTER TABLE carritoItems ADD UNIQUE KEY uq_carrito_usuario_producto_servicio (usuarioId, productoId, servicioIdIndice)',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND INDEX_NAME = 'uq_carrito_usuario_producto') > 0,
    'ALTER TABLE carritoItems DROP INDEX uq_carrito_usuario_producto',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = @schema_name
       AND TABLE_NAME = 'carritoItems'
       AND CONSTRAINT_NAME = 'fk_carrito_servicio') = 0,
    'ALTER TABLE carritoItems ADD CONSTRAINT fk_carrito_servicio FOREIGN KEY (servicioId) REFERENCES servicios(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'compraItems'
       AND COLUMN_NAME = 'servicioRenovadoId') = 0,
    'ALTER TABLE compraItems ADD COLUMN servicioRenovadoId INT UNSIGNED NULL AFTER productoId',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = @schema_name
       AND TABLE_NAME = 'compraItems'
       AND CONSTRAINT_NAME = 'fk_compra_items_servicio_renovado') = 0,
    'ALTER TABLE compraItems ADD CONSTRAINT fk_compra_items_servicio_renovado FOREIGN KEY (servicioRenovadoId) REFERENCES servicios(id)',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;
