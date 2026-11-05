import { Compra } from "../../models/Compra.js"
import { CompraItem } from "../../models/CompraItem.js"
import { Cuenta } from "../../models/Cuenta.js"
import { Pantalla } from "../../models/Pantalla.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"
import { Servicio } from "../../models/Servicio.js"

export class ServiciosRepository {
    async findByUsuario(usuarioId: number): Promise<Servicio[]> {
        return Servicio.findAll({
            where: { usuarioId },
            include: [
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
                                attributes: ["id", "nombre", "logoUrl"]
                            }]
                        }
                    ]
                },
                {
                    model: Cuenta,
                    required: true,
                    attributes: ["id", "emailAcceso", "passwordAcceso"]
                },
                {
                    model: Pantalla,
                    required: false,
                    attributes: ["id", "nombrePerfil", "pin"]
                }
            ],
            order: [["fechaVencimiento", "ASC"], ["id", "ASC"]]
        })
    }
}
