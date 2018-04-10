import {Injectable} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';
import {DotCreation} from './dot-creation';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DotBuilder {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public build(documents: Array<IdaiFieldFeatureDocument>): string {

        const docs = this.takeOutNonExistingRelations(documents);

        return 'digraph {'
            + DotCreation.createNodeDefinitions(this.projectConfiguration, docs)
            + DotCreation.createRootDocumentMinRankDefinition(docs)
            + DotCreation.createIsAfterEdgesDefinitions(docs)
            + DotCreation.createIsContemporaryWithEdgesDefinitions(docs)
            + '}';
    }


    private takeOutNonExistingRelations(documents: IdaiFieldFeatureDocument[]): IdaiFieldFeatureDocument[] {

        const resultDocs: IdaiFieldFeatureDocument[] = JSON.parse(JSON.stringify(documents));

        const resourceIds: string[] = [];
        resultDocs.forEach(_ => resourceIds.push(_.resource.id));

        resultDocs.forEach(doc => {

            doc.resource.relations.isAfter = doc.resource.relations.isAfter.filter(target => resourceIds.includes(target));
            doc.resource.relations.isBefore = doc.resource.relations.isBefore.filter(target => resourceIds.includes(target));
            doc.resource.relations.isContemporaryWith = doc.resource.relations.isContemporaryWith.filter(target => resourceIds.includes(target));
        });
        return resultDocs;
    }
}