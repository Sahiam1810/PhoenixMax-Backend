import { Router } from "express"
import { AdminCronController } from "../../../controllers/admin/cron/AdminCronController.js"
export const adminCronRouter = Router()
adminCronRouter.post("/ejecutar", AdminCronController.run)
