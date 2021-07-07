import { Component, Input } from '@angular/core';
import { Category } from 'idai-field-core';


@Component({
    selector: 'category-listing',
    templateUrl: './category-listing.html'
})
/**
 * @author Daniel de Oliveira
 */
export class CategoryListingComponent {

    @Input() category: Category;
}
