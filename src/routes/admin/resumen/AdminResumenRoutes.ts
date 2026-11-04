import { Router } from "express"
import { AdminResumenController } from "../../../controllers/admin/resumen/AdminResumenController.js"
export const adminResumenRouter = Router()
adminResumenRouter.get("/", AdminResumenController.get)
