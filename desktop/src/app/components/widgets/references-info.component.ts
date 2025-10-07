import { Component, Input } from '@angular/core';
import { SemanticReference } from 'idai-field-core';


@Component({
    selector: 'references-info',
    templateUrl: './references-info.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ReferencesInfoComponent {

    @Input() references: string[];
    @Input() semanticReferences: Array<SemanticReference>;
    @Input() context: 'editor'|'configuration' = 'editor';

    constructor() {}
}
