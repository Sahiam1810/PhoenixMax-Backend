SET @schema_name = DATABASE();

SHOW CREATE TABLE carritoItems;

SELECT rc.CONSTRAINT_NAME, rc.DELETE_RULE
INTO @fk_usuario, @regla_usuario
FROM information_schema.REFERENTIAL_CONSTRAINTS rc
INNER JOIN information_schema.TABLE_CONSTRAINTS tc
    ON BINARY tc.CONSTRAINT_SCHEMA = BINARY rc.CONSTRAINT_SCHEMA
    AND BINARY tc.TABLE_NAME = BINARY rc.TABLE_NAME
    AND BINARY tc.CONSTRAINT_NAME = BINARY rc.CONSTRAINT_NAME
WHERE BINARY rc.CONSTRAINT_SCHEMA = BINARY @schema_name
  AND rc.TABLE_NAME = 'carritoItems'
  AND rc.REFERENCED_TABLE_NAME = 'usuarios'
  AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
LIMIT 1;

SET @sql = IF(
    @fk_usuario IS NOT NULL AND @regla_usuario <> 'CASCADE',
    CONCAT('ALTER TABLE carritoItems DROP FOREIGN KEY `', @fk_usuario, '`'),
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SELECT COUNT(*)
INTO @existe_fk_usuario
FROM information_schema.TABLE_CONSTRAINTS
WHERE BINARY CONSTRAINT_SCHEMA = BINARY @schema_name
  AND TABLE_NAME = 'carritoItems'
  AND CONSTRAINT_NAME = 'fk_carrito_usuario'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SET @sql = IF(
    @existe_fk_usuario = 0,
    'ALTER TABLE carritoItems ADD CONSTRAINT fk_carrito_usuario FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SELECT rc.CONSTRAINT_NAME, rc.DELETE_RULE
INTO @fk_producto, @regla_producto
FROM information_schema.REFERENTIAL_CONSTRAINTS rc
INNER JOIN information_schema.TABLE_CONSTRAINTS tc
    ON BINARY tc.CONSTRAINT_SCHEMA = BINARY rc.CONSTRAINT_SCHEMA
    AND BINARY tc.TABLE_NAME = BINARY rc.TABLE_NAME
    AND BINARY tc.CONSTRAINT_NAME = BINARY rc.CONSTRAINT_NAME
WHERE BINARY rc.CONSTRAINT_SCHEMA = BINARY @schema_name
  AND rc.TABLE_NAME = 'carritoItems'
  AND rc.REFERENCED_TABLE_NAME = 'productos'
  AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
LIMIT 1;

SET @sql = IF(
    @fk_producto IS NOT NULL AND @regla_producto <> 'RESTRICT',
    CONCAT('ALTER TABLE carritoItems DROP FOREIGN KEY `', @fk_producto, '`'),
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SELECT COUNT(*)
INTO @existe_fk_producto
FROM information_schema.TABLE_CONSTRAINTS
WHERE BINARY CONSTRAINT_SCHEMA = BINARY @schema_name
  AND TABLE_NAME = 'carritoItems'
  AND CONSTRAINT_NAME = 'fk_carrito_producto'
  AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SET @sql = IF(
    @existe_fk_producto = 0,
    'ALTER TABLE carritoItems ADD CONSTRAINT fk_carrito_producto FOREIGN KEY (productoId) REFERENCES productos(id) ON DELETE RESTRICT',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SHOW CREATE TABLE carritoItems;
