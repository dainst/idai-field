import {protractor} from "protractor";
import * as PouchDB from "pouchdb";

PouchDB.plugin(require('pouchdb-adapter-memory'));
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const common = require('../common');

/**
 */
describe('flaky --', function() {

    it('some flaky test', done => {
        done();
    });
});
