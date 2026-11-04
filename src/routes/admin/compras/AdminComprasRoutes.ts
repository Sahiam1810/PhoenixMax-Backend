import { Router } from "express"
import { AdminComprasController } from "../../../controllers/admin/compras/AdminComprasController.js"
export const adminComprasRouter = Router()
adminComprasRouter.get("/", AdminComprasController.list)
