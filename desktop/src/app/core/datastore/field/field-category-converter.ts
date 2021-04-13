import { Injectable } from '@angular/core';
import { takeOrMake, CategoryConverter, Document } from 'idai-field-core';
import { ProjectCategories } from '../../configuration/project-categories';
import { ProjectConfiguration } from '../../configuration/project-configuration';
import { Migrator } from './migrator';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class FieldCategoryConverter extends CategoryConverter<Document> {

    constructor(private projectConfiguration: ProjectConfiguration) {

        super();
    }


    public getCategoriesForClass(categoryClass: string): string[]|undefined {


        if (categoryClass === 'ImageDocument') {
            return ProjectCategories.getImageCategoryNames(this.projectConfiguration.getCategoryTreelist());
        } else if (categoryClass === 'FeatureDocument') {
            return ProjectCategories.getFeatureCategoryNames(this.projectConfiguration.getCategoryTreelist());
        } else if (categoryClass === 'FieldDocument') {
            return ProjectCategories.getFieldCategoryNames(this.projectConfiguration.getCategoryTreelist());
        } else {
            return undefined;
        }
    }


    public convert<T extends Document>(document: Document): T {

        const convertedDocument: T = Migrator.migrate(document) as T;

        if (this.projectConfiguration.isSubcategory(convertedDocument.resource.category, 'Image')) {
            takeOrMake(convertedDocument, ['resource','identifier'], '');
            takeOrMake(convertedDocument, ['resource','relations','depicts'], []);
        } else {
            takeOrMake(convertedDocument, ['resource','identifier'],'');
            takeOrMake(convertedDocument, ['resource','relations','isRecordedIn'], []);
        }

        return convertedDocument;
    }
}
