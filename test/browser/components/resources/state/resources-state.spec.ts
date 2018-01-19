import {ResourcesState} from "../../../../../app/components/resources/state/resources-state";
import {OperationViews} from '../../../../../app/components/resources/state/operation-views';
import {Static} from '../../../helper/static';


/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ResourcesState',() => {

        const viewsList = [
            {
                'mainTypeLabel': 'Schnitt',
                'label': 'Ausgrabung',
                'operationSubtype': 'Trench',
                'name': 'excavation'
            }
        ];


        let resourcesState;


        beforeEach(() => {

            const mockSerializer = jasmine.createSpyObj('serializer', ['store']);
            resourcesState = new ResourcesState(mockSerializer, new OperationViews(viewsList));
        });


        it('do',() => {

            const trenchDocument1 = Static.idfDoc('trench1','trench1','Trench','t1');
            const featureDocument1 = Static.idfDoc('Feature 1','feature1','Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];


            resourcesState.setView('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            resourcesState.moveInto(featureDocument1);

            // expect(resourcesState.getNavigationPath().rootDocument).toEqual(featureDocument1);
            expect(resourcesState.getNavigationPath().elements.length).toEqual(1);
            expect(resourcesState.getNavigationPath().elements[0]).toEqual(featureDocument1);
        });
    });
}