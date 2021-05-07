import { ProjectCategories } from '../configuration/project-categories';
import { Category } from '../model';
import { Document } from '../model/document';
import { Relations } from '../model/relations';
import { Resource } from '../model/resource';
import { Forest } from '../tools/forest';
import { takeOrMake } from '../tools/utils';
import { Migrator } from './migrator';


export class CategoryConverter {

    constructor(private categories: Forest<Category>) { }


    public convert(document: Document): Document {

        const convertedDocument = Migrator.migrate(document);

        takeOrMake(convertedDocument, [Document.RESOURCE, Resource.IDENTIFIER], '');

        // TODO review after 2.19 released
        if (this.categories) {

            if (ProjectCategories.getImageCategoryNames(this.categories)
                .includes(convertedDocument.resource.category)) {
                    takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Image.DEPICTS], []);
                } else {
                    takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Hierarchy.RECORDEDIN], []);

                    if (ProjectCategories.getFeatureCategoryNames(this.categories)
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
