import { Component, Input } from '@angular/core';


@Component({
    selector: 'form-field-simple-multi-input',
    templateUrl: './simple-multi-input.html'
})

/**
 * @author Thomas Kleinke
 */
export class SimpleMultiInputComponent {

    @Input() fieldContainer: any;
    @Input() fieldName: string;

    public newEntry: string = '';


    public getEntries(): string[] {

        return this.fieldContainer[this.fieldName] ? this.fieldContainer[this.fieldName] : [];
    }


    public addNewEntry() {

        if (!this.isValidEntry(this.newEntry)) return;

        if (!this.fieldContainer[this.fieldName]) this.fieldContainer[this.fieldName] = [];
        this.fieldContainer[this.fieldName].push(this.newEntry);

        this.newEntry = '';
    }


    public deleteEntry(entry: string) {

        const index: number = this.fieldContainer[this.fieldName].indexOf(entry);
        if (index > -1) this.fieldContainer[this.fieldName].splice(index, 1);

        if (this.fieldContainer[this.fieldName].length === 0) delete this.fieldContainer[this.fieldName];
    }


    public isValidEntry(entry: string): boolean {

        return entry.length > 0
            && (!this.fieldContainer[this.fieldName] || !this.fieldContainer[this.fieldName].includes(entry));
    }
}
