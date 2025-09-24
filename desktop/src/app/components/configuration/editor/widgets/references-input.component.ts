import { Component, Input } from '@angular/core';


@Component({
    selector: 'references-input',
    templateUrl: './references-input.html',
    standalone: false
})
/**
* @author Thomas Kleinke
 */
export class ReferencesInputComponent {

    @Input() references: string[];


    public getTrackingIndex = (index, _) => index;


    public addReference() {

        if (this.references.length > 0 && !this.references[this.references.length - 1]?.length) return;
        this.references.push('');
    }


    public deleteReference(index: number) {

        this.references.splice(index, 1);
    }
}
