import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {TypeUtility} from './type-utility';
import {ValidationErrors} from './validation-errors';
import {M} from '../../components/m';
import {ImportErrors} from '../import/import-errors';


@Injectable()
/**
 * Validates against data model of ProjectConfiguration and TypeUtility and contents of Database
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: IdaiFieldDocumentDatastore,
                private typeUtility: TypeUtility) {}

    // TODO what about this leftover? @throws [PREVALIDATION_INVALID_TYPE] if type is not configured in projectConfiguration


    /**
     * @throws [NO_ISRECORDEDIN_TARGET]
     */
    public async assertIsRecordedInTargetsExist(document: Document|NewDocument): Promise<void> {

        if (document.resource.relations['isRecordedIn'] && document.resource.relations['isRecordedIn'].length > 0) {
            const invalidRelationTargets = await this.validateRelationTargets(document as Document, 'isRecordedIn');
            if (invalidRelationTargets) {
                throw [
                    ValidationErrors.NO_ISRECORDEDIN_TARGET,
                    invalidRelationTargets.join(', ')
                ];
            }
        }
    }


    /**
     * @throws [IDENTIFIER_ALREADY_EXISTS]
     */
    public async assertIdentifierIsUnique(document: Document|NewDocument): Promise<void> {

        let result;

        try {
            result = await this.datastore.find({
                constraints: { 'identifier:match': document.resource.identifier }
            });
        } catch (e) {
            throw ([M.ALL_ERROR_FIND]);
        }

        if (result.totalCount > 0 && Validator.isNotSameDocument(result.documents[0], document)) {
            throw[ValidationErrors.IDENTIFIER_ALREADY_EXISTS, document.resource.identifier];
        }
    }


    async isExistingRelationTarget(targetId: string): Promise<boolean> {

        return (await this.datastore.find({ constraints: { 'id:match': targetId } })).documents.length === 1;
    }


    public async assertIsNotOverviewType(document: Document|NewDocument) {

        if (this.typeUtility.getOverviewTypeNames().includes(document.resource.type)) {

            throw [ImportErrors.OPERATIONS_NOT_ALLOWED];
        }
    }


    /**
     * @throws [NO_ISRECORDEDIN]
     */
    public assertHasIsRecordedIn(document: Document|NewDocument): void {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, 'isRecordedIn')) {

            throw [ValidationErrors.NO_ISRECORDEDIN];
        }
    }


    private isExpectedToHaveIsRecordedInRelation(document: Document|NewDocument): boolean {

        return !this.typeUtility
            ? false
            : this.typeUtility
                .getRegularTypeNames()
                .includes(document.resource.type);
    }


    private async validateRelationTargets(document: Document,
                                          relationName: string): Promise<string[]|undefined> {

        if (!Document.hasRelations(document, relationName)) return [];

        const invalidRelationTargetIds: string[] = [];

        for (let targetId of document.resource.relations[relationName]) {
            if (!(await this.isExistingRelationTarget(targetId))) invalidRelationTargetIds.push(targetId);
        }

        return invalidRelationTargetIds.length > 0 ? invalidRelationTargetIds : undefined;
    }


    private static isNotSameDocument(result: any, doc: any) {

        return result.resource.id !== doc.resource.id;
    }
}