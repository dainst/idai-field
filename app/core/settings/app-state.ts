import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppState {

    private currentUser: string;
    private imagestorePath: string;


    public getCurrentUser(): string {

        return this.currentUser;
    }


    public setCurrentUser(name: string) {

        this.currentUser = name;
    }


    public getImagestorePath(): string {

        return this.imagestorePath;
    }


    public setImagestorePath(imagestorePath: string) {

        this.imagestorePath = imagestorePath;
    }
}