import { Router } from "express"
import { CuentasController } from "../../../controllers/admin/cuentas/CuentasController.js"
import { validateSchema } from "../../../middlewares/ValidateSchema.js"
import { createCuentaSchema, listCuentasQuerySchema } from "../../../validators/admin/cuentas/CuentasValidators.js"

export const adminCuentasRouter = Router()

adminCuentasRouter.get("/", validateSchema(listCuentasQuerySchema, "query"), CuentasController.list)
adminCuentasRouter.post("/", validateSchema(createCuentaSchema, "body"), CuentasController.create)
