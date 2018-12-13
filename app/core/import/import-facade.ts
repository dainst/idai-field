import {Document, ProjectConfiguration} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {UsernameProvider} from '../settings/username-provider';
import {Parser} from './parser';
import {MeninxFindCsvParser} from './meninx-find-csv-parser';
import {IdigCsvParser} from './idig-csv-parser';
import {GeojsonParser} from './geojson-parser';
import {NativeJsonlParser} from './native-jsonl-parser';
import {ImportStrategy} from './import-strategy';
import {MeninxFindImportStrategy} from './meninx-find-import-strategy';
import {DefaultImportStrategy} from './default-import-strategy';
import {ShapefileParser} from './shapefile-parser';
import {GazGeojsonParserAddOn} from './gaz-geojson-parser-add-on';
import {ImportValidator} from './import-validator';


export type ImportFormat = 'native' | 'idig' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'meninxfind';

export type ImportReport = { errors: any[], warnings: any[], importedResourcesIds: string[] };



/**
 * Maintains contraints on how imports are validly composed
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export module ImportFacade {

    /**
     * The importer uses the reader and parser, to get documents, which
     * are updated in the datastore if everything is ok.
     *
     * Returns a promise which resolves to an importReport object with detailed information about the import,
     * containing the number of resources imported successfully as well as information on errors that occurred,
     * if any.
     *
     * @param format
     * @param validator
     * @param datastore
     * @param usernameProvider
     * @param projectConfiguration
     * @param mainTypeDocumentId
     * @param allowMergingExistingResources
     * @param fileContent
     *
     * @param generateId
     * @returns ImportReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export async function doImport(format: ImportFormat,
                                   validator: ImportValidator,
                                   datastore: DocumentDatastore,
                                   usernameProvider: UsernameProvider,
                                   projectConfiguration: ProjectConfiguration,
                                   mainTypeDocumentId: string,
                                   allowMergingExistingResources: boolean,
                                   fileContent: string,
                                   generateId: () => string) {


        const importReport = {
            errors: [],
            warnings: [],
            importedResourcesIds: []
        };

        const parser = createParser(format);
        const docsToUpdate: Document[] = [];
        try {

            await parser
                .parse(fileContent)
                .forEach((resultDocument: Document) => docsToUpdate.push(resultDocument));

            importReport.warnings = parser.getWarnings() as never[];

        } catch (msgWithParams) {

            importReport.errors.push(msgWithParams as never);
        }

        const importStrategy = createImportStrategy(
            format,
            validator,
            projectConfiguration,
            !allowMergingExistingResources ? mainTypeDocumentId : '',
            allowMergingExistingResources,
            generateId);


        return await importStrategy
            .import(docsToUpdate, importReport, datastore, usernameProvider.getUsername());
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
                return new GeojsonParser(
                    undefined,
                    undefined);
            case 'shapefile':
                return new ShapefileParser();
            case 'native':
                return new NativeJsonlParser() as any;
        }
    }


    function createImportStrategy(format: ImportFormat,
                                  validator: ImportValidator,
                                  projectConfiguration: ProjectConfiguration,
                                  mainTypeDocumentId: string,
                                  allowMergingExistingResources = false,
                                  generateId: () => string): ImportStrategy {

        switch (format) {
            case 'meninxfind':
                return new MeninxFindImportStrategy();
            case 'idig':
                return new DefaultImportStrategy(validator,
                    projectConfiguration,
                    false, false, false, generateId);
            case 'shapefile':
                return new DefaultImportStrategy(validator,
                    projectConfiguration,
                     true, false, false, generateId);
            case 'geojson':
                return new DefaultImportStrategy(validator,
                    projectConfiguration,
                     true, false, false, generateId);
            case 'geojson-gazetteer':
                return new DefaultImportStrategy(validator,
                    projectConfiguration,
                    false, false, true, generateId);
            default: // native
                return new DefaultImportStrategy(validator,
                    projectConfiguration,
                    allowMergingExistingResources, true, true, generateId, mainTypeDocumentId);
        }
    }
}