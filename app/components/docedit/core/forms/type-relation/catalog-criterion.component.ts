import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2/index';
import {CatalogCriteria} from './catalog-criteria';


@Component({
    moduleId: module.id,
    selector: 'dai-catalog-criterion',
    templateUrl: './catalog-criterion.html'
})
/**
 * @author Daniel de Oliveira
 */
export class CatalogCriterionComponent implements OnChanges {

    @Input() resource: Resource;

    public criteria: any = undefined;


    constructor(catalogCriteria: CatalogCriteria) {

        this.criteria = catalogCriteria.catalogCriteria;

    }


    ngOnChanges() {

        if (this.resource && !this.resource['criterion']) this.resource['criterion'] = '';
    }
}