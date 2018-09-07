import {Validator} from '../model/validator';
import {DocumentDatastore} from '../datastore/document-datastore';
import {UsernameProvider} from '../settings/username-provider';
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';
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
import {MergeGeometriesImportStrategy} from './merge-geometries-import-strategy';
import {RelationsStrategy} from './relations-strategy';
import {NoRelationsStrategy} from './no-relations-strategy';
import {DefaultRelationsStrategy} from './default-relations-strategy';
import {RollbackStrategy} from './rollback-strategy';
import {NoRollbackStrategy} from './no-rollback-strategy';
import {DefaultRollbackStrategy} from './default-rollback-strategy';


export type ImportFormat = 'native' | 'idig' | 'geojson' | 'meninxfind';


/**
 * Maintains contraints on how imports are validly composed
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImporterBuilder {

    /**
     * Acts as a facade to the import subsystem
     *
     * @param format
     * @param validator
     * @param datastore
     * @param usernameProvider
     * @param projectConfiguration
     * @param mainTypeDocumentId
     * @param allowMergingExistingResources
     * @param reader
     */
    export function createImportFunction(format: ImportFormat,
        validator: Validator,
        datastore: DocumentDatastore,
        usernameProvider: UsernameProvider,
        projectConfiguration: ProjectConfiguration,
        mainTypeDocumentId: string|undefined,
        allowMergingExistingResources: boolean,
        reader: Reader) {

        return () => Import.go(
            reader,
            createParser(format),
            createImportStrategy(
                format,
                validator,
                datastore,
                usernameProvider,
                projectConfiguration,
                mainTypeDocumentId,
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
            default: // 'native'
                return new NativeJsonlParser() as any;
        }
    }


    function createImportStrategy(format: ImportFormat,
        validator: Validator,
        datastore: DocumentDatastore,
        usernameProvider: UsernameProvider,
        projectConfiguration: ProjectConfiguration,
        mainTypeDocumentId?: string,
        allowMergingExistingResources = false): ImportStrategy {

        switch (format) {
            case 'meninxfind':
                return new MeninxFindImportStrategy(validator, datastore,
                    projectConfiguration, usernameProvider.getUsername());
            case 'idig':
                return new DefaultImportStrategy(validator, datastore,
                    projectConfiguration, usernameProvider.getUsername());
            case 'geojson':
                return new MergeGeometriesImportStrategy(validator, datastore, usernameProvider.getUsername());
            default: // 'native'
                return new DefaultImportStrategy(validator, datastore,
                    projectConfiguration, usernameProvider.getUsername(),
                    allowMergingExistingResources, mainTypeDocumentId);
        }
    }

    function createRelationsStrategy(format: ImportFormat, relationsCompleter: RelationsCompleter): RelationsStrategy {

        switch (format) {
            case 'meninxfind':
                return new NoRelationsStrategy();
            case 'idig':
                return new DefaultRelationsStrategy(relationsCompleter);
            case 'geojson':
                return new NoRelationsStrategy();
            default: // 'native'
                return new DefaultRelationsStrategy(relationsCompleter);
        }
    }


    function createRollbackStrategy(format: ImportFormat,
        datastore: DocumentDatastore,
        allowMergeExistingResources: boolean): RollbackStrategy {

        switch (format) {
            case 'meninxfind':
                return new NoRollbackStrategy();
            case 'geojson':
                return new NoRollbackStrategy();
            case 'idig':
                return new DefaultRollbackStrategy(datastore);
            default: // 'native'
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