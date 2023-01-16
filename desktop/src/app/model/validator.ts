import { isnt, on } from 'tsfun';
import { Datastore, Relation, Query, Named, Document, NewDocument, ProjectConfiguration } from 'idai-field-core';
import { ValidationErrors } from './validation-errors';
import { Validations } from './validations';
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;


/**
 * Validates against data model of ProjectConfiguration and ProjectCategories and contents of Database
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(protected projectConfiguration: ProjectConfiguration,
                protected find: (query: Query) => Promise<Datastore.FindResult>) {}


    /**
     * @throws [IDENTIFIER_ALREADY_EXISTS]
     */
    public async assertIdentifierIsUnique(document: Document|NewDocument): Promise<void> {

        if (!document.resource.identifier) return;

        let result;

        try {
            result = await this.find({
                constraints: { 'identifier:match': document.resource.identifier }
            });
        } catch (e) {
            throw ([ValidationErrors.GENERIC_DATASTORE]);
        }

        if (result.totalCount > 0 && on(['resource', 'id'], isnt(result.documents[0].resource.id))(document)) {
            throw [ValidationErrors.IDENTIFIER_ALREADY_EXISTS, document.resource.identifier];
        }
    }


    /**
     * @throws [NO_ISRECORDEDIN]
     */
    public assertHasIsRecordedIn(document: Document|NewDocument) {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, RECORDED_IN)) {

            throw [ValidationErrors.NO_ISRECORDEDIN];
        }
    }


    public assertGeometryIsValid(document: Document) {

        if (document.resource.geometry) {
            const errWithParam: string[]|null
                = Validations.validateStructureOfGeometries(document.resource.geometry);
            if (errWithParam) throw(errWithParam);
        }
    }


    protected isExpectedToHaveIsRecordedInRelation(document: Document|NewDocument): boolean {

        return this.projectConfiguration
            .getRegularCategories()
            .map(Named.toName)
            .includes(document.resource.category);
    }
}
