import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {DatingUtil} from '../../../../core/util/dating-util';
import {Validations} from '../../../../core/model/validations';


export interface Dating {
    type: 'range'|'exact'|'before'|'after'|'scientific',
    begin?: { year: number, type: 'bce'|'ce'|'bp' },
    end?: { year: number, type: 'bce'|'ce'|'bp' },
    margin?: number,
    source?: string,
    isImprecise?: boolean,
    isUncertain?: boolean,
    label?: string  // Deprecated
}


@Component({
    moduleId: module.id,
    selector: 'dai-dating',
    templateUrl: './dating.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DatingComponent {

    @Input() resource: Resource;
    @Input() field: any;

    public newDating: Dating|undefined = undefined;


    constructor() {}


    public removeDating(index: number) {

        this.resource[this.field.name].splice(index, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public createNewDating() {

        this.newDating = {
            type: 'range',
            begin: { year: 0, type: 'bce' },
            end: { year: 0, type: 'bce' }
        };
    }


    public addNewDating() {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        this.resource[this.field.name].push(this.newDating);
        this.newDating = undefined;
    }


    public getLabel(dating: Dating): string {

        return dating.label ? dating.label : DatingUtil.generateLabel(dating);
    }


    public validate(dating: Dating): boolean {

        return Validations.validateDating(dating, false);
    }
}