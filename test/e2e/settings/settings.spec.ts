import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import * as PouchDB from 'pouchdb';
import {SettingsPage} from './settings.page';
import {ImageOverviewPage} from '../images/image-overview.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {DoceditPage} from '../docedit/docedit.page';

PouchDB.plugin(require('pouchdb-adapter-memory'));

const delays = require('../config/delays');
const cors = require('pouchdb-server/lib/cors');
const express = require('express');

const path = require('path');
const common = require('../common');

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('settings --', function() {

    beforeAll(done => {
        common.resetConfigJson().then(done);
    });

    afterEach(done => {
        common.resetConfigJson().then(done);
    });

    it('save syncing settings to config file and load them after restart', done => {

        SettingsPage.get();
        common.typeIn(SettingsPage.getUserNameInput(), 'settings_test_user');
        SettingsPage.clickSaveSettingsButton();

        NavbarPage.clickNavigateToExcavation()
            .then(() => {
                browser.sleep(5000);
                return SettingsPage.get().then(() => browser.sleep(2000));
            }).then(() => SettingsPage.getUserName())
            .then(username => {
                expect(username).toEqual('settings_test_user');
                done();
            }).catch(err => {
                fail(err);
                done();
            });
    });

    it('show warnings if an invalid imagestore path is set', () => {

        SettingsPage.get();
        common.typeIn(SettingsPage.getImagestorePathInput(), '/invalid/path/to/imagestore');
        SettingsPage.clickSaveSettingsButton();
        NavbarPage.awaitAlert('Das Bilderverzeichnis konnte nicht gefunden werden', false);
        NavbarPage.clickCloseMessage(1);

        NavbarPage.clickNavigateToImages();
        ImageOverviewPage.clickUploadArea();
        ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/Aldrin_Apollo_11.jpg'));
        NavbarPage.awaitAlert('Es können keine Dateien im Bilderverzeichnis gespeichert werden', false);
        NavbarPage.clickCloseMessage();

        ImageOverviewPage.doubleClickCell(0);
        NavbarPage.awaitAlert('Es können keine Dateien aus dem Bilderverzeichnis gelesen werden', false);
        NavbarPage.clickCloseMessage();

        DocumentViewPage.performEditDocument();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('mapLayerTest2.png');
        DoceditPage.clickConfirmDeleteInModal();
        NavbarPage.awaitAlert('Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden', false);
    });
});


