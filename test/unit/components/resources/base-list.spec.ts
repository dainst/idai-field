import {BaseList} from '../../../../app/components/resources/base-list';

/**
 * @author Daniel de Oliveira
 */
describe('BaseList', () => {

    let viewFacade;
    let resourcesComponent;
    let loading;
    let bl;


    beforeEach(() => {

        viewFacade = jasmine.createSpyObj('viewFacade', ['getBypassHierarchy', 'navigationPathNotifications',
            'isInOverview', 'getSelectedOperations', 'isReady']);
        viewFacade.navigationPathNotifications.and.returnValue({subscribe: () => {}});
        viewFacade.getSelectedOperations.and.returnValue([]);
        viewFacade.isReady.and.returnValue(true);

        resourcesComponent = jasmine.createSpyObj('resourcesComponent', ['getViewType']);
        loading = jasmine.createSpyObj('loading', ['isLoading']);

        bl = new BaseList(resourcesComponent, viewFacade, loading);

        // partial requirements to show plus button
        loading.isLoading.and.returnValue(false);
        viewFacade.isInOverview.and.returnValue(true);
        resourcesComponent.isEditingGeometry = false;
        resourcesComponent.ready = true;
        loading.isLoading.and.returnValue(false);
    });


    it('plus button status', () => {

        viewFacade.getBypassHierarchy.and.returnValue(true);
        expect(bl.getPlusButtonStatus()).toEqual('disabled-hierarchy');
        viewFacade.getBypassHierarchy.and.returnValue(false);
        expect(bl.getPlusButtonStatus()).toEqual('enabled');
    });


    it('plus button shown in overview', () => {

        expect(bl.isPlusButtonShown()).toBeTruthy();
    });


    it('plus button shown if operations exist', () => {

        viewFacade.isInOverview.and.returnValue(false);
        viewFacade.getSelectedOperations.and.returnValue([1]);
        expect(bl.isPlusButtonShown()).toBeTruthy();
    });


    it('plus button not shown if isEditingGeometry', () => {

        resourcesComponent.isEditingGeometry = false;
        expect(bl.isPlusButtonShown()).toBeTruthy();
    });


    it('plus button not shown if is loading', () => {

        loading.isLoading.and.returnValue(true);
        expect(bl.isPlusButtonShown()).toBeFalsy();
    });


    it('plus button not shown not ready', () => {

        viewFacade.isReady.and.returnValue(false);
        expect(bl.isPlusButtonShown()).toBeFalsy();
    });
});