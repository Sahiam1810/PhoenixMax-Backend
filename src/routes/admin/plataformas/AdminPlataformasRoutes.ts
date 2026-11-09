import { Router } from "express"
import { AdminPlataformasController } from "../../../controllers/admin/plataformas/AdminPlataformasController.js"
import { validateSchema } from "../../../middlewares/ValidateSchema.js"
import { idParamSchema } from "../../../validators/CommonValidators.js"
import { adminPlataformaSchema, updateAdminPlataformaEstadoSchema, updateAdminPlataformaSchema } from "../../../validators/admin/plataformas/AdminPlataformasValidators.js"
export const adminPlataformasRouter = Router()
adminPlataformasRouter.get("/", AdminPlataformasController.list)
adminPlataformasRouter.post("/", validateSchema(adminPlataformaSchema, "body"), AdminPlataformasController.create)
adminPlataformasRouter.patch("/:id", validateSchema(idParamSchema, "params"), validateSchema(updateAdminPlataformaSchema, "body"), AdminPlataformasController.update)
adminPlataformasRouter.patch("/:id/estado", validateSchema(idParamSchema, "params"), validateSchema(updateAdminPlataformaEstadoSchema, "body"), AdminPlataformasController.cambiarEstado)
