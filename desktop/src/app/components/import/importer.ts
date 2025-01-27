import { HttpClient } from '@angular/common/http';
import { to } from 'tsfun';
import { ProjectConfiguration, RelationsManager, ImageStore, CategoryForm, Document, Datastore,
    Name, Relation, Named } from 'idai-field-core';
import { M } from '../../components/messages/m';
import { FieldConverter } from './field-converter';
import { buildImportCatalog } from './import/import-catalog';
import { buildImportDocuments } from './import/import-documents';
import { ImportValidator } from './import/process/import-validator';
import { Find } from './import/types';
import { Updater } from './import/updater';
import { CatalogJsonlParser } from './parser/catalog-jsonl-parser';
import { CsvParser } from './parser/csv-parser';
import { GazGeojsonParserAddOn } from './parser/gaz-geojson-parser-add-on';
import { GeojsonParser } from './parser/geojson-parser';
import { NativeJsonlParser } from './parser/native-jsonl-parser';
import { CatalogFilesystemReader } from './reader/catalog-filesystem-reader';
import { FilesystemReader } from './reader/filesystem-reader';
import { HttpReader } from './reader/http-reader';
import { Reader } from './reader/reader';
import { ShapefileFilesystemReader } from './reader/shapefile-filesystem-reader';
import { Settings } from '../../services/settings/settings';
import { ImageRelationsManager } from '../../services/image-relations-manager';


export type ImporterFormat = 'native' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'csv' | 'catalog';

export type ImporterReport = { errors: any[], successfulImports: number, ignoredIdentifiers: string[] };


export interface ImporterOptions {

    format: ImporterFormat,
    mergeMode: boolean,
    permitDeletions: boolean;
    selectedOperationId: string;
    selectedCategory?: CategoryForm|undefined;
    separator: string;
    sourceType: string;
    filePath?: string|undefined;
    url?: string|undefined;
    ignoreUnconfiguredFields?: boolean;
}


export interface ImporterContext {

    settings: Settings;
    projectConfiguration: ProjectConfiguration;
    operationCategories: Name[];
}


export interface ImporterServices {

    datastore: Datastore;
    relationsManager: RelationsManager;
    imageRelationsManager: ImageRelationsManager;
    imagestore: ImageStore;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export module Importer {

    export function isDefault(format: ImporterFormat) {

        return format === 'native' || format === 'csv';
    }


    export function importIntoOperationAvailable(options: ImporterOptions,
                                                 projectConfiguration: ProjectConfiguration) {

        return (options.format === 'native' || options.format === 'csv')
            && !options.mergeMode
            && (!options.selectedCategory ||
                projectConfiguration.getRegularCategories().map(to(Named.NAME))
                    .includes(options.selectedCategory.name));
    }


    /**
     * @returns ImporterReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export async function doImport(services: ImporterServices, context: ImporterContext,
                                   generateId: () => string, options: ImporterOptions,
                                   documents: Array<Document>, typeCategoryNames: string[],
                                   imageCategoryNames: string[]): Promise<ImporterReport> {

        if (options.format === 'catalog') {
            const { errors, successfulImports } =
                await (buildImportCatalog(services, context.settings, typeCategoryNames, imageCategoryNames))(documents);
            return { errors: errors, successfulImports: successfulImports, ignoredIdentifiers: [] };
        }

        const operationCategoryNames = context.operationCategories;
        const validator = new ImportValidator(context.projectConfiguration, services.datastore);
        const inverseRelationsMap = Relation.makeInverseRelationsMap(context.projectConfiguration.getRelations());

        const preprocessDocument = FieldConverter.preprocessDocument(context.projectConfiguration);
        const postprocessDocument = FieldConverter.postprocessDocument(context.projectConfiguration);
        const find = findByIdentifier(services.datastore);
        const get = (resourceId: string) => services.datastore.get(resourceId);

        let importFunction;
        switch (options.format) {
            case 'geojson-gazetteer':
                importFunction = buildImportDocuments(
                    { validator },
                    {
                        operationCategories: operationCategoryNames,
                        inverseRelationsMap,
                        settings: context.settings
                    },
                    { find, get, generateId, preprocessDocument, postprocessDocument },
                    { mergeMode: false, permitDeletions: false });
                break;
            case 'shapefile':
            case 'geojson':
                importFunction = buildImportDocuments(
                    { validator },
                    {
                        operationCategories: operationCategoryNames,
                        inverseRelationsMap,
                        settings: context.settings
                    },
                    { find, get, generateId, preprocessDocument, postprocessDocument },
                    { mergeMode: true, permitDeletions: false, useIdentifiersInRelations: true });
                break;
            default: // native | csv
                importFunction = buildImportDocuments(
                    { validator },
                    {
                        operationCategories: operationCategoryNames,
                        inverseRelationsMap,
                        settings: context.settings
                    },
                    { find, get, generateId, preprocessDocument, postprocessDocument },
                    {
                        mergeMode: options.mergeMode,
                        permitDeletions: options.permitDeletions,
                        operationId: options.selectedOperationId,
                        ignoreUnconfiguredFields: options.ignoreUnconfiguredFields,
                        useIdentifiersInRelations: true
                    });
        }

        const [error, result] = await importFunction(documents);
        if (error !== undefined) return { errors: [error], successfulImports: 0, ignoredIdentifiers: [] };

        try {
            await Updater.go(
                result.createDocuments,
                result.updateDocuments.concat(result.targetDocuments),
                services.datastore,
                context.settings.username);
            return {
                errors: [],
                successfulImports: result.createDocuments.concat(result.updateDocuments).length,
                ignoredIdentifiers: result.ignoredIdentifiers
            };
        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0, ignoredIdentifiers: [] }; // TODO review length
        }
    }


    export async function doParse(options: ImporterOptions, fileContent: string) {

        const selectedCategory = options.format === 'csv' ? options.selectedCategory : undefined;
        const separator = options.format === 'csv' ? options.separator : undefined;
        const operationId_ = options.mergeMode ? '' : options.selectedOperationId;

        const parse = createParser(options.format, operationId_, selectedCategory, separator);
        const documents: Document[] = [];

        (await parse(fileContent)).forEach((resultDocument: Document) => documents.push(resultDocument));
        return documents;
    }


    export async function doRead(http: HttpClient, settings: Settings, imagestore: ImageStore, options: ImporterOptions) {

        const reader: Reader|undefined = createReader(http, settings, imagestore, options);
        if (!reader) throw [M.IMPORT_READER_GENERIC_START_ERROR];

        return reader.go();
    }


    function createReader(http: HttpClient, settings: Settings, imagestore: ImageStore,
                          options: ImporterOptions): Reader|undefined {

        if (options.sourceType !== 'file') return new HttpReader(options.url, http);
        if (options.format === 'shapefile') return new ShapefileFilesystemReader(options.filePath);
        if (options.format === 'catalog') return new CatalogFilesystemReader(options.filePath, settings, imagestore);
        return new FilesystemReader(options.filePath);
    }


    function createParser(format: ImporterFormat, operationId: string, selectedCategory?: CategoryForm,
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
            case 'shapefile':
                return GeojsonParser.getParse();
            case 'native':
                return NativeJsonlParser.parse;
            case 'catalog':
                return CatalogJsonlParser.parse;
        }
    }
}


function findByIdentifier(datastore: Datastore): Find {

    return async (identifier: string) => {

        const result = await datastore.find({ constraints: { 'identifier:match': identifier }});

        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
    }
}
