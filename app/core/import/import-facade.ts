import {ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../model/validator';
import {DocumentDatastore} from '../datastore/document-datastore';
import {UsernameProvider} from '../settings/username-provider';
import {Reader} from './reader';
import {Import} from './import';
import {Parser} from './parser';
import {MeninxFindCsvParser} from './meninx-find-csv-parser';
import {IdigCsvParser} from './idig-csv-parser';
import {GeojsonParser} from './geojson-parser';
import {NativeJsonlParser} from './native-jsonl-parser';
import {ImportStrategy} from './import-strategy';
import {MeninxFindImportStrategy} from './meninx-find-import-strategy';
import {DefaultImportStrategy} from './default-import-strategy';
import {TypeUtility} from '../model/type-utility';
import {ShapefileParser} from './shapefile-parser';
import {GazGeojsonParserAddOn} from './gaz-geojson-parser-add-on';


export type ImportFormat = 'native' | 'idig' | 'geojson' | 'geojson-gazetteer' | 'shapefile' | 'meninxfind';


/**
 * Maintains contraints on how imports are validly composed
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportFacade {

    /**
     * @param format
     * @param validator
     * @param datastore
     * @param usernameProvider
     * @param projectConfiguration
     * @param mainTypeDocumentId
     * @param allowMergingExistingResources
     * @param reader
     *
     * @returns ImportReport
     *   importReport.errors: Any error of module ImportErrors or ValidationErrors
     *   importReport.warnings
     */
    export function doImport(format: ImportFormat,
                             validator: Validator,
                             datastore: DocumentDatastore,
                             usernameProvider: UsernameProvider,
                             projectConfiguration: ProjectConfiguration,
                             mainTypeDocumentId: string,
                             allowMergingExistingResources: boolean,
                             reader: Reader) {

        return Import.go(
            reader,
            createParser(format),
            createImportStrategy(
                format,
                validator,
                datastore,
                usernameProvider,
                projectConfiguration,
                new TypeUtility(projectConfiguration),
                !allowMergingExistingResources ? mainTypeDocumentId : '',
                allowMergingExistingResources));
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
                                  validator: Validator,
                                  datastore: DocumentDatastore,
                                  usernameProvider: UsernameProvider,
                                  projectConfiguration: ProjectConfiguration,
                                  typeUtility: TypeUtility,
                                  mainTypeDocumentId: string,
                                  allowMergingExistingResources = false): ImportStrategy {

        switch (format) {
            case 'meninxfind':
                return new MeninxFindImportStrategy(validator, datastore,
                    projectConfiguration, usernameProvider.getUsername());
            case 'idig':
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    '', false, false, false);
            case 'shapefile':
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    '', true, false, false);
            case 'geojson':
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    '', true, false, false);
            case 'geojson-gazetteer':
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    '', false, false, true);
            default: // native
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    mainTypeDocumentId, allowMergingExistingResources, true, true);
        }
    }
}