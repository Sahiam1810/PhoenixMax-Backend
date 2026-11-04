import { HttpError } from "../utils/httpError.js"

export class NotImplementedService {
    protected unavailable(): never { throw new HttpError("No implementado", 501) }
}
