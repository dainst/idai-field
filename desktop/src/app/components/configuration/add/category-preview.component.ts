import { Component, Input } from '@angular/core';
import { Category } from 'idai-field-core';


@Component({
    selector: 'category-preview',
    templateUrl: './category-preview.html'
})
/**
 * @author Daniel de Oliveira
 */
export class CategoryPreviewComponent {

    @Input() category: Category|undefined;
}
