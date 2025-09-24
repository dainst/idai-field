import { isEmpty } from 'tsfun';
import { Component, Input } from '@angular/core';
import { SemanticReference, Predicate } from 'idai-field-core';


@Component({
    selector: 'semantic-references-input',
    templateUrl: './semantic-references-input.html',
    standalone: false
})
/**
* @author Thomas Kleinke
 */
export class SemanticReferencesInputComponent {

    @Input() references: Array<SemanticReference>;


    public getAvailablePredicates = () => Predicate.ALL;


    public getTrackingIndex = (index, _) => index;


    public addReference() {

        if (this.references.length > 0 && isEmpty(this.references[this.references.length - 1]?.uri)) return;
        this.references.push({ predicate: 'skos:exactMatch', uri: '' });
    }


    public deleteReference(index: number) {

        this.references.splice(index, 1);
    }
}
