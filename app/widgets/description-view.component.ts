import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


@Component({
    selector: 'description-view',
    moduleId: module.id,
    templateUrl: './description-view.html'
})

/**
 * @author Jan G. Wieners
 */
export class DescriptionViewComponent {

    @Input() document: IdaiFieldDocument;
}