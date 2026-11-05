import { Router } from "express"
import { CuentasController } from "../../../controllers/admin/cuentas/CuentasController.js"
import { validateSchema } from "../../../middlewares/ValidateSchema.js"
import { idParamSchema } from "../../../validators/CommonValidators.js"
import { createCuentaSchema, listCuentasQuerySchema, updateCuentaEstadoSchema } from "../../../validators/admin/cuentas/CuentasValidators.js"

export const adminCuentasRouter = Router()

adminCuentasRouter.get("/", validateSchema(listCuentasQuerySchema, "query"), CuentasController.list)
adminCuentasRouter.post("/", validateSchema(createCuentaSchema, "body"), CuentasController.create)
adminCuentasRouter.patch("/:id/estado", validateSchema(idParamSchema, "params"), validateSchema(updateCuentaEstadoSchema, "body"), CuentasController.cambiarEstado)
