import { Injectable } from '@angular/core';
import { isFunction } from 'tsfun';
import { takeOrMake, Converter, Document, Resource, Relations } from 'idai-field-core';
import { ProjectCategories } from '../../configuration/project-categories';
import { ProjectConfiguration } from '../../configuration/project-configuration';
import { Migrator } from './migrator';


@Injectable()
export class FieldConverter extends Converter {

    constructor(private projectConfiguration: ProjectConfiguration) { super(); }


    public convert(document: Document): Document {

        const convertedDocument = Migrator.migrate(document);

        takeOrMake(convertedDocument, [Document.RESOURCE, Resource.IDENTIFIER], '');

        // TODO review after 2.19 released
        if (isFunction(this.projectConfiguration.getCategoryForest)) {

            if (ProjectCategories.getImageCategoryNames(this.projectConfiguration.getCategoryForest())
                .includes(convertedDocument.resource.category)) {
                    takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Image.DEPICTS], []);
                } else {
                    takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Hierarchy.RECORDEDIN], []);

                    if (ProjectCategories.getFeatureCategoryNames(this.projectConfiguration.getCategoryForest())
                        .includes(convertedDocument.resource.category)) {
                            takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.AFTER], []);
                            takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.BEFORE], []);
                            takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.CONTEMPORARY], []);
                        }
                }
        }

        return convertedDocument;
    }
}
