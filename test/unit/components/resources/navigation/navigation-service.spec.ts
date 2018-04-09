import {NavigationService} from '../../../../../app/components/resources/navigation/navigation-service';
import {Static} from '../../../static';

describe('NavigationService', () => {

    let viewFacade;
    let projectConfiguration;
    let navigationService;

    beforeEach(() => {

        viewFacade = jasmine.createSpyObj('vf', ['isInOverview', 'moveInto']);
        projectConfiguration = jasmine.createSpyObj('pc', ['getRelationDefinitions']);

        navigationService = new NavigationService(
            projectConfiguration, undefined, viewFacade);

        viewFacade.isInOverview.and.returnValue(false);
    });


    it('in overview', () => {

        viewFacade.isInOverview.and.returnValue(true);
        expect(navigationService.showMoveIntoOption(Static.ifDoc('abc', 'def', 'ghi', 'jkl'))).toEqual(true);
    });


    it('has lies within as target', () => {

        projectConfiguration.getRelationDefinitions.and.returnValue(
            [{name: 'liesWithin'}]
        );
        expect(navigationService.showMoveIntoOption(Static.ifDoc('abc', 'def', 'ghi', 'jkl'))).toEqual(true);
    });


    it('is new doc', () => {

        projectConfiguration.getRelationDefinitions.and.returnValue(
            [{name: 'liesWithin'}]
        );
        expect(navigationService.showMoveIntoOption(Static.ifDoc('abc', 'def', 'ghi'))).toEqual(false);
    });


    it('does not have lies within as target', () => {

        projectConfiguration.getRelationDefinitions.and.returnValue(
            [{name: 'abc'}]
        );
        expect(navigationService.showMoveIntoOption(Static.ifDoc('abc', 'def', 'ghi', 'jkl'))).toEqual(false);
    });


    it('is place', () => {

        expect(navigationService.showMoveIntoOption(
            Static.ifDoc('abc','cde','Place'))).toEqual(false);
    });
});
