import {BaseList} from '../../../../src/app/components/resources/base-list';
import {MenuContext} from '../../../../src/app/components/menu-service';


/**
 * @author Daniel de Oliveira
 */
describe('BaseList', () => {

    let viewFacade;
    let resourcesComponent;
    let loading;
    let menuService;
    let baseList;


    beforeEach(() => {

        viewFacade = jasmine.createSpyObj('viewFacade', ['isInExtendedSearchMode', 'navigationPathNotifications',
            'getNavigationPath', 'isInOverview', 'getSelectedOperations', 'isReady']);
        viewFacade.navigationPathNotifications.and.returnValue({ subscribe: () => {} });
        viewFacade.getNavigationPath.and.returnValue({});
        viewFacade.getSelectedOperations.and.returnValue([]);
        viewFacade.isReady.and.returnValue(true);

        resourcesComponent = jasmine.createSpyObj('resourcesComponent', ['getViewType']);
        loading = jasmine.createSpyObj('loading', ['isLoading', 'getContext']);
        menuService = jasmine.createSpyObj('menuService', ['setContext', 'getContext']);

        baseList = new BaseList(resourcesComponent, viewFacade, loading, menuService);

        // partial requirements to show plus button
        loading.isLoading.and.returnValue(false);
        loading.getContext.and.returnValue(undefined);
        viewFacade.isInOverview.and.returnValue(true);
        resourcesComponent.isEditingGeometry = false;
    });


    it('plus button status', () => {

        viewFacade.isInExtendedSearchMode.and.returnValue(true);
        expect(baseList.getPlusButtonStatus()).toEqual('disabled-hierarchy');
        viewFacade.isInExtendedSearchMode.and.returnValue(false);
        expect(baseList.getPlusButtonStatus()).toEqual('enabled');
    });


    it('plus button shown in overview', () => {

        expect(baseList.isPlusButtonShown()).toBeTruthy();
    });


    it('plus button shown if operations exist', () => {

        viewFacade.isInOverview.and.returnValue(false);
        viewFacade.getSelectedOperations.and.returnValue([1]);
        expect(baseList.isPlusButtonShown()).toBeTruthy();
    });


    it('plus button not shown if isEditingGeometry', () => {

        menuService.getContext.and.returnValue(MenuContext.GEOMETRY_EDIT);
        expect(baseList.isPlusButtonShown()).toBeFalsy();
    });


    it('plus button not shown if is loading', () => {

        loading.isLoading.and.returnValue(true);
        expect(baseList.isPlusButtonShown()).toBeFalsy();
    });


    it('plus button not shown not ready', () => {

        viewFacade.isReady.and.returnValue(false);
        expect(baseList.isPlusButtonShown()).toBeFalsy();
    });
});
