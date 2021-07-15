import {ProjectConfiguration} from '../configuration';
import { Document } from '../model/document';
import { Relations } from '../model/relations';
import { Resource } from '../model/resource';
import {  Tree } from '../tools/forest';
import { InPlace } from '../tools/in-place';
import {Named} from '../tools/named';
import { Migrator } from './migrator';


export class CategoryConverter {

    constructor(private projectConfiguration: ProjectConfiguration) { }


    public convert(document: Document): Document {

        const convertedDocument = Migrator.migrate(document);

        InPlace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.IDENTIFIER], '');

        // TODO review after 2.19 released
        if (Tree.flatten(this.projectConfiguration.getCategoryForest()).length > 0) {

            if (this.projectConfiguration.getImageCategories().map(Named.toName)
                .includes(convertedDocument.resource.category)) {
                    InPlace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Image.DEPICTS], []);
                } else {
                    InPlace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Hierarchy.RECORDEDIN], []);

                    if (this.projectConfiguration.getFeatureCategories().map(Named.toName)
                        .includes(convertedDocument.resource.category)) {
                            InPlace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.AFTER], []);
                            InPlace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.BEFORE], []);
                            InPlace.takeOrMake(convertedDocument, [Document.RESOURCE, Resource.RELATIONS, Relations.Time.CONTEMPORARY], []);
                        }
                }
        }

        return convertedDocument;
    }
}
