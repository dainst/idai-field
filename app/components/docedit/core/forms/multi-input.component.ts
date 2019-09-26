import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-multi-input',
    templateUrl: './multi-input.html'
})

/**
 * @author Thomas Kleinke
 */
export class MultiInputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;

    public newEntry: string = '';


    public getEntries(): string[] {

        return this.resource[this.fieldName] ? this.resource[this.fieldName] : [];
    }


    public addNewEntry() {

        if (this.newEntry.length === 0) return;

        if (!this.resource[this.fieldName]) this.resource[this.fieldName] = [];
        this.resource[this.fieldName].push(this.newEntry);

        this.newEntry = '';
    }


    public deleteEntry(entry: string) {

        const index: number = this.resource[this.fieldName].indexOf(entry);
        if (index > -1) this.resource[this.fieldName].splice(index, 1);

        if (this.resource[this.fieldName].length === 0) delete this.resource[this.fieldName];
    }
}