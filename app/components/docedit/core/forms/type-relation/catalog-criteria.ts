import {on, is, to, isEmpty} from 'tsfun';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Injectable} from '@angular/core';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class CatalogCriteria {

    public catalogCriteria: Array<CatalogCriterion> = [
        { value: 'material', label: this.i18n({id: 'typeCatalog.criterion.material', value: 'Material' }) }
    ];

    constructor(private i18n: I18n) {}


    public translateCriterion(criterion: string) {

        const result = this.catalogCriteria
            .filter(on(CatalogCriterion.VALUE, is(criterion)))
            .map(to(CatalogCriterion.LABEL));

        if (isEmpty(result)) throw 'illegal argument - criterion not found';
        return result[0];
    }
}


export interface CatalogCriterion {

    value: string,
    label: string
}


export module CatalogCriterion {

    export const VALUE = 'value';
    export const LABEL = 'label';
}