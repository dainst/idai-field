import {ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {StateSerializer} from '../../../common/state-serializer';
import {ViewDefinition} from './state/view-definition';
import {ResourcesStateManager} from './resources-state-manager';
import {OperationViews} from './state/operation-views';


/**
 * @author Daniel de Oliveira
 */
export module ResourcesStateManagerConfiguration {

    export function build(
        projectConfiguration: ProjectConfiguration,
        datastore: IdaiFieldDocumentReadDatastore,
        stateSerializer: StateSerializer,
        projectName: string,
        suppressMapLoadForTest: boolean) {

        const views: ViewDefinition[] = [
            {
                "label": "Ausgrabung",
                "name": "excavation",
                "operationSubtype": "Trench"
            },
            {
                "label": "Bauaufnahme",
                "name": "Building",
                "operationSubtype": "Building"
            },
            {
                "label": "Survey",
                "name": "survey",
                "operationSubtype": "Survey"
            }
        ];
        for (let view of views) {
            (view as any)['mainTypeLabel'] = projectConfiguration.getLabelForType(view.operationSubtype) as any;
        }

        return new ResourcesStateManager(
            datastore,
            stateSerializer,
            new OperationViews(views),
            ['Place'],
            projectName,
            suppressMapLoadForTest
        );
    }
}