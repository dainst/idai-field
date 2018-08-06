import {Injectable} from "@angular/core";

/**
 * This is a facade that provides the facility to monitor the
 * state of the document selected in {@see DocumentEditComponent}.
 * 
 * @author Daniel de Oliveira
 */
@Injectable()
export class DocumentEditChangeMonitor {

    private changed = false;
    
    /**
     * @returns {boolean} true if the document in DocumentEdit
     *   has been manipulated by the user since it got set.
     */
    public isChanged() {
        return this.changed;
    }

    public reset() {
        this.changed=false;
    }
    
    /**
     * Package private.
     */
    setChanged() {
        this.changed=true;
    }
}
