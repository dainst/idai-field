import {ProjectConfiguration} from 'idai-components-2';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {StateSerializer} from '../../../common/state-serializer';
import {ViewDefinition} from './state/view-definition';
import {ResourcesStateManager} from './resources-state-manager';
import {OperationViews} from './state/operation-views';
import {IndexFacade} from '../../../core/datastore/index/index-facade';


/**
 * @author Daniel de Oliveira
 */
export module ResourcesStateManagerConfiguration {

    export function build(
        projectConfiguration: ProjectConfiguration,
        datastore: FieldReadDatastore,
        indexFacade: IndexFacade,
        stateSerializer: StateSerializer,
        projectName: string,
        suppressMapLoadForTest: boolean,
        locale: string) {

        const views: ViewDefinition[] = [
            {
                'label': locale === 'de' ? 'Ausgrabung' : 'Excavation',
                'name': 'excavation',
                'operationSubtype': 'Trench'
            },
            {
                'label': locale === 'de' ? 'Bauaufnahme' : 'Building',
                'name': 'Building',
                'operationSubtype': 'Building'
            },
            {
                'label': 'Survey',
                'name': 'survey',
                'operationSubtype': 'Survey'
            }
        ];
        for (let view of views) {
            (view as any)['mainTypeLabel'] = projectConfiguration.getLabelForType(view.operationSubtype) as any;
        }

        return new ResourcesStateManager(
            datastore,
            indexFacade,
            stateSerializer,
            new OperationViews(views),
            ['Place'],
            projectName,
            suppressMapLoadForTest
        );
    }
}