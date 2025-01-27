import { BaseList } from '../../../../src/app/components/resources/base-list';
import { MenuContext } from '../../../../src/app/services/menu-context';


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

        viewFacade = {
            isInExtendedSearchMode: jest.fn(),
            navigationPathNotifications: jest.fn().mockReturnValue({ subscribe: () => {} }),
            getNavigationPath: jest.fn().mockReturnValue({}),
            isInOverview: jest.fn().mockReturnValue(true),
            getSelectedOperations: jest.fn().mockReturnValue([]),
            isReady: jest.fn().mockReturnValue(true)
        };

        resourcesComponent = {
            getViewType: jest.fn(),
            isEditingGeometry: false
        };

        loading = {
            isLoading: jest.fn().mockReturnValue(false),
            getContext: jest.fn()
        };

        menuService = {
            setContext: jest.fn(),
            getContext: jest.fn()
        };

        baseList = new BaseList(resourcesComponent, viewFacade, loading, menuService);
    });


    test('plus button status', () => {

        viewFacade.isInExtendedSearchMode.mockReturnValue(true)
        expect(baseList.getPlusButtonStatus()).toEqual('disabled-hierarchy');
        viewFacade.isInExtendedSearchMode.mockReturnValue(false);
        expect(baseList.getPlusButtonStatus()).toEqual('enabled');
    });


    test('plus button shown in overview', () => {

        expect(baseList.isPlusButtonShown()).toBeTruthy();
    });


    test('plus button shown if operations exist', () => {

        viewFacade.isInOverview.mockReturnValue(false);
        viewFacade.getSelectedOperations.mockReturnValue([1]);
        expect(baseList.isPlusButtonShown()).toBeTruthy();
    });


    test('plus button not shown if isEditingGeometry', () => {

        menuService.getContext.mockReturnValue(MenuContext.GEOMETRY_EDIT);
        expect(baseList.isPlusButtonShown()).toBeFalsy();
    });


    test('plus button not shown if is loading', () => {

        loading.isLoading.mockReturnValue(true);
        expect(baseList.isPlusButtonShown()).toBeFalsy();
    });


    test('plus button not shown not ready', () => {

        viewFacade.isReady.mockReturnValue(false);
        expect(baseList.isPlusButtonShown()).toBeFalsy();
    });
});
