import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    selector: 'dai-text',
    template: `<textarea [(ngModel)]="resource[fieldName]" class="form-control"></textarea>`
})

/**
 * @author Fabian Z.
 */
export class TextComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;
}