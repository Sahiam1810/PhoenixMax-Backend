import { Router } from "express"
import { AdminProductosController } from "../../../controllers/admin/productos/AdminProductosController.js"
export const adminProductosRouter = Router()
adminProductosRouter.get("/", AdminProductosController.list).post("/", AdminProductosController.create).patch("/:id", AdminProductosController.update).delete("/:id", AdminProductosController.remove)
