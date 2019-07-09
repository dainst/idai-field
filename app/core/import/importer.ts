import {Document, ProjectConfiguration, IdaiType} from 'idai-components-2';
import {UsernameProvider} from '../settings/username-provider';
import {MeninxFindCsvParser} from './parser/meninx-find-csv-parser';
import {IdigCsvParser} from './parser/idig-csv-parser';
import {GeojsonParser} from './parser/geojson-parser';
import {NativeJsonlParser} from './parser/native-jsonl-parser';
import {ShapefileParser} from './parser/shapefile-parser';
import {GazGeojsonParserAddOn} from './parser/gaz-geojson-parser-add-on';
import {ImportValidator} from './exec/import-validator';
import {DefaultImport} from './exec/default-import';
import {MeninxFindImport} from './exec/meninx-find-import';
import {TypeUtility} from '../model/type-utility';
import {isnt} from 'tsfun';
import {ImportFunction} from './exec/import-function';
import {DocumentDatastore} from '../datastore/document-datastore';
import {CsvParser} from './parser/csv-parser';


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
                                   selectedType?: IdaiType|undefined) {

        const mainTypeDocumentId_ = allowMergingExistingResources ? '' : mainTypeDocumentId;

        const parse = createParser(format, mainTypeDocumentId_, selectedType);
        const docsToUpdate: Document[] = [];
        try {

            (await parse(fileContent)).forEach((resultDocument: Document) => docsToUpdate.push(resultDocument));

        } catch (msgWithParams) {

            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const operationTypeNames = typeUtility.getOverviewTypeNames().filter(isnt('Place'));
        const importValidator =  new ImportValidator(projectConfiguration, datastore, typeUtility);
        const getInverseRelation = (_: string) => projectConfiguration.getInverseRelations(_);

        const importFunction = buildImportFunction(
            format,
            importValidator,
            operationTypeNames,
            mainTypeDocumentId_,
            allowMergingExistingResources,
            allowUpdatingRelationsOnMerge,
            getInverseRelation,
            generateId);

        const { errors, successfulImports } = await importFunction(docsToUpdate, datastore, usernameProvider.getUsername());
        return { errors: errors, warnings: [], successfulImports: successfulImports };
    }


    function createParser(format: ImportFormat,
                          operationId: string,
                          selectedType?: IdaiType|undefined): any {

        switch (format) {
            case 'meninxfind':
                return MeninxFindCsvParser.parse;
            case 'idig':
                return IdigCsvParser.parse;
            case 'csv':
                if (!selectedType) throw "IMPORTER.TS: SELECTED TYPE MUST BE SET FOR CSV IMPORT";
                return CsvParser.getParse(selectedType, operationId);
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


    function buildImportFunction(format: ImportFormat,
                                 validator: ImportValidator,
                                 operationTypeNames: string[],
                                 mainTypeDocumentId: string,
                                 mergeMode: boolean,
                                 updateRelationsOnMergeMode: boolean,
                                 getInverseRelation: (_: string) => string|undefined,
                                 generateId: () => string): ImportFunction {

        const defaultImport = () => DefaultImport.build(validator, operationTypeNames, getInverseRelation, generateId);

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