import { Relation } from '../model/configuration/relation';
import { Document } from '../model/document';
import { Resource } from '../model/resource';
import { ProjectConfiguration } from '../services/project-configuration';
import { Tree } from '../tools/forest';
import { InPlace } from '../tools/in-place';
import { Named } from '../tools/named';
import { Migrator } from './migrator';


export class DocumentConverter {

    constructor(private projectConfiguration: ProjectConfiguration) { }


    public convert(document: Document): Document {

        Migrator.migrate(document, this.projectConfiguration);

        InPlace.takeOrMake(document, [Document.RESOURCE, Resource.IDENTIFIER], '');

        // TODO review after 2.19 released
        if (Tree.flatten(this.projectConfiguration.getCategories()).length > 0) {

            if (this.projectConfiguration.getImageCategories().map(Named.toName)
                .includes(document.resource.category)) {
                    InPlace.takeOrMake(document, [Document.RESOURCE, Resource.RELATIONS, Relation.Image.DEPICTS], []);
                } else {
                    InPlace.takeOrMake(document, [Document.RESOURCE, Resource.RELATIONS, Relation.Hierarchy.RECORDEDIN], []);

                    if (this.projectConfiguration.getFeatureCategories().map(Named.toName)
                        .includes(document.resource.category)) {
                            InPlace.takeOrMake(document, [Document.RESOURCE, Resource.RELATIONS, Relation.Time.AFTER], []);
                            InPlace.takeOrMake(document, [Document.RESOURCE, Resource.RELATIONS, Relation.Time.BEFORE], []);
                            InPlace.takeOrMake(document, [Document.RESOURCE, Resource.RELATIONS, Relation.Time.CONTEMPORARY], []);
                        }
                }
        }

        return document;
    }
}
