"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var navigation_service_1 = require("../../../../../app/components/resources/navigation/navigation-service");
var static_1 = require("../../../../subsystem/static");
describe('NavigationService', function () {
    var viewFacade;
    var projectConfiguration;
    var navigationService;
    beforeEach(function () {
        viewFacade = jasmine.createSpyObj('vf', ['isInOverview', 'moveInto']);
        projectConfiguration = jasmine.createSpyObj('pc', ['getRelationDefinitions']);
        navigationService = new navigation_service_1.NavigationService(projectConfiguration, undefined, viewFacade);
        viewFacade.isInOverview.and.returnValue(false);
    });
    it('in overview', function () {
        viewFacade.isInOverview.and.returnValue(true);
        expect(navigationService.showMoveIntoOption(static_1.Static.idfDoc('abc', 'def', 'ghi', 'jkl'))).toEqual(true);
    });
    it('has lies within as target', function () {
        projectConfiguration.getRelationDefinitions.and.returnValue([{ name: 'liesWithin' }]);
        expect(navigationService.showMoveIntoOption(static_1.Static.idfDoc('abc', 'def', 'ghi', 'jkl'))).toEqual(true);
    });
    it('is new doc', function () {
        projectConfiguration.getRelationDefinitions.and.returnValue([{ name: 'liesWithin' }]);
        expect(navigationService.showMoveIntoOption(static_1.Static.idfDoc('abc', 'def', 'ghi'))).toEqual(false);
    });
    it('does not have lies within as target', function () {
        projectConfiguration.getRelationDefinitions.and.returnValue([{ name: 'abc' }]);
        expect(navigationService.showMoveIntoOption(static_1.Static.idfDoc('abc', 'def', 'ghi', 'jkl'))).toEqual(false);
    });
    it('is place', function () {
        expect(navigationService.showMoveIntoOption(static_1.Static.idfDoc('abc', 'cde', 'Place'))).toEqual(false);
    });
});
//# sourceMappingURL=navigation-service.spec.js.map