import {Document, ProjectConfiguration} from 'idai-components-2';
import {UsernameProvider} from '../settings/username-provider';
import {Parser} from './parser/parser';
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
import {IdaiFieldDocumentDatastore} from '../datastore/field/idai-field-document-datastore';
import {isnt} from 'tsfun';
import {ImportFunction} from "./exec/import-function";


export type ImportFormat = 'native' | 'idig' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'meninxfind';

export type ImportReport = { errors: any[], warnings: any[], successfulImports: number };



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
     *
     * @returns ImportReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export async function doImport(format: ImportFormat,
                                   typeUtility: TypeUtility,
                                   datastore: IdaiFieldDocumentDatastore,
                                   usernameProvider: UsernameProvider,
                                   projectConfiguration: ProjectConfiguration,
                                   mainTypeDocumentId: string,
                                   allowMergingExistingResources: boolean,
                                   allowUpdatingRelationsOnMerge: boolean,
                                   fileContent: string,
                                   generateId: () => string) {

        let parserWarnings: string[][] = [];
        const parser = createParser(format);
        const docsToUpdate: Document[] = [];
        try {

            await parser
                .parse(fileContent)
                .forEach((resultDocument: Document) => docsToUpdate.push(resultDocument));

            parserWarnings = parser.getWarnings() as never[];

        } catch (msgWithParams) {

            return { errors: [msgWithParams], warnings: parserWarnings, successfulImports: 0 };
        }

        const importFunction = buildImportFunction(
            format,
            new ImportValidator(projectConfiguration, datastore, typeUtility),
            typeUtility.getOverviewTypeNames().filter(isnt('Place')),
            !allowMergingExistingResources ? mainTypeDocumentId : '',
            allowMergingExistingResources,
            allowUpdatingRelationsOnMerge,
            (_: string) => projectConfiguration.getInverseRelations(_),
            generateId);

        const { errors, successfulImports } = await importFunction(docsToUpdate, datastore, usernameProvider.getUsername());
        return { errors: errors, warnings: [], successfulImports: successfulImports };
    }



    function createParser(format: ImportFormat): Parser {

        switch (format) {
            case 'meninxfind':
                return new MeninxFindCsvParser();
            case 'idig':
                return new IdigCsvParser();
            case 'geojson-gazetteer':
                return new GeojsonParser(
                    GazGeojsonParserAddOn.preValidateAndTransformFeature,
                    GazGeojsonParserAddOn.postProcess);
            case 'geojson':
                return new GeojsonParser(undefined, undefined);
            case 'shapefile':
                return new ShapefileParser();
            case 'native':
                return new NativeJsonlParser() as any;
        }
    }


    function buildImportFunction(format: ImportFormat,
                                 validator: ImportValidator,
                                 operationTypeNames: string[],
                                 mainTypeDocumentId: string,
                                 mergeMode = false,
                                 updateRelationsOnMergeMode = false,
                                 getInverseRelation: (_: string) => string|undefined,
                                 generateId: () => string): ImportFunction {

        switch (format) {
            case 'meninxfind':
                return MeninxFindImport.build();
            case 'idig':
                return DefaultImport.build(validator, operationTypeNames, getInverseRelation, generateId);
            case 'shapefile':
                return DefaultImport.build(validator, operationTypeNames, getInverseRelation, generateId, true);
            case 'geojson':
                return DefaultImport.build(validator, operationTypeNames, getInverseRelation, generateId, true);
            case 'geojson-gazetteer':
                return DefaultImport.build(validator, operationTypeNames, getInverseRelation, generateId);
            default: // native
                return DefaultImport.build(validator, operationTypeNames, getInverseRelation, generateId, mergeMode, updateRelationsOnMergeMode, mainTypeDocumentId, true);
        }
    }
}