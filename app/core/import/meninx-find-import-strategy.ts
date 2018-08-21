import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';
import {M} from '../../m';
import {IdaiFieldFindResult} from '../datastore/core/cached-read-datastore';
import {clone} from '../../util/object-util';


const removeEmptyStrings = (obj: any) => { Object.keys(obj).forEach((prop) => {
   if (obj[prop] === "") { delete obj[prop] }
    }); return obj; };


/**
 * @author Daniel de Oliveira
 * @author Juliane Watson
 */
export class MeninxFindImportStrategy implements ImportStrategy {


    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string) { }


    /**
     * @throws errorWithParams
     */
    public async importDoc(importDoc: NewDocument): Promise<Document> {

        const existingDoc: Document|undefined = await this.getExistingDoc(importDoc.resource.identifier);

        const updateDoc: NewDocument|Document = existingDoc
            ? MeninxFindImportStrategy.mergeInto(existingDoc, importDoc)
            : importDoc;

        MeninxFindImportStrategy.checkTypeOfSherd(importDoc.resource.sherdTypeCheck, updateDoc.resource, importDoc.resource.amount);
        delete updateDoc.resource.amount;
        delete updateDoc.resource.sherdTypeCheck;

        updateDoc.resource = removeEmptyStrings(updateDoc.resource);
        updateDoc.resource.relations['isRecordedIn'] =
            [await this.getIsRecordedInId(importDoc.resource.identifier[0] + '000')];
        updateDoc.resource.relations['liesWithin'] =
            [await this.getLiesWithinId(importDoc.resource.relations['liesWithin'][0])];

        console.log(existingDoc ? 'update' : 'create', updateDoc);

        return existingDoc
            ? await this.datastore.update(updateDoc as Document, this.username)
            : await this.datastore.create(updateDoc, this.username);
    }


    private async getExistingDoc(resourceIdentifier: string) {

        let importDocExistenceFindResult: IdaiFieldFindResult<Document>;
        try {
            importDocExistenceFindResult = await this.datastore.find(
                { constraints: { "identifier:match": resourceIdentifier } });
        } catch (err) { throw "no find result obtained" }
        if (importDocExistenceFindResult.documents.length > 1) throw ["More than one doc found for identifier ", resourceIdentifier];

        return importDocExistenceFindResult.documents.length === 1
            ? importDocExistenceFindResult.documents[0]
            : undefined;
    }


    private async getIsRecordedInId(trenchIdentifier: string) {

        try {
            const trench = await this.datastore.find({
                constraints: { "identifier:match": trenchIdentifier},
                types: ['Trench']});
            return trench.documents[0].resource.id;
        } catch (err) {
            throw [M.IMPORT_FAILURE_NO_OPERATION_ASSIGNABLE, trenchIdentifier];
        }
    }


    private async getLiesWithinId(liesWithinIdentifier: string) {

        let liesWithinTargetFindResult: IdaiFieldFindResult<Document>;
        try {
            liesWithinTargetFindResult = await this.datastore.find({
                constraints: { "identifier:match": liesWithinIdentifier},
                types: ["Feature", "DrillCoreLayer", "Floor", "Grave", "Layer", "Other", "Architecture", "SurveyUnit", "Planum", "Room", "Burial"]});
        } catch (err) {
            throw [M.IMPORT_FAILURE_NO_FEATURE_ASSIGNABLE, liesWithinIdentifier];
        }

        if (liesWithinTargetFindResult.documents.length > 1) {
            console.error("cannot get liesWithinId for identifier", liesWithinIdentifier);
            throw [M.IMPORT_FAILURE_NO_FEATURE_ASSIGNABLE, "More than one SU found for identifier " +
                liesWithinTargetFindResult.documents.map(_ => _.resource.identifier).join(' -- ')];
        }

        return liesWithinTargetFindResult.documents[0].resource.id;
    }


    private static mergeInto(mergeTarget: Document|NewDocument, mergeSource: NewDocument) {

        const mergedDoc = clone(mergeTarget);

        if (mergeSource.resource.shortDescription.length > 0) mergedDoc.resource.shortDescription = mergeSource.resource.shortDescription;
        if (mergeSource.resource.hasVesselFormPottery.length > 0) mergedDoc.resource.hasVesselFormPottery = mergeSource.resource.hasVesselFormPottery;
        if (mergeSource.resource.hasTypeNumber.length > 0) mergedDoc.resource.hasTypeNumber = mergeSource.resource.hasTypeNumber;
        if (mergeSource.resource.type.length > 0) mergedDoc.resource.type = mergeSource.resource.type;
        if (mergeSource.resource.hasDecorationTechniquePottery.length > 0) mergedDoc.resource.hasDecorationTechniquePottery = mergeSource.resource.hasDecorationTechniquePottery;
        if (mergeSource.resource.hasComment.length > 0) mergedDoc.resource.hasComment = mergeSource.resource.hasComment;
        if (mergeSource.resource.hasProvinience.length > 0) mergedDoc.resource.hasProvinience = mergeSource.resource.hasProvinience;

        return mergedDoc;
    }


    private static checkTypeOfSherd(typeSherd:any, obj: any, amount: number) {
        if (typeSherd === "B") {
            obj.hasAmountSherdsRimShoulder = amount;
        } else if (typeSherd === "C"){
            obj.hasAmountSherdsRimBase = amount;
        } else if (typeSherd === "P"){
            obj.hasAmountRimSherds = amount;
        } else if (typeSherd === "F"){
            obj.hasAmountSherdsBase = amount;
        } else if (typeSherd === "A"){
            obj.hasAmountSherdsHandles = amount;
        } };
}
