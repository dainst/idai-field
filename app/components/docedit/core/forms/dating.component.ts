import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {DatingUtil} from '../../../../core/util/dating-util';


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

        if (dating.begin && (!Number.isInteger(dating.begin.year) || dating.begin.year < 0)) return false;
        if (dating.end && (!Number.isInteger(dating.end.year) || dating.end.year < 0)) return false;
        return dating.type !== 'range' || DatingComponent.validateRangeDating(dating);
    }


    private static validateRangeDating(dating: Dating): boolean {

        return dating.begin !== undefined && dating.end !== undefined &&
            this.getNormalizedYear(dating.begin) < this.getNormalizedYear(dating.end);
    }


    private static getNormalizedYear(date: any): number {

        if (date.type === 'bce') return 0 - date.year;
        if (date.type === 'bp') return 1950 - date.year;

        return date.year;
    }
}