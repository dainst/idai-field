'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';
import {pureName} from 'idai-components-2';


const fs = require('fs');



const valuelists = JSON.parse(fs.readFileSync('Valuelists.json'));




Object.values(valuelists).forEach((valuelistObject) => {


    valuelistObject['values'] = valuelistObject['values'].reduce((acc, val) => {

        acc[val] = {};
        return acc;
    }, {});
});


fs.writeFileSync('Valuelists.json', JSON.stringify(valuelists, null, 2));