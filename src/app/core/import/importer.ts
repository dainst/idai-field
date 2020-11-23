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
import {SettingsProvider} from '../settings/settings-provider';
import {makeImportCatalog} from './import/import-catalog';
import {Settings} from '../settings/settings';

export type ImportFormat = 'native' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'csv' | 'catalog';

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
     * @param datastore
     * @param settings
     * @param projectConfiguration
     * @param operationId
     * @param mergeMode
     * @param permitDeletions
     * @param fileContent
     * @param generateId
     * @param selectedCategory should be defined in case format === csv
     * @param separator
     *
     * @returns ImportReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export async function doImport(format: ImportFormat,
                                   datastore: DocumentDatastore,
                                   settings: Settings,
                                   projectConfiguration: ProjectConfiguration,
                                   operationId: string,
                                   mergeMode: boolean,
                                   permitDeletions: boolean,
                                   fileContent: string,
                                   generateId: () => string,
                                   selectedCategory?: Category,
                                   separator?: string) {

        const operationId_ = mergeMode ? '' : operationId;
        const parse = createParser(format, operationId_, selectedCategory, separator);
        const documents: Document[] = [];

        try {
            (await parse(fileContent)).forEach((resultDocument: Document) => documents.push(resultDocument));
        } catch (msgWithParams) {
            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const operationCategoryNames = ProjectCategories.getOverviewCategoryNames(projectConfiguration.getCategoryTreelist()).filter(isnt('Place'));
        const validator = new ImportValidator(projectConfiguration, datastore);
        const inverseRelationsMap = makeInverseRelationsMap(projectConfiguration.getAllRelationDefinitions());
        const preprocessDocument = FieldConverter.preprocessDocument(projectConfiguration);
        const postprocessDocument = FieldConverter.postprocessDocument(projectConfiguration);

        let importFunction;
        switch (format) {
            case 'catalog':
                importFunction = makeImportCatalog(datastore, settings);
                break;
            case 'geojson-gazetteer':
                importFunction = buildImportFunction(
                    { datastore, validator },
                    { operationCategoryNames, inverseRelationsMap, settings },
                    {generateId, preprocessDocument, postprocessDocument},
                    { mergeMode: false, permitDeletions: false });
                break;
            case 'shapefile':
            case 'geojson':
                importFunction = buildImportFunction(
                    { datastore, validator },
                    { operationCategoryNames, inverseRelationsMap, settings },
                    {generateId, preprocessDocument, postprocessDocument},
                    { mergeMode: true, permitDeletions: false });
                break;
            default: // native | csv
                importFunction = buildImportFunction(
                    { datastore, validator },
                    { operationCategoryNames, inverseRelationsMap, settings },
                    {generateId, preprocessDocument, postprocessDocument},
                    { mergeMode: mergeMode, permitDeletions: permitDeletions,
                        operationId: operationId, useIdentifiersInRelations: true });
        }

        const { errors, successfulImports } = await importFunction(documents);
        return { errors: errors, warnings: [], successfulImports: successfulImports };
    }


    function createParser(format: ImportFormat,
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
