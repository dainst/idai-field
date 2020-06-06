import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2';
import {CategoryConverter} from '../cached/category-converter';
import {ProjectCategoriesUtility} from '../../configuration/project-categories-utility';
import {Migrator} from './migrator';
import {takeOrMake} from '../../util/utils';
import {ProjectConfiguration} from '../../configuration/project-configuration';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class FieldCategoryConverter extends CategoryConverter<Document> {

    constructor(private projectCategories: ProjectCategoriesUtility,
                private projectConfiguration: ProjectConfiguration) {

        super();
    }


    public assertCategoryToBeOfClass(category: string, categoryClass: string): void {

        if (categoryClass === 'ImageDocument') {
            if (!this.projectConfiguration.isSubcategory(category, 'Image')) throw 'Wrong category class: must be ImageDocument';
        } else if (categoryClass === 'FeatureDocument') {
            if (!this.projectConfiguration.isSubcategory(category, 'Feature')) throw 'Wrong category class: must be FeatureDocument';
        } else if (categoryClass === 'FieldDocument') {
            if (this.projectConfiguration.isSubcategory(category, 'Image')) throw 'Wrong category class: must not be ImageDocument';
            // feature documents are allowed to also be field documents
        }
    }


    public getCategoriesForClass(categoryClass: string): string[]|undefined {

        if (categoryClass === 'ImageDocument') {
            return this.projectCategories.getImageCategoryNames();
        } else if (categoryClass === 'FeatureDocument') {
            return this.projectCategories.getFeatureCategoryNames();
        } else if (categoryClass === 'FieldDocument') {
            return this.projectCategories.getFieldCategoryNames();
        } else {
            return undefined;
        }
    }


    public convert<T extends Document>(document: Document): T {

        const convertedDocument: T = Migrator.migrate(document) as T;

        if (this.projectConfiguration.isSubcategory(convertedDocument.resource.category, 'Image')) {
            takeOrMake(convertedDocument, 'resource.identifier','');
            takeOrMake(convertedDocument, 'resource.relations.depicts', []);
        } else {
            takeOrMake(convertedDocument, 'resource.identifier','');
            takeOrMake(convertedDocument, 'resource.relations.isRecordedIn', []);
        }

        return convertedDocument;
    }
}
