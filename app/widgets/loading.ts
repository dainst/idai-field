import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Loading {

    private loading: number = 0;
    private context: string|undefined;


    public start(context?: string) {

        if (context && !this.context) this.context = context;
        this.loading++;
    }


    public stop() {

        this.loading--;
        if (this.loading === 0) this.context = undefined;
    }


    public isLoading(): boolean {

        return this.loading > 0;
    }


    public getContext(): string|undefined {

        return this.context;
    }
}