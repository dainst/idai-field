import {includedIn, is, isNot, isnt, on, jsonClone} from 'tsfun';
import {Document} from 'idai-components-2';
import {UsernameProvider} from '../settings/username-provider';
import {MeninxFindCsvParser} from './parser/meninx-find-csv-parser';
import {IdigCsvParser} from './parser/idig-csv-parser';
import {GeojsonParser} from './parser/geojson-parser';
import {NativeJsonlParser} from './parser/native-jsonl-parser';
import {ShapefileParser} from './parser/shapefile-parser';
import {GazGeojsonParserAddOn} from './parser/gaz-geojson-parser-add-on';
import {ImportValidator} from './exec/process/import-validator';
import {MeninxFindImport} from './exec/meninx-find-import';
import {TypeUtility} from '../model/type-utility';
import {ImportFunction} from './exec/types';
import {DocumentDatastore} from '../datastore/document-datastore';
import {CsvParser} from './parser/csv-parser';
import {DatingUtil} from '../util/dating-util';
import {DimensionUtil} from '../util/dimension-util';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {IdaiType} from '../configuration/model/idai-type';
import {buildImportFunction} from './exec/default-import';


export type ImportFormat = 'native' | 'idig' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'meninxfind' | 'csv';

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
     * @param allowMergingExistingResources
     * @param allowUpdatingRelationsOnMerge
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
                                   allowMergingExistingResources: boolean,
                                   allowUpdatingRelationsOnMerge: boolean,
                                   fileContent: string,
                                   generateId: () => string,
                                   selectedType?: IdaiType,
                                   separator?: string) {

        const mainTypeDocumentId_ = allowMergingExistingResources ? '' : mainTypeDocumentId;

        const parse = createParser(format, mainTypeDocumentId_, selectedType, separator);
        const docsToUpdate: Document[] = [];

        try {
            (await parse(fileContent)).forEach((resultDocument: Document) => docsToUpdate.push(resultDocument));
        } catch (msgWithParams) {
            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const operationTypeNames = typeUtility.getOverviewTypeNames().filter(isnt('Place'));
        const importValidator =  new ImportValidator(projectConfiguration, datastore, typeUtility);
        const getInverseRelation = (_: string) => projectConfiguration.getInverseRelations(_);

        const importFunction = buildImportFunction_(
            format,
            importValidator,
            operationTypeNames,
            mainTypeDocumentId_,
            allowMergingExistingResources,
            allowUpdatingRelationsOnMerge,
            getInverseRelation,
            generateId,
            postProcessDocument(projectConfiguration));

        const { errors, successfulImports } = await importFunction(
            docsToUpdate, datastore, usernameProvider.getUsername()
        );
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


    function createParser(format: ImportFormat, operationId: string, selectedType?: IdaiType,
                          separator?: string): any {

        switch (format) {
            case 'meninxfind':
                return MeninxFindCsvParser.parse;
            case 'idig':
                return IdigCsvParser.parse;
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


    function buildImportFunction_(format: ImportFormat,
                                  validator: ImportValidator,
                                  operationTypeNames: string[],
                                  mainTypeDocumentId: string,
                                  mergeMode: boolean,
                                  updateRelationsOnMergeMode: boolean,
                                  getInverseRelation: (_: string) => string|undefined,
                                  generateId: () => string,
                                  postProcessDocument: (document: Document) => Document): ImportFunction {

        const defaultImport = () => buildImportFunction(validator, operationTypeNames, getInverseRelation, generateId, postProcessDocument);

        switch (format) {
            case 'meninxfind':
                return MeninxFindImport.build();
            case 'idig':
            case 'geojson-gazetteer':
                return defaultImport()(false, false);
            case 'shapefile':
            case 'geojson':
                return defaultImport()(true, false);
            default: // native | csv
                return defaultImport()(mergeMode, updateRelationsOnMergeMode, mainTypeDocumentId, true);
        }
    }
}