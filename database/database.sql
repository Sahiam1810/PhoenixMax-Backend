CREATE DATABASE IF NOT EXISTS streamstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE streamstore;

CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE plataformas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  logo_url VARCHAR(255),
  max_pantallas TINYINT UNSIGNED NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plataforma_id INT UNSIGNED NOT NULL,
  tipo ENUM('cuenta', 'pantalla') NOT NULL,
  duracion_dias SMALLINT UNSIGNED NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (plataforma_id) REFERENCES plataformas(id)
) ENGINE=InnoDB;

CREATE TABLE cuentas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plataforma_id INT UNSIGNED NOT NULL,
  email_acceso VARCHAR(150) NOT NULL,
  password_acceso VARCHAR(255) NOT NULL, -- cifrada con AES
  estado ENUM('disponible', 'parcial', 'vendida', 'inactiva') NOT NULL DEFAULT 'disponible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plataforma_id) REFERENCES plataformas(id)
) ENGINE=InnoDB;

CREATE TABLE pantallas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_id INT UNSIGNED NOT NULL,
  nombre_perfil VARCHAR(50) NOT NULL,
  pin VARCHAR(10) NOT NULL,
  estado ENUM('disponible', 'vendida') NOT NULL DEFAULT 'disponible',
  FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE carrito_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_carrito_usuario_producto (usuario_id, producto_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE compras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  estado ENUM('pendiente', 'pagada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  metodo_pago VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pagada_at DATETIME NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE compra_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  compra_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE servicios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  compra_item_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  cuenta_id INT UNSIGNED NOT NULL,
  pantalla_id INT UNSIGNED NULL, -- NULL si es cuenta completa
  fecha_inicio DATETIME NOT NULL,
  fecha_vencimiento DATETIME NOT NULL,
  estado ENUM('activo', 'vencido') NOT NULL DEFAULT 'activo',
  FOREIGN KEY (compra_item_id) REFERENCES compra_items(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (cuenta_id) REFERENCES cuentas(id),
  FOREIGN KEY (pantalla_id) REFERENCES pantallas(id)
) ENGINE=InnoDB;

CREATE TABLE notificaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  servicio_id INT UNSIGNED NOT NULL,
  tipo ENUM('3_dias', '1_dia', 'vencido') NOT NULL,
  enviada_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notificacion_servicio_tipo (servicio_id, tipo),
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
