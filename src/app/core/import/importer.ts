import {isnt} from 'tsfun';
import {Document} from 'idai-components-2';
import {GeojsonParser} from './parser/geojson-parser';
import {NativeJsonlParser} from './parser/native-jsonl-parser';
import {ShapefileParser} from './parser/shapefile-parser';
import {GazGeojsonParserAddOn} from './parser/gaz-geojson-parser-add-on';
import {ImportValidator} from './import/process/import-validator';
import {DocumentDatastore} from '../datastore/document-datastore';
import {CsvParser} from './parser/csv-parser';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {Category} from '../configuration/model/category';
import {makeInverseRelationsMap} from '../configuration/inverse-relations-map';
import {buildImportFunction} from './import/import-documents';
import {FieldConverter} from './field-converter';
import {ProjectCategories} from '../configuration/project-categories';
import {CatalogJsonlParser} from './parser/catalog-jsonl-parser';
import {buildImportCatalogFunction} from './import/import-catalog';
import {Settings} from '../settings/settings';
import {HttpClient} from '@angular/common/http';
import {Reader} from './reader/reader';
import {HttpReader} from './reader/http-reader';
import {ShapefileFilesystemReader} from './reader/shapefile-filesystem-reader';
import {CatalogFilesystemReader} from './reader/catalog-filesystem-reader';
import {FilesystemReader} from './reader/filesystem-reader';
import {M} from '../../components/messages/m';
import {RelationsManager} from '../model/relations-manager';
import {ImageRelationsManager} from '../model/image-relations-manager';
import {Imagestore} from '../images/imagestore/imagestore';

export type ImporterFormat = 'native' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'csv' | 'catalog';

export type ImporterReport = { errors: any[], successfulImports: number };


export interface ImporterOptions {

    format: ImporterFormat,
    mergeMode: boolean,
    differentialImport?: true,
    permitDeletions: boolean;
    selectedOperationId: string;
    selectedCategory?: Category|undefined;
    separator: string;
    sourceType: string;
    file?: any|undefined;
    url?: string|undefined;
}


export interface ImporterContext {

    settings: Settings;
    projectConfiguration: ProjectConfiguration;
}


export interface ImporterServices {

    datastore: DocumentDatastore;
    relationsManager: RelationsManager;
    imageRelationsManager: ImageRelationsManager;
    imagestore: Imagestore;
}



/**
 * Maintains contraints on how imports are validly composed
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export module Importer {

    export function mergeOptionAvailable(options: ImporterOptions) {

        return options.format === 'native' || options.format === 'csv';
    }


    export function differentialImportOptionAvailable(options: ImporterOptions) {

        return options.format === 'native' || options.format === 'csv';
    }


    export function permitDeletionsOptionAvailable(options: ImporterOptions) {

        return ['native', 'csv'].includes(options.format) && options.mergeMode;
    }


    export function importIntoOperationAvailable(options: ImporterOptions) {

        return (options.format === 'native' || options.format === 'csv') && !options.mergeMode;
    }


    /**
     * The importer uses the reader and parser, to get documents, which
     * are updated in the datastore if everything is ok.
     *
     * Returns a promise which resolves to an importReport object with detailed information about the import,
     * containing the number of resources imported successfully as well as information on errors that occurred,
     * if any.
     *
     * @returns ImporterReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export async function doImport(services: ImporterServices,
                                   context: ImporterContext,
                                   generateId: () => string,
                                   options: ImporterOptions,
                                   documents: Array<Document>) {

        const operationCategoryNames = ProjectCategories.getOverviewCategoryNames(context.projectConfiguration.getCategoryTreelist()).filter(isnt('Place'));
        const validator = new ImportValidator(context.projectConfiguration, services.datastore);
        const inverseRelationsMap = makeInverseRelationsMap(context.projectConfiguration.getAllRelationDefinitions());
        const preprocessDocument = FieldConverter.preprocessDocument(context.projectConfiguration);
        const postprocessDocument = FieldConverter.postprocessDocument(context.projectConfiguration);

        let importFunction;
        switch (options.format) {
            case 'catalog':
                importFunction = buildImportCatalogFunction(services, context.settings);
                break;
            case 'geojson-gazetteer':
                importFunction = buildImportFunction(
                    { datastore: services.datastore, validator },
                    { operationCategoryNames, inverseRelationsMap, settings: context.settings },
                    { generateId, preprocessDocument, postprocessDocument },
                    { mergeMode: false, permitDeletions: false });
                break;
            case 'shapefile':
            case 'geojson':
                importFunction = buildImportFunction(
                    { datastore: services.datastore, validator },
                    { operationCategoryNames, inverseRelationsMap, settings: context.settings },
                    { generateId, preprocessDocument, postprocessDocument },
                    { mergeMode: true, permitDeletions: false });
                break;
            default: // native | csv
                importFunction = buildImportFunction(
                    { datastore: services.datastore, validator },
                    { operationCategoryNames, inverseRelationsMap, settings: context.settings },
                    { generateId, preprocessDocument, postprocessDocument },
                    {
                        mergeMode: options.mergeMode,
                        differentialImport: options.differentialImport,
                        permitDeletions: options.permitDeletions,
                        operationId: options.selectedOperationId,
                        useIdentifiersInRelations: true
                    });
        }

        const { errors, successfulImports } = await importFunction(documents);
        return { errors: errors, warnings: [], successfulImports: successfulImports };
    }


    export async function doParse(options: ImporterOptions,
                                  fileContent: string) {

        const selectedCategory = options.format === 'csv' ? options.selectedCategory : undefined;
        const separator = options.format === 'csv' ? options.separator : undefined;
        const operationId_ = options.mergeMode ? '' : options.selectedOperationId;

        const parse = createParser(options.format, operationId_, selectedCategory, separator);
        const documents: Document[] = [];

        (await parse(fileContent)).forEach((resultDocument: Document) => documents.push(resultDocument));
        return documents;
    }


    export async function doRead(http: HttpClient,
                                 settings: Settings,
                                 options: ImporterOptions) {

        const reader: Reader|undefined =
            createReader(
                http,
                settings,
                options);
        if (!reader) throw [M.IMPORT_READER_GENERIC_START_ERROR];
        return reader.go();
    }


    function createReader(http: HttpClient,
                          settings: Settings,
                          options: ImporterOptions): Reader|undefined {

        if (options.sourceType !== 'file') return new HttpReader(options.url, http);
        if (options.format === 'shapefile') return new ShapefileFilesystemReader(options.file);
        if (options.format === 'catalog') return new CatalogFilesystemReader(options.file, settings);
        return new FilesystemReader(options.file);
    }


    function createParser(format: ImporterFormat,
                          operationId: string,
                          selectedCategory?: Category,
                          separator?: string): any {

        switch (format) {
            case 'csv':
                if (!selectedCategory) throw 'Selected category must be set for csv import';
                if (!separator) throw 'Separator must be set for csv import';
                return CsvParser.build(selectedCategory, operationId, separator);
            case 'geojson-gazetteer':
                return GeojsonParser.getParse(
                    GazGeojsonParserAddOn.preValidateAndTransformFeature,
                    GazGeojsonParserAddOn.postProcess
                );
            case 'geojson':
                return GeojsonParser.getParse(undefined, undefined);
            case 'shapefile':
                return ShapefileParser.parse;
            case 'native':
                return NativeJsonlParser.parse;
            case 'catalog':
                return CatalogJsonlParser.parse;
        }
    }
}
