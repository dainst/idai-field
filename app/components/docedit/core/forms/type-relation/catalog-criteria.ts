import {I18n} from '@ngx-translate/i18n-polyfill';
import {Injectable} from '@angular/core';


@Injectable()
export class CatalogCriteria {

    public catalogCriteria: Array<CatalogCriterion> = [
        { value: 'material', label: this.i18n({id: 'typeCatalog.criterion.material', value: 'Material' }) }
    ];

    constructor(private i18n: I18n) {}
}


export interface CatalogCriterion {

    value: string,
    label: string
}


export module CatalogCriterion {

    export const VALUE = 'value';
}