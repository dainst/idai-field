import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2/core';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';
import {M} from '../../m';

/**
 * @author Daniel de Oliveira
 */

export class MeninxFindImportStrategy implements ImportStrategy {


    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string) { }


    /**
     * @throws errorWithParams
     */
    public async importDoc(
        importDoc: NewDocument
    ): Promise<Document> {

        // await this.validator.validate(document as Document); // will throw identifier conflict if document exists

        const trenchIdentifier = '' + importDoc.resource.identifier[0] + '000';
        try {
            const existing = await this.datastore.find({q: trenchIdentifier, types: ['Trench']});
            importDoc.resource.relations['isRecordedIn'] = [existing.documents[0].resource.id];
        } catch (err) {
            throw [M.IMPORT_FAILURE_NO_OPERATION_ASSIGNABLE, trenchIdentifier];
        }

        const liesWithinIdentifier = importDoc.resource.relations['liesWithin'][0];
        try {
            const existing = await this.datastore.find({q: liesWithinIdentifier, types: [
                    "Feature",
                    "DrillCoreLayer",
                    "Floor",
                    "Grave",
                    "Layer",
                    "Other",
                    "Architecture",
                    "SurveyUnit",
                    "Planum",
                    "Room",
                    "Burial"
                ]});

            importDoc.resource.relations['liesWithin'] = [existing.documents[0].resource.id];
        } catch (err) {
            throw [M.IMPORT_FAILURE_NO_FEATURE_ASSIGNABLE, liesWithinIdentifier]; // TODO should we create one then?
        }

        let updateDoc: NewDocument|Document = importDoc;

        let exists = false;

        try {
            const existing = await this.datastore.find({q: importDoc.resource.identifier});

            if (existing.documents.length > 0) {

                exists = true;
                updateDoc = existing.documents[0];

                // merge fields of document into doc
                if (importDoc.resource.shortDescription.length > 0) updateDoc.resource.shortDescription = importDoc.resource.shortDescription;
                if (importDoc.resource.hasVesselFormPottery.length > 0) updateDoc.resource.hasVesselFormPottery = importDoc.resource.hasVesselFormPottery;
                if (importDoc.resource.hasTypeNumber.length > 0) updateDoc.resource.hasTypeNumber = importDoc.resource.hasTypeNumber;
                if (importDoc.resource.type.length > 0) updateDoc.resource.type = importDoc.resource.type;

                if (importDoc.resource.sherdTypeCheck === 'B') updateDoc.resource.hasAmountSherdsRimShoulder = importDoc.resource.amount;
                if (importDoc.resource.sherdTypeCheck === 'C') updateDoc.resource.hasAmountSherdsRimBase = importDoc.resource.amount;
                if (importDoc.resource.sherdTypeCheck === 'P') updateDoc.resource.hasAmountRimSherds = importDoc.resource.amount;
                if (importDoc.resource.sherdTypeCheck === 'F') updateDoc.resource.hasAmountSherdsBase = importDoc.resource.amount;
                if (importDoc.resource.sherdTypeCheck === 'A') updateDoc.resource.hasAmountSherdsHandles = importDoc.resource.amount;;


                if (importDoc.resource.hasDecorationTechniquePottery.length > 0) updateDoc.resource.hasDecorationTechniquePottery = importDoc.resource.hasDecorationTechniquePottery;
                if (importDoc.resource.hasComment.length > 0) updateDoc.resource.hasComment = importDoc.resource.hasComment;
                if (importDoc.resource.hasProvinience.length > 0) updateDoc.resource.hasProvinience = importDoc.resource.hasProvinience;

                updateDoc.resource.relations['liesWithin'] = importDoc.resource.relations['liesWithin'];
                updateDoc.resource.relations['isRecordedIn'] = importDoc.resource.relations['isRecordedIn']

            } else {

            if (importDoc.resource.sherdTypeCheck === 'B') importDoc.resource.hasAmountSherdsRimShoulder = importDoc.resource.amount;
            if (importDoc.resource.sherdTypeCheck === 'C') importDoc.resource.hasAmountSherdsRimBase = importDoc.resource.amount;
            if (importDoc.resource.sherdTypeCheck === 'P') importDoc.resource.hasAmountRimSherds = importDoc.resource.amount;
            if (importDoc.resource.sherdTypeCheck === 'F') importDoc.resource.hasAmountSherdsBase = importDoc.resource.amount;
            if (importDoc.resource.sherdTypeCheck === 'A') importDoc.resource.hasAmountSherdsHandles = importDoc.resource.amount;
            delete importDoc.resource.amount && delete importDoc.resource.sherdTypeCheck;

            if (importDoc.resource.shortDescription === "") delete importDoc.resource.shortDescription;
            if (importDoc.resource.hasVesselFormPottery === "") delete importDoc.resource.hasVesselFormPottery;
            if (importDoc.resource.hasTypeNumber === "") delete importDoc.resource.hasTypeNumber;
            if (importDoc.resource.hasTypeNumber === "") delete importDoc.resource.hasTypeNumber;
            if (importDoc.resource.hasDecorationTechniquePottery === "") delete importDoc.resource.hasDecorationTechniquePottery;
            if (importDoc.resource.hasComment === "") delete importDoc.resource.hasComment;
            if (importDoc.resource.hasProvinience === "") delete importDoc.resource.hasProvinience;

            }
        } catch (err) {}

        console.log("will " + exists ? ' update' : 'create',updateDoc);

        return exists
            ? await this.datastore.update(updateDoc as Document, this.username)
            : await this.datastore.create(updateDoc, this.username);
    }
}
