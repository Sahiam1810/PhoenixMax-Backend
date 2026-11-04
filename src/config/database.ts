import { Sequelize } from "sequelize-typescript"
import { config } from "./config.js"
import { CarritoItem } from "../models/CarritoItem.js"
import { Compra } from "../models/Compra.js"
import { CompraItem } from "../models/CompraItem.js"
import { Cuenta } from "../models/Cuenta.js"
import { Notificacion } from "../models/Notificacion.js"
import { Pantalla } from "../models/Pantalla.js"
import { Plataforma } from "../models/Plataforma.js"
import { Producto } from "../models/Producto.js"
import { Servicio } from "../models/Servicio.js"
import { Usuario } from "../models/Usuario.js"

export const sequelize = new Sequelize({ dialect: "mysql", host: config.database.host, port: config.database.port, database: config.database.name, username: config.database.username, password: config.database.password, timezone: config.database.timezone, logging: false, models: [Usuario, Plataforma, Producto, Cuenta, Pantalla, CarritoItem, Compra, CompraItem, Servicio, Notificacion] })
