import { Op } from "sequelize"
import { Compra } from "../../models/Compra.js"
import { CompraItem } from "../../models/CompraItem.js"
import { Notificacion, type NotificacionCreationAttributes } from "../../models/Notificacion.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"
import { Servicio } from "../../models/Servicio.js"
import { Usuario } from "../../models/Usuario.js"

export class VencimientosRepository {
    async findServiciosActivos(): Promise<Servicio[]> {
        return Servicio.findAll({
            where: { estado: "activo" },
            include: [
                {
                    model: Usuario,
                    required: true,
                    attributes: ["id", "nombre", "email", "telefono"]
                },
                {
                    model: CompraItem,
                    required: true,
                    attributes: ["id"],
                    include: [
                        {
                            model: Compra,
                            required: true,
                            where: { estado: "pagada" },
                            attributes: ["id"]
                        },
                        {
                            model: Producto,
                            required: true,
                            attributes: ["id", "tipo"],
                            include: [{
                                model: Plataforma,
                                required: true,
                                attributes: ["id", "nombre"]
                            }]
                        }
                    ]
                }
            ],
            order: [["fechaVencimiento", "ASC"], ["id", "ASC"]]
        })
    }

    async createNotificacion(data: NotificacionCreationAttributes): Promise<Notificacion> {
        return Notificacion.create(data)
    }

    async deleteNotificacion(id: number): Promise<number> {
        return Notificacion.destroy({ where: { id } })
    }

    async marcarVencidos(ahora: Date): Promise<number> {
        const [actualizados] = await Servicio.update(
            { estado: "vencido" },
            { where: { estado: "activo", fechaVencimiento: { [Op.lte]: ahora } } }
        )

        return actualizados
    }
}
