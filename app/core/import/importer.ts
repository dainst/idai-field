import {includedIn, is, isNot, isnt, on} from 'tsfun';
import {Document} from 'idai-components-2';
import {UsernameProvider} from '../settings/username-provider';
import {GeojsonParser} from './parser/geojson-parser';
import {NativeJsonlParser} from './parser/native-jsonl-parser';
import {ShapefileParser} from './parser/shapefile-parser';
import {GazGeojsonParserAddOn} from './parser/gaz-geojson-parser-add-on';
import {ImportValidator} from './exec/process/import-validator';
import {TypeUtility} from '../model/type-utility';
import {DocumentDatastore} from '../datastore/document-datastore';
import {CsvParser} from './parser/csv-parser';
import {DatingUtil} from '../util/dating-util';
import {DimensionUtil} from '../util/dimension-util';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {IdaiType} from '../configuration/model/idai-type';
import {buildImportFunction} from './exec/default-import';


export type ImportFormat = 'native' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'csv';

export type ImportReport = { errors: any[], successfulImports: number };



/**
 * Maintains contraints on how imports are validly composed
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export module Importer {

    /**
     * The importer uses the reader and parser, to get documents, which
     * are updated in the datastore if everything is ok.
     *
     * Returns a promise which resolves to an importReport object with detailed information about the import,
     * containing the number of resources imported successfully as well as information on errors that occurred,
     * if any.
     *
     * @param format
     * @param typeUtility
     * @param datastore
     * @param usernameProvider
     * @param projectConfiguration
     * @param mainTypeDocumentId
     * @param mergeMode
     * @param permitDeletions
     * @param fileContent
     * @param generateId
     * @param selectedType should be defined in case format === csv
     * @param separator
     *
     * @returns ImportReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export async function doImport(format: ImportFormat,
                                   typeUtility: TypeUtility,
                                   datastore: DocumentDatastore,
                                   usernameProvider: UsernameProvider,
                                   projectConfiguration: ProjectConfiguration,
                                   mainTypeDocumentId: string,
                                   mergeMode: boolean,
                                   permitDeletions: boolean,
                                   fileContent: string,
                                   generateId: () => string,
                                   selectedType?: IdaiType,
                                   separator?: string) {

        const mainTypeDocumentId_ = mergeMode ? '' : mainTypeDocumentId;

        const parse = createParser(format, mainTypeDocumentId_, selectedType, separator);
        const documents: Document[] = [];

        try {
            (await parse(fileContent)).forEach((resultDocument: Document) => documents.push(resultDocument));
        } catch (msgWithParams) {
            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const operationTypeNames = typeUtility.getOverviewTypeNames().filter(isnt('Place'));
        const importValidator =  new ImportValidator(projectConfiguration, datastore, typeUtility);
        const getInverseRelation = (_: string) => projectConfiguration.getInverseRelations(_);

        const { errors, successfulImports } = await performImport(
            documents,
            format,
            importValidator,
            operationTypeNames,
            mainTypeDocumentId_,
            mergeMode,
            permitDeletions,
            getInverseRelation,
            generateId,
            postProcessDocument(projectConfiguration),
            datastore,
            usernameProvider.getUsername());

        return { errors: errors, warnings: [], successfulImports: successfulImports };
    }


    function postProcessDocument(projectConfiguration: ProjectConfiguration) { return (document: Document) => {

        const resource = document.resource;

        for (let field of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry', 'type'])))) {
            const fieldDefinition = projectConfiguration.getFieldDefinitions(resource.type).find(on('name', is(field)));

            // This could be and -End suffixed field of a dropdownRange input
            // However, all the necessary validation validation is assumed to have taken place already
            if (!fieldDefinition) continue;

            if (fieldDefinition.inputType === 'dating') {

                for (let dating of resource[field]) DatingUtil.setNormalizedYears(dating);
            }
            if (fieldDefinition.inputType === 'dimension') {

                for (let dimension of resource[field]) DimensionUtil.addNormalizedValues(dimension);
            }
        }
        return document;
    }}


    function createParser(format: ImportFormat, operationId: string, selectedType?: IdaiType, separator?: string): any {

        switch (format) {
            case 'csv':
                if (!selectedType) throw 'Selected type must be set for csv import';
                if (!separator) throw 'Separator must be set for csv import';
                return CsvParser.getParse(selectedType, operationId, separator);
            case 'geojson-gazetteer':
                return GeojsonParser.getParse(
                    GazGeojsonParserAddOn.preValidateAndTransformFeature,
                    GazGeojsonParserAddOn.postProcess);
            case 'geojson':
                return GeojsonParser.getParse(undefined, undefined);
            case 'shapefile':
                return ShapefileParser.parse;
            case 'native':
                return NativeJsonlParser.parse;
        }
    }


    function performImport(documents: Array<Document>,
                           format: ImportFormat,
                           validator: ImportValidator,
                           operationTypeNames: string[],
                           mainTypeDocumentId: string,
                           mergeMode: boolean,
                           permitDeletions: boolean,
                           getInverseRelation: (_: string) => string|undefined,
                           generateId: () => string,
                           postProcessDocument: (document: Document) => Document,
                           datastore: DocumentDatastore,
                           username: string): Promise<{ errors: string[][], successfulImports: number }> {

        let importFunction = undefined;

        switch (format) {
            case 'geojson-gazetteer':
                importFunction =  buildImportFunction(validator, operationTypeNames, getInverseRelation, generateId, postProcessDocument,
                    { mergeMode: false, permitDeletions: false});
            case 'shapefile':
            case 'geojson':
                importFunction = buildImportFunction(validator, operationTypeNames, getInverseRelation, generateId, postProcessDocument,
                    { mergeMode: true, permitDeletions: false});
            default: // native | csv
                importFunction = buildImportFunction(validator, operationTypeNames, getInverseRelation, generateId, postProcessDocument,
                    { mergeMode: mergeMode, permitDeletions: permitDeletions,
                        mainTypeDocumentId: mainTypeDocumentId, useIdentifiersInRelations: true});
        }

        return importFunction(documents, datastore, username);
    }
}