import { Router } from "express"
import { CuentasController } from "../../../controllers/admin/cuentas/CuentasController.js"
export const adminCuentasRouter = Router()
adminCuentasRouter.get("/", CuentasController.list).post("/", CuentasController.create)
