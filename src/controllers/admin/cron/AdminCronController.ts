import type { Request, Response } from "express"
import { AdminCronService } from "../../../services/admin/cron/AdminCronService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
const service = new AdminCronService()
export class AdminCronController { static run(_q: Request, r: Response): void { try { service.run() } catch (e) { ApiResponse.error(r, e) } } }
