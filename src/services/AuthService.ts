import { NotImplementedService } from "./NotImplementedService.js"

export class AuthService extends NotImplementedService {
    register(): never { return this.unavailable() }
    login(): never { return this.unavailable() }
    me(): never { return this.unavailable() }
}
