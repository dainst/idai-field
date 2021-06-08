import { ProjectCategories } from '../configuration/project-categories';
import { Category } from '../model';
import { Document } from '../model/document';
import { Relations } from '../model/relations';
import { Resource } from '../model/resource';
import { Forest } from '../tools/forest';
import { Inplace } from '../tools/inplace';
import { Migrator } from './migrator';


export class CategoryConverter {

    constructor(private categories: Forest<Category>) { }


    public convert(document: Document): Document {

        const convertedDocument = Migrator.migrate(document);

        Inplace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.IDENTIFIER], '');

        // TODO review after 2.19 released
        if (this.categories) {

            if (ProjectCategories.getImageCategoryNames(this.categories)
                .includes(convertedDocument.resource.category)) {
                    Inplace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Image.DEPICTS], []);
                } else {
                    Inplace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Hierarchy.RECORDEDIN], []);

                    if (ProjectCategories.getFeatureCategoryNames(this.categories)
                        .includes(convertedDocument.resource.category)) {
                            Inplace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.AFTER], []);
                            Inplace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.BEFORE], []);
                            Inplace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.CONTEMPORARY], []);
                        }
                }
        }

        return convertedDocument;
    }
}
