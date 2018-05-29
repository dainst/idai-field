import {ResourcesState} from '../../../../../app/components/resources/state/resources-state';
import {OperationViews} from '../../../../../app/components/resources/state/operation-views';
import {Static} from '../../../static';


/**
 * @author Daniel de Oliveira
 */
describe('ResourcesState', () => {

    const viewsList = [
        {
            'mainTypeLabel': 'Schnitt',
            'label': 'Ausgrabung',
            'operationSubtype': 'Trench',
            'name': 'excavation'
        }
    ];


    let resourcesState: ResourcesState;


    beforeEach(() => {

        const mockSerializer = jasmine.createSpyObj('serializer', ['store']);
        resourcesState = new ResourcesState(
            mockSerializer,
            new OperationViews(viewsList),
            undefined,
            undefined
        );

        resourcesState.loaded = true;
    });


    it('set type filters and q', () => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1.resource.id);

        resourcesState.setNavigationPathInternal({
            elements: [{
                document: featureDocument1, q: '', types: []
            }],
            rootDocument: featureDocument1, q: '', types: []
        });

        resourcesState.setTypeFilters(['Find']);
        resourcesState.setQueryString('abc');

        resourcesState.initialize('survey');
        expect(resourcesState.getTypeFilters()).toEqual([]);
        expect(resourcesState.getQueryString()).toEqual('');
        resourcesState.initialize('excavation');

        expect(resourcesState.getTypeFilters()).toEqual(['Find']);
        expect(resourcesState.getQueryString()).toEqual('abc');
    });


    it('delete type filter and q of segment', () => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');

        resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1.resource.id);

        resourcesState.setNavigationPathInternal({
            elements: [{
                document: featureDocument1,
                types: ['Find1'],
                q: 'abc'
            }],
            rootDocument: featureDocument1, q: '', types: []
        });
        resourcesState.setTypeFilters(undefined);
        resourcesState.setQueryString('');
        expect(resourcesState.getTypeFilters()).toEqual(undefined);
        expect(resourcesState.getQueryString()).toEqual('');
    });


    it('delete type filter and q of non segment', () => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');

        resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1.resource.id);

        resourcesState.setNavigationPathInternal({
            elements: [{
                document: featureDocument1, q: '', types: []
            }],
            types: ['Find1'],
            q: 'abc'
        });
        resourcesState.setTypeFilters(undefined);
        resourcesState.setQueryString('');
        expect(resourcesState.getTypeFilters()).toEqual(undefined);
        expect(resourcesState.getQueryString()).toEqual('');
    });
});
