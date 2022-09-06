import { Component, Input } from '@angular/core';
import { Resource } from 'idai-field-core';


@Component({
    selector: 'form-field-simple-multi-input',
    templateUrl: './simple-multi-input.html'
})

/**
 * @author Thomas Kleinke
 */
export class SimpleMultiInputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;

    public newEntry: string = '';


    public getEntries(): string[] {

        return this.resource[this.fieldName] ? this.resource[this.fieldName] : [];
    }


    public addNewEntry() {

        if (!this.isValidEntry(this.newEntry)) return;

        if (!this.resource[this.fieldName]) this.resource[this.fieldName] = [];
        this.resource[this.fieldName].push(this.newEntry);

        this.newEntry = '';
    }


    public deleteEntry(entry: string) {

        const index: number = this.resource[this.fieldName].indexOf(entry);
        if (index > -1) this.resource[this.fieldName].splice(index, 1);

        if (this.resource[this.fieldName].length === 0) delete this.resource[this.fieldName];
    }


    public isValidEntry(entry: string): boolean {

        return entry.length > 0
            && (!this.resource[this.fieldName] || !this.resource[this.fieldName].includes(entry));
    }
}
