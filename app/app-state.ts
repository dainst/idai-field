import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppState {

    private currentUser;

    public getCurrentUser() {
        return this.currentUser;
    }

    public setCurrentUser(name) {
        this.currentUser = name;
    }
}