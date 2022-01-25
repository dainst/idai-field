import { isEmpty } from 'tsfun';
import { Component, Input } from '@angular/core';


@Component({
    selector: 'references-input',
    templateUrl: './references-input.html'
})
/**
* @author Thomas Kleinke
 */
export class ReferencesInputComponent {

    @Input() references: string[];


    public addReference() {

        if (this.references.length > 0 && isEmpty(this.references[this.references.length - 1])) return;
        this.references.push('');
    }


    public updateReference(index: number, event: any) {

        this.references[index] = event.srcElement.value;
    }


    public deleteReference(index: number) {

        this.references.splice(index, 1);
    }
}
