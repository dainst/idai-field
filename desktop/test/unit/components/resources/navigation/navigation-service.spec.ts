import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { fieldDoc } from 'idai-field-core';
import { NavigationService } from '../../../../../src/app/components/resources/navigation/navigation-service';


describe('NavigationService', () => {

    let viewFacade;
    let projectConfiguration;
    let navigationService;
    let messages;


    beforeEach(() => {

        viewFacade = {
            isInOverview: jest.fn().mockReturnValue(false),
            moveInto: jest.fn(),
            isInExtendedSearchMode: jest.fn().mockReturnValue(false)
        };

        projectConfiguration = {
            getRelationsForRangeCategory: jest.fn(),
            getCategory: jest.fn()
        };

        messages = {
            add: jest.fn()
        };

        navigationService = new NavigationService(projectConfiguration, undefined, viewFacade, messages);
    });


    test('show jump to view buttons in overview for operation subcategories ', () => {

        viewFacade.isInOverview.mockReturnValue(true);
        projectConfiguration.getCategory.mockReturnValue({
            children: [ { name: 'operationSubcategory' } ]
        });

        expect(navigationService.showJumpToViewOption(
            fieldDoc('abc', 'def', 'operationSubcategory', 'jkl'))
        ).toEqual(true);
    });


    test('show move into buttons for resources that can be a liesWithin target', () => {

        projectConfiguration.getRelationsForRangeCategory.mockReturnValue(
            [{ name: 'liesWithin' }]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(true);
    });


    test('do not show move into buttons for resources that cannot be a liesWithin target', () => {

        projectConfiguration.getRelationsForRangeCategory.mockReturnValue(
            [{ name: 'abc' }]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi', 'jkl'))
        ).toEqual(false);
    });


    test('do not show move into buttons for newly created resources without id', () => {

        projectConfiguration.getRelationsForRangeCategory.mockReturnValue(
            [{ name: 'liesWithin' }]
        );

        expect(navigationService.shouldShowArrowBottomRight(
            fieldDoc('abc', 'def', 'ghi'))
        ).toEqual(false);
    });


    test('do not show hierarchy buttons in extended search mode', () => {

        viewFacade.isInOverview.mockReturnValue(true);
        viewFacade.isInExtendedSearchMode.mockReturnValue(true);

        projectConfiguration.getCategory.mockReturnValue({
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
