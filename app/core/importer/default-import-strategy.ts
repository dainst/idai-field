import {Document} from 'idai-components-2/core';
import {Validator} from 'idai-components-2/persist';
import {Datastore} from 'idai-components-2/datastore';
import {ConfigLoader, ProjectConfiguration} from 'idai-components-2/configuration';
import {ImportStrategy} from './import-strategy';
import {SettingsService} from '../../service/settings-service';
import {M} from '../../m';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    constructor(private validator: Validator, private datastore: Datastore, private settingsService: SettingsService,
                private configLoader: ConfigLoader, private mainTypeDocumentId?: string) { }


    importDoc(document: Document): Promise<any> {

        return this.setMainTypeDocumentRelation(document)
            .then(() => {
                document.created = { user: this.settingsService.getUsername(), date: new Date() };
                document.modified = [{ user: this.settingsService.getUsername(), date: new Date() }];

                return this.validator.validate(document);
            })
            .then(() => this.datastore.create(document))
            .catch(
                errorWithParams => Promise.reject(errorWithParams)
            );
    }


    private setMainTypeDocumentRelation(document: Document): Promise<any> {

        if (!this.mainTypeDocumentId || this.mainTypeDocumentId == '') return Promise.resolve();

        let projectConfiguration: ProjectConfiguration;

        return this.configLoader.getProjectConfiguration()
            .then(projectConfig => {
                projectConfiguration = projectConfig;
                return this.datastore.get(this.mainTypeDocumentId as any);
            }).then(mainTypeDocument => {
                if (!projectConfiguration.isAllowedRelationDomainType(document.resource.type,
                        mainTypeDocument.resource.type, 'isRecordedIn')) {
                    return Promise.reject([M.IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                        mainTypeDocument.resource.type]);
                }

                let relations = document.resource.relations;

                if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];

                if (relations['isRecordedIn'].indexOf(this.mainTypeDocumentId as any) == -1) {
                    relations['isRecordedIn'].push(this.mainTypeDocumentId as any);
                }

                return Promise.resolve();
        });
    }
}