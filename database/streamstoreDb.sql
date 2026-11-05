CREATE DATABASE IF NOT EXISTS streamstoreDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE streamstoreDb;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30) NULL,
    rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente' COMMENT 'cliente o admin',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plataformas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    logoUrl VARCHAR(500) NULL,
    maxPantallas INT UNSIGNED NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plataformaId INT UNSIGNED NOT NULL,
    tipo ENUM('cuenta', 'pantalla') NOT NULL COMMENT 'cuenta o pantalla',
    duracionDias INT UNSIGNED NOT NULL,
    precio DECIMAL(14,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_productos_activo_plataforma (activo, plataformaId),
    CONSTRAINT fk_productos_plataforma FOREIGN KEY (plataformaId) REFERENCES plataformas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuentas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    plataformaId INT UNSIGNED NOT NULL,
    emailAcceso VARCHAR(160) NOT NULL,
    passwordAcceso TEXT NOT NULL,
    estado ENUM('disponible', 'parcial', 'vendida', 'inactiva') NOT NULL DEFAULT 'disponible' COMMENT 'disponible, parcial, vendida o inactiva',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cuentas_plataforma_estado (plataformaId, estado),
    CONSTRAINT fk_cuentas_plataforma FOREIGN KEY (plataformaId) REFERENCES plataformas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pantallas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cuentaId INT UNSIGNED NOT NULL,
    nombrePerfil VARCHAR(100) NOT NULL,
    pin VARCHAR(20) NULL,
    estado ENUM('disponible', 'vendida') NOT NULL DEFAULT 'disponible' COMMENT 'disponible o vendida',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pantallas_cuenta_estado (cuentaId, estado),
    CONSTRAINT fk_pantallas_cuenta FOREIGN KEY (cuentaId) REFERENCES cuentas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carritoItems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT UNSIGNED NOT NULL,
    productoId INT UNSIGNED NOT NULL,
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_carrito_usuario_producto (usuarioId, productoId),
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_carrito_producto FOREIGN KEY (productoId) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS compras (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT UNSIGNED NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    estado ENUM('pendiente', 'pagada', 'cancelada') NOT NULL DEFAULT 'pendiente' COMMENT 'pendiente, pagada o cancelada',
    metodoPago VARCHAR(50) NULL,
    pagadaAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_compras_usuario FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS compraItems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    compraId INT UNSIGNED NOT NULL,
    productoId INT UNSIGNED NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    precioUnitario DECIMAL(14,2) NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_compra_items_compra FOREIGN KEY (compraId) REFERENCES compras(id),
    CONSTRAINT fk_compra_items_producto FOREIGN KEY (productoId) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS servicios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    compraItemId INT UNSIGNED NOT NULL,
    usuarioId INT UNSIGNED NOT NULL,
    cuentaId INT UNSIGNED NOT NULL,
    pantallaId INT UNSIGNED NULL,
    fechaInicio DATETIME NOT NULL,
    fechaVencimiento DATETIME NOT NULL,
    estado ENUM('activo', 'vencido') NOT NULL DEFAULT 'activo' COMMENT 'activo o vencido',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_servicios_compra_item FOREIGN KEY (compraItemId) REFERENCES compraItems(id),
    CONSTRAINT fk_servicios_usuario FOREIGN KEY (usuarioId) REFERENCES usuarios(id),
    CONSTRAINT fk_servicios_cuenta FOREIGN KEY (cuentaId) REFERENCES cuentas(id),
    CONSTRAINT fk_servicios_pantalla FOREIGN KEY (pantallaId) REFERENCES pantallas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    servicioId INT UNSIGNED NOT NULL,
    tipo ENUM('3_dias', '1_dia', 'vencido') NOT NULL COMMENT '3_dias, 1_dia o vencido',
    enviadaAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notificacion_servicio_tipo (servicioId, tipo),
    CONSTRAINT fk_notificaciones_servicio FOREIGN KEY (servicioId) REFERENCES servicios(id)
) ENGINE=InnoDB;

-- Los datos semilla se cargan con npm run seed: 1 admin, 2 clientes, 4 plataformas, 2 productos por plataforma,
-- 3 cuentas por plataforma, servicios por vencer en 3 y 1 día y un producto con stock bajo.
