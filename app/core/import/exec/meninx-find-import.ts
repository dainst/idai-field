import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Document} from 'idai-components-2/src/model/core/document';
import {IdaiFieldFindResult} from '../../datastore/core/cached-read-datastore';
import {ImportErrors} from './import-errors';
import {clone} from '../../util/object-util';
import {ImportFunction} from './import-function';
import {isNot, undefinedOrEmpty} from 'tsfun';


const removeEmptyStrings = (obj: any) => { Object.keys(obj).forEach((prop) => {
    if (obj[prop] === '') { delete obj[prop] }
}); return obj; };


/**
 * @author Daniel de Oliveira
 * @author Juliane Watson
 */
export module MeninxFindImport {


    export function build(): ImportFunction {

        return async function importFunction(documents: Array<Document>,
                                             datastore: DocumentDatastore,
                                             username: string): Promise<{ errors: string[][], successfulImports: number }> {

            let successfulImports = 0;
            for (let docToUpdate of documents) {

                try {
                    const importedDoc = await MeninxFindImport.importDoc(docToUpdate, datastore, username);
                    if (importedDoc) successfulImports += 1;

                } catch (msgWithParams) {

                    return { errors: [msgWithParams], successfulImports: successfulImports };
                }
            }

            return { errors: [], successfulImports: successfulImports };
        }
    }

    /**
     * @throws errorWithParams
     */
    export async function importDoc(importDoc: NewDocument,
            datastore: DocumentDatastore,
            username: string): Promise<Document> {

        const existingDoc: Document|undefined = await getExistingDoc(importDoc.resource.identifier, datastore);

        const updateDoc: NewDocument|Document = existingDoc
            ? mergeInto(existingDoc, importDoc)
            : importDoc;

        checkTypeOfSherd(importDoc.resource.sherdTypeCheck, updateDoc.resource, importDoc.resource.amount);
        delete updateDoc.resource.amount;
        delete updateDoc.resource.sherdTypeCheck;

        updateDoc.resource = removeEmptyStrings(updateDoc.resource);
        updateDoc.resource.relations['isRecordedIn'] =
            [await getIsRecordedInId(importDoc.resource.identifier[0] + '000', datastore)];
        updateDoc.resource.relations['liesWithin'] =
            [await getLiesWithinId(importDoc.resource.relations['liesWithin'][0], datastore)];

        console.log(existingDoc ? 'update' : 'create', updateDoc);

        return existingDoc
            ? await datastore.update(updateDoc as Document, username)
            : await datastore.create(updateDoc, username);
    }


    async function getExistingDoc(resourceIdentifier: string, datastore: DocumentDatastore) {

        let importDocExistenceFindResult: IdaiFieldFindResult<Document>;
        try {
            importDocExistenceFindResult = await datastore.find(
                { constraints: { 'identifier:match': resourceIdentifier } });
        } catch (err) { throw 'no find result obtained' }
        if (importDocExistenceFindResult.documents.length > 1) throw ['More than one doc found for identifier ', resourceIdentifier];

        return importDocExistenceFindResult.documents.length === 1
            ? importDocExistenceFindResult.documents[0]
            : undefined;
    }


    async function getIsRecordedInId(trenchIdentifier: string, datastore: DocumentDatastore) {

        try {
            const trench = await datastore.find({
                constraints: { 'identifier:match': trenchIdentifier},
                types: ['Trench']});
            return trench.documents[0].resource.id;
        } catch (err) {
            throw [ImportErrors.MENINX_NO_OPERATION_ASSIGNABLE, trenchIdentifier];
        }
    }


    async function getLiesWithinId(liesWithinIdentifier: string, datastore: DocumentDatastore) {

        let liesWithinTargetFindResult: IdaiFieldFindResult<Document>;
        try {
            liesWithinTargetFindResult = await datastore.find({
                constraints: { 'identifier:match': liesWithinIdentifier},
                types: [
                    'Feature',
                    'DrillCoreLayer',
                    'Floor',
                    'Grave',
                    'Layer',
                    'Other',
                    'Architecture',
                    'SurveyUnit',
                    'Planum',
                    'Room',
                    'Burial']});
        } catch (err) {
            throw [ImportErrors.MENINX_FIND_NO_FEATURE_ASSIGNABLE, liesWithinIdentifier];
        }

        if (liesWithinTargetFindResult.documents.length > 1) {
            console.error('cannot get liesWithinId for identifier', liesWithinIdentifier);
            throw [ImportErrors.MENINX_FIND_NO_FEATURE_ASSIGNABLE, 'More than one SU found for identifier ' +
            liesWithinTargetFindResult.documents.map(_ => _.resource.identifier).join(' -- ')];
        }

        if (liesWithinTargetFindResult.documents.length === 0) {
            throw [ImportErrors.MENINX_FIND_NO_FEATURE_ASSIGNABLE, 'No target SU found for identifier ' + liesWithinIdentifier];
        }

        return liesWithinTargetFindResult.documents[0].resource.id;
    }


    function mergeInto(mergeTarget: Document|NewDocument, mergeSource: NewDocument) {

        const mergedDoc = clone(mergeTarget);

        if (isNot(undefinedOrEmpty)(mergeSource.resource.shortDescription)) mergedDoc.resource.shortDescription = mergeSource.resource.shortDescription;
        if (isNot(undefinedOrEmpty)(mergeSource.resource.vesselForm)) mergedDoc.resource.vesselForm = mergeSource.resource.vesselForm;
        if (isNot(undefinedOrEmpty)(mergeSource.resource.typeNumber)) mergedDoc.resource.typeNumber = mergeSource.resource.typeNumber;
        if (isNot(undefinedOrEmpty)(mergeSource.resource.type)) mergedDoc.resource.type = mergeSource.resource.type;
        if (isNot(undefinedOrEmpty)(mergeSource.resource.decorationTechnique)) mergedDoc.resource.decorationTechnique = mergeSource.resource.decorationTechnique;
        if (isNot(undefinedOrEmpty)(mergeSource.resource.comment)) mergedDoc.resource.comment = mergeSource.resource.comment;
        if (isNot(undefinedOrEmpty)(mergeSource.resource.provenance)) mergedDoc.resource.provenance = mergeSource.resource.provenance;

        return mergedDoc;
    }


    function checkTypeOfSherd(typeSherd: any, obj: any, amount: number) {

        if (typeSherd === 'B') {
            obj.amountSherdsRim = amount;
        } else if (typeSherd === 'C') {
            obj.amountSherdsRimBase = amount;
        } else if (typeSherd === 'P') {
            obj.amountSherdsWall = amount;
        } else if (typeSherd === 'F') {
            obj.amountSherdsBase = amount;
        } else if (typeSherd === 'A') {
            obj.amountSherdsHandles = amount;
        }
    }
}