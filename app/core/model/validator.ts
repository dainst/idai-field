import {isnt, on, subtract} from 'tsfun';
import {Document, FindResult, NewDocument, ProjectConfiguration, Query} from 'idai-components-2';
import {TypeUtility} from './type-utility';
import {ValidationErrors} from './validation-errors';
import {Validations} from './validations';
import {ImportErrors} from '../import/exec/import-errors';


const RECORDED_IN = 'isRecordedIn';

/**
 * Validates against data model of ProjectConfiguration and TypeUtility and contents of Database
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Validator {

    constructor(protected projectConfiguration: ProjectConfiguration,
                protected find: (query: Query) => Promise<FindResult>,
                protected typeUtility: TypeUtility) {}


    /**
     * @throws [NO_ISRECORDEDIN_TARGET]
     */
    public async assertIsRecordedInTargetsExist(document: Document|NewDocument): Promise<void> {

        if (document.resource.relations[RECORDED_IN] && document.resource.relations[RECORDED_IN].length > 0) {
            const invalidRelationTargets = await this.validateRelationTargets(document as Document, RECORDED_IN);
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

        if (!document.resource.identifier) return;

        let result;

        try {
            result = await this.find({
                constraints: { 'identifier:match': document.resource.identifier }
            });
        } catch (e) {
            throw ([ValidationErrors.GENERIC_DATASTORE]);
        }

        if (result.totalCount > 0 && on('resource.id', isnt(result.documents[0].resource.id))(document)) {
            throw[ValidationErrors.IDENTIFIER_ALREADY_EXISTS, document.resource.identifier];
        }
    }


    async isExistingRelationTarget(targetId: string): Promise<boolean> {

        return (await this.find({ constraints: { 'id:match': targetId } })).documents.length === 1;
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


    // 2.13.2
    public async assertNotIllegalTopLevel(documents: Array<Document>) {

        for (let document of documents) {

            if (['Inscription', 'RoomCeiling', 'RoomFloor', 'RoomWall'].includes(document.resource.type)) {

                const recordedIn = document.resource.relations['isRecordedIn'];
                const liesWithin = document.resource.relations['liesWithin'];

                if (recordedIn && recordedIn.length > 0 && (!liesWithin || liesWithin.length === 0)) {

                    throw [ValidationErrors.MUST_HAVE_LIES_WITHIN, document.resource.type, document.resource.identifier];
                }

                const found = (await this.find({constraints: {'id:match': liesWithin[0]}})).documents;
                if (found && found.length > 0) {
                    const foundDoc = found[0] as Document;
                    if (foundDoc.resource && foundDoc.resource.type) {
                        if (document.resource.type === 'Inscription') {
                            if (foundDoc.resource.type !== 'Find') throw [ImportErrors.BAD_INTERRELATION, document.resource.identifier];
                        }
                        if (document.resource.type.indexOf('Room') !== -1) {
                            if (foundDoc.resource.type !== 'Room') throw [ImportErrors.BAD_INTERRELATION, document.resource.identifier];
                        }
                    }
                }
            }
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

        return this.typeUtility
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
}