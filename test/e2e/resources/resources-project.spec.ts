import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';

import {ResourcesPage} from './resources.page';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/project --', function() {

    beforeEach(function() {
        return browser.get('#/resources/project');
    });

    it('basic stuff', () => {
        ResourcesPage.performCreateResource('trench2', 0);

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.selectMainType(1);
        ResourcesPage.performCreateResource('befund1', 0);

        ResourcesPage.selectMainType(0);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        ResourcesPage.selectMainType(1);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('befund1'));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('trench2'));
    });

    it('switch views after click on relation link', () => {
        ResourcesPage.performCreateResource('building1', 1);

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('befund1', 0);

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('fund1', 1);
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauforschung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
    });

    it('select correct main type document after click on relation link', () => {
        ResourcesPage.performCreateResource('building1', 1);
        ResourcesPage.performCreateResource('building2', 1);

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.selectMainType(0);
        ResourcesPage.performCreateResource('befund1', 0);
        ResourcesPage.selectMainType(1);
        ResourcesPage.performCreateResource('fund1', 1);
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('befund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('fund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));
    });
});
