import {Component, Input} from '@angular/core';
import {Resource, Dating} from 'idai-field-core';
import {UtilTranslations} from '../../../../core/util/util-translations';


@Component({
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


    constructor(private utilTranslations: UtilTranslations) {}


    public removeDating(index: number) {

        this.resource[this.field.name].splice(index, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public createNewDating() {

        this.newDating = {
            type: 'range',
            begin: { year: 0, inputYear: 0, inputType: 'bce' },
            end: { year: 0, inputYear: 0, inputType: 'bce' }
        };
    }


    public addNewDating() {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        this.resource[this.field.name].push(this.newDating);
        this.newDating = undefined;
    }


    public getLabel(dating: Dating): string {

        return dating.label ? dating.label : Dating.generateLabel(dating, (key: string) => this.utilTranslations.getTranslation(key));
    }


    public validate(dating: Dating): boolean {

        if (dating.type === 'exact' || dating.type === 'before') delete dating.begin;
        if (dating.type === 'after') delete dating.end;

        Dating.addNormalizedValues(dating);

        return Dating.isDating(dating) && Dating.isValid(dating);
    }
}
