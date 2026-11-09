import { Router } from "express"
import { AdminUsuariosController } from "../../../controllers/admin/usuarios/AdminUsuariosController.js"
import { validateSchema } from "../../../middlewares/ValidateSchema.js"
import { idParamSchema } from "../../../validators/CommonValidators.js"
import { createAdminUsuarioSchema, listAdminUsuariosQuerySchema, updateAdminUsuarioEstadoSchema } from "../../../validators/admin/usuarios/AdminUsuariosValidators.js"

export const adminUsuariosRouter = Router()
adminUsuariosRouter.get("/", validateSchema(listAdminUsuariosQuerySchema, "query"), AdminUsuariosController.list)
adminUsuariosRouter.post("/", validateSchema(createAdminUsuarioSchema, "body"), AdminUsuariosController.create)
adminUsuariosRouter.patch("/:id/estado", validateSchema(idParamSchema, "params"), validateSchema(updateAdminUsuarioEstadoSchema, "body"), AdminUsuariosController.cambiarEstado)
