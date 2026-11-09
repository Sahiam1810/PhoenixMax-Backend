import { Router } from "express"
import { AdminProductosController } from "../../../controllers/admin/productos/AdminProductosController.js"
import { validateSchema } from "../../../middlewares/ValidateSchema.js"
import { idParamSchema } from "../../../validators/CommonValidators.js"
import { adminProductoSchema, updateAdminProductoEstadoSchema, updateAdminProductoSchema } from "../../../validators/admin/productos/AdminProductosValidators.js"
export const adminProductosRouter = Router()
adminProductosRouter.get("/", AdminProductosController.list)
adminProductosRouter.post("/", validateSchema(adminProductoSchema, "body"), AdminProductosController.create)
adminProductosRouter.patch("/:id", validateSchema(idParamSchema, "params"), validateSchema(updateAdminProductoSchema, "body"), AdminProductosController.update)
adminProductosRouter.patch("/:id/estado", validateSchema(idParamSchema, "params"), validateSchema(updateAdminProductoEstadoSchema, "body"), AdminProductosController.cambiarEstado)
