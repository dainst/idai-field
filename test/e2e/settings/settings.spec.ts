import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import * as PouchDB from 'pouchdb';
import {SettingsPage} from './settings.page';

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
});


