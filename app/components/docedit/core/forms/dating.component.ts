import {Component, Input} from '@angular/core';
import {Resource, Dating} from 'idai-components-2';
import {DatingUtil} from '../../../../core/util/dating-util';
import {Validations} from '../../../../core/model/validations';


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

        return dating.label ? dating.label : DatingUtil.generateLabel(dating);
    }


    public validate(dating: Dating): boolean {

        DatingComponent.preprocess(dating);

        return Validations.validateDating(dating);
    }


    private static preprocess(dating: Dating) {

        this.setNormalizedYears(dating);
        if (dating.type === 'scientific') this.applyMargin(dating);
    }


    private static setNormalizedYears(dating: Dating) {

        if (dating.begin) {
            dating.begin.year = DatingUtil.getNormalizedYear(dating.begin.inputYear, dating.begin.inputType);
        }

        if (dating.end) {
            dating.end.year = DatingUtil.getNormalizedYear(dating.end.inputYear, dating.end.inputType);
        }
    }


    private static applyMargin(dating: Dating) {

        if (!dating.begin || !dating.end || !dating.margin) return;

        dating.begin.inputYear = dating.end.inputYear;
        dating.begin.year = dating.begin.inputYear - dating.margin;
        dating.end.year = dating.end.inputYear + dating.margin;
    }
}