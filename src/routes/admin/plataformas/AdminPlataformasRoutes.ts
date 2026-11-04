import { Router } from "express"
import { AdminPlataformasController } from "../../../controllers/admin/plataformas/AdminPlataformasController.js"
export const adminPlataformasRouter = Router()
adminPlataformasRouter.get("/", AdminPlataformasController.list).post("/", AdminPlataformasController.create).patch("/:id", AdminPlataformasController.update).delete("/:id", AdminPlataformasController.remove)
