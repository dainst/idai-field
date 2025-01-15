import { Component, Input } from '@angular/core';
import { EditableValue } from 'idai-field-core';


@Component({
    selector: 'form-field-valuelist-multi-input',
    templateUrl: './valuelist-multi-input.html',
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class ValuelistMultiInputComponent {

    @Input() fieldContainer: any;
    @Input() fieldName: string;

    public newEntry: EditableValue = { value: '', selectable: true };


    public getEntries(): string[] {

        return this.fieldContainer[this.fieldName] ? this.fieldContainer[this.fieldName] : [];
    }


    public addNewEntry() {

        if (!this.isValidEntry(this.newEntry)) return;

        if (!this.fieldContainer[this.fieldName]) this.fieldContainer[this.fieldName] = [];
        this.fieldContainer[this.fieldName].push(this.newEntry);

        this.newEntry = { value: '', selectable: true };
    }


    public deleteEntry(entry: EditableValue) {

        const index: number = this.fieldContainer[this.fieldName].indexOf(entry);
        if (index > -1) this.fieldContainer[this.fieldName].splice(index, 1);

        if (this.fieldContainer[this.fieldName].length === 0) delete this.fieldContainer[this.fieldName];
    }


    public isValidEntry(entry: EditableValue): boolean {

        const existingValues: string[] = this.fieldContainer[this.fieldName]?.map(entry => entry.value) ?? [];
        return entry.value.length > 0 && !existingValues.includes(entry.value);
    }


    public toggleSelectable(entry: EditableValue) {

        entry.selectable = !entry.selectable;
    }
}
