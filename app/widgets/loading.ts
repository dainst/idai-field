import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Loading {

    private loading: number = 0;


    public start() {

        this.loading++;
    }


    public stop() {

        this.loading--;
    }


    public isLoading(): boolean {

        return this.loading > 0;
    }
}