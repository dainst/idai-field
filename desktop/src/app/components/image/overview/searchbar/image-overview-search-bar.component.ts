import { Component } from '@angular/core';
import { SearchBarComponent } from '../../../widgets/search-bar.component';


@Component({
    selector: 'image-overview-search-bar',
    templateUrl: './image-overview-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ImageOverviewSearchBarComponent extends SearchBarComponent {

    public getSelectedCategory(): string|undefined {

        return this.isCategorySelected()
            ? this.selectedCategories[0]
            : undefined;
    }


    public isCategorySelected(): boolean {

        return this.selectedCategories?.length > 0;
    }
}
