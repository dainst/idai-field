import {ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../model/validator';
import {DocumentDatastore} from '../datastore/document-datastore';
import {UsernameProvider} from '../settings/username-provider';
import {Reader} from './reader';
import {Import} from './import';
import {RelationsCompleter} from './relations-completer';
import {Parser} from './parser';
import {MeninxFindCsvParser} from './meninx-find-csv-parser';
import {IdigCsvParser} from './idig-csv-parser';
import {GeojsonParser} from './geojson-parser';
import {NativeJsonlParser} from './native-jsonl-parser';
import {ImportStrategy} from './import-strategy';
import {MeninxFindImportStrategy} from './meninx-find-import-strategy';
import {DefaultImportStrategy} from './default-import-strategy';
import {RelationsStrategy} from './relations-strategy';
import {NoRelationsStrategy} from './no-relations-strategy';
import {DefaultRelationsStrategy} from './default-relations-strategy';
import {RollbackStrategy} from './rollback-strategy';
import {NoRollbackStrategy} from './no-rollback-strategy';
import {DefaultRollbackStrategy} from './default-rollback-strategy';
import {TypeUtility} from '../model/type-utility';
import {ShapefileParser} from './shapefile-parser';


export type ImportFormat = 'native' | 'idig' | 'geojson' | 'shapefile' | 'meninxfind';


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
     *
     * .errors: Any error of module ImportErrors or ValidationErrors
     * .warnings
     *
     */
    export function doImport(format: ImportFormat,
                             validator: Validator,
                             datastore: DocumentDatastore,
                             usernameProvider: UsernameProvider,
                             projectConfiguration: ProjectConfiguration,
                             mainTypeDocumentId: string|undefined,
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
                !allowMergingExistingResources ? mainTypeDocumentId : undefined,
                allowMergingExistingResources),
            createRelationsStrategy(
                format,
                new RelationsCompleter(
                    datastore,
                    projectConfiguration,
                    usernameProvider)),
            createRollbackStrategy(
                format,
                datastore,
                allowMergingExistingResources));
    }


    function createParser(format: ImportFormat): Parser {

        switch (format) {
            case 'meninxfind':
                return new MeninxFindCsvParser();
            case 'idig':
                return new IdigCsvParser();
            case 'geojson':
                return new GeojsonParser();
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
                                  mainTypeDocumentId?: string,
                                  allowMergingExistingResources: boolean = false): ImportStrategy {

        switch (format) {
            case 'meninxfind':
                return new MeninxFindImportStrategy(validator, datastore,
                    projectConfiguration, usernameProvider.getUsername());
            case 'idig':
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername());
            case 'shapefile':
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    true);
            default: // native | geojson
                return new DefaultImportStrategy(typeUtility, validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    allowMergingExistingResources, mainTypeDocumentId);
        }
    }


    function createRelationsStrategy(format: ImportFormat,
                                     relationsCompleter: RelationsCompleter): RelationsStrategy {

        switch (format) {
            case 'meninxfind':
            case 'geojson':
            case 'shapefile':
                return new NoRelationsStrategy();
            case 'idig':
            case 'native':
                return new DefaultRelationsStrategy(relationsCompleter);
        }
    }


    function createRollbackStrategy(format: ImportFormat,
        datastore: DocumentDatastore,
        allowMergeExistingResources: boolean): RollbackStrategy {

        switch (format) {
            case 'meninxfind':
            case 'geojson':
            case 'shapefile':
                return new NoRollbackStrategy();
            case 'idig':
                return new DefaultRollbackStrategy(datastore);
            case 'native':
                return allowMergeExistingResources
                    // no restore to previous versions of resources once modified.
                    // we keep the use cases of merge and of creation strictly separated.
                    // on merge for example resources which cannot be matched get ignored (instead of created)
                    // and on creation we do never merge resources but throw an error if the resource already exists.
                    ? new NoRollbackStrategy()
                    : new DefaultRollbackStrategy(datastore);
        }
    }
}