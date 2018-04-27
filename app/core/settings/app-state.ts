import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppState { // TODO remove

    private imagestorePath: string;

    public getImagestorePath(): string {

        return this.imagestorePath;
    }

    public setImagestorePath(imagestorePath: string) {

        this.imagestorePath = imagestorePath;
    }
}