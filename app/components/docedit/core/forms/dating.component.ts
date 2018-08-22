import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-dating',
    templateUrl: './dating.html'
})

/**
 * @author Sebastian Cuy
 */
export class DatingComponent {

    public DATE_TYPES = {
        'bce': 'v.Chr.',
        'ce': 'n.Chr.',
        'bp': 'BP'
    };

    @Input() resource: Resource;
    @Input() field: any;

    public newDating: {} = null as any;


    constructor() {}


    public removeDating(index: number) {

        this.resource[this.field.name].splice(index, 1);
    }


    public createNewDating() {

        this.newDating = {
            type: 'range',
            dates: [{ value: 0, type: 'bce' }, { value: 0, type: 'bce' }]
        };
    }


    public addNewDating() {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        this.resource[this.field.name].push(this.convertDating(this.newDating));
        this.newDating = null as any;
    }


    public convertDating(dating: any): any {

        for (let date of dating.dates) {
            if (date.value < 0) return false;
        }

        const converted = this.createNormalizedDating(dating);

        if (dating.type != 'scientific' && converted['hasBegin'] && converted['hasEnd']
                && converted['hasBegin']['year'] > converted['hasEnd']['year']) {
            return false;
        }

        if (dating.type == 'scientific' && dating.margin > 0) {
            converted['hasEnd']['year'] = converted['hasBegin']['year'] + dating.margin;
            converted['hasBegin']['year'] -= dating.margin;
        }

        if (dating['hasSource']) converted['hasSource'] = dating['hasSource'];
        if (dating['isImprecise']) converted['isImprecise'] = true;
        if (dating['isUncertain']) converted['isUncertain'] = true;

        converted['hasLabel'] = this.generateLabel(dating);

        return converted;
    }


    private createNormalizedDating(dating: any) {

        const normalized = {} as any;

        if (dating.type != 'before')
            normalized['hasBegin'] = { year: this.normalizeDate(dating.dates[0]) };
        if (dating.type != 'after')
            normalized['hasEnd'] = { year: this.normalizeDate(dating.dates[1]) };
        if (dating.type == 'exact')
            normalized['hasEnd'] = { year: this.normalizeDate(dating.dates[0]) };

        return normalized;
    }


    private normalizeDate(date: any) {

        if (date.type == 'bce') return 0 - date.value;
        if (date.type == 'bp') return 1950 - date.value;

        return date.value;
    }


    private generateLabel(dating: any): string {

        let prefix = '';
        let year = '';
        let postfix = '';

        if (dating.type == 'range') {
            year = this.generateLabelForDate(dating.dates[0])
                + ' – ' + this.generateLabelForDate(dating.dates[1]);
        }
        if (dating.type == 'before') year = this.generateLabelForDate(dating.dates[1]);
        if (dating.type == 'after' || dating.type == 'exact') year = this.generateLabelForDate(dating.dates[0]);
        if (dating.type == 'scientific') {
            year = this.generateLabelForDate(dating.dates[0]);
            if (dating.margin > 0) year += ' ± ' + dating.margin;
        }

        if (dating['isImprecise']) prefix = 'ca. ';
        if (dating['isUncertain']) postfix = ' (?)';

        if (dating.type == 'before') prefix = 'Vor ' + prefix;
        if (dating.type == 'after') prefix = 'Nach ' + prefix;

        if (dating['hasSource']) postfix += ' [' + dating['hasSource'] + ']';

        return prefix + year + postfix;
    }


    private generateLabelForDate(date: any): string {

        if (date.value == 0) {
            return '0';
        } else {
            return date.value + ' ' + ((this.DATE_TYPES as any)[date.type as any] as any);
        }
    }
}