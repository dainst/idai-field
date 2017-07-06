import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';

let resourcesPage = require('./resources.page');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/project --', function() {

    beforeEach(function() {
        return browser.get('#/resources/project');
    });

    it('basic stuff', () => {
        resourcesPage.performCreateResource('trench2', 0);

        NavbarPage.clickNavigateToExcavation();

        resourcesPage.selectMainType(1);
        resourcesPage.performCreateResource('befund1', 0);

        resourcesPage.selectMainType(0);
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('context1');

        resourcesPage.selectMainType(1);
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('befund1');

        NavbarPage.clickNavigateToProject();
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('trench2');
    });

    it('switch views after click on relation link', () => {
        resourcesPage.performCreateResource('building1', 1);

        NavbarPage.clickNavigateToBuilding();
        resourcesPage.performCreateResource('befund1', 0);

        NavbarPage.clickNavigateToExcavation();
        resourcesPage.performCreateResource('fund1', 1);
        resourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauforschung'));
        resourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        resourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
    });

    it('select correct main type document after click on relation link', () => {
        resourcesPage.performCreateResource('building1', 1);
        resourcesPage.performCreateResource('building2', 1);

        NavbarPage.clickNavigateToBuilding();
        resourcesPage.selectMainType(0);
        resourcesPage.performCreateResource('befund1', 0);
        resourcesPage.selectMainType(1);
        resourcesPage.performCreateResource('fund1', 1);
        resourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        resourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('befund1'));
        resourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        resourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('fund1'));
        resourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));
    });
});
