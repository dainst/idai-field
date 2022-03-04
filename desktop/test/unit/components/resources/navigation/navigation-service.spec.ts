import { fieldDoc } from 'idai-field-core';
import { NavigationService } from '../../../../../src/app/components/resources/navigation/navigation-service';


describe('NavigationService', () => {

    let viewFacade;
    let projectConfiguration;
    let navigationService;
    let messages;


    beforeEach(() => {

        viewFacade = jasmine.createSpyObj(
            'viewFacade',
            ['isInOverview', 'moveInto', 'isInExtendedSearchMode']
        );

        projectConfiguration = jasmine.createSpyObj(
            'projectConfiguration',
            ['getRelationsForRangeCategory', 'getCategory']
        );

        messages = jasmine.createSpyObj(
            'messages',
            ['add']
        );

        navigationService = new NavigationService(projectConfiguration, undefined, viewFacade, messages);

        viewFacade.isInOverview.and.returnValue(false);
        viewFacade.isInExtendedSearchMode.and.returnValue(false);
    });


    it('show jump to view buttons in overview for operation subcategories ', () => {

        viewFacade.isInOverview.and.returnValue(true);
        projectConfiguration.getCategory.and.returnValue({
            children: [ { name: 'operationSubcategory' } ]
        });

        expect(navigationService.showJumpToViewOption(
            fieldDoc('abc', 'def', 'operationSubcategory', 'jkl'))
        ).toEqual(true);
    });


    it('show move into buttons for resources that can be a liesWithin target', () => {

        projectConfiguration.getRelationsForRangeCategory.and.returnValue(
            [{ name: 'liesWithin' }]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(true);
    });


    it('do not show move into buttons for resources that cannot be a liesWithin target', () => {

        projectConfiguration.getRelationsForRangeCategory.and.returnValue(
            [{ name: 'abc' }]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(false);
    });


    it('do not show move into buttons for newly created resources without id', () => {

        projectConfiguration.getRelationsForRangeCategory.and.returnValue(
            [{ name: 'liesWithin' }]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi'))
        ).toEqual(false);
    });


    it('do not show hierarchy buttons in extended search mode', () => {

        viewFacade.isInOverview.and.returnValue(true);
        viewFacade.isInExtendedSearchMode.and.returnValue(true);

        projectConfiguration.getCategory.and.returnValue({
            Operation: { children: [ { name: 'operationSubcategory' } ] }
        });

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(false);

        expect(navigationService.showJumpToViewOption(
            fieldDoc('abc', 'def', 'operationSubcategory', 'jkl'))
        ).toEqual(false);
    });
});
