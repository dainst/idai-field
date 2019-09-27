'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';

export function pureName(s: string) {

    return  s.includes(':') ? s.substr(0, s.indexOf(':')) : s;
}


const fs = require('fs');



const valuelists = JSON.parse(fs.readFileSync('Valuelists.json'));




Object.values(valuelists).forEach((valuelistObject) => {


    valuelistObject['values'] = valuelistObject['values'].reduce((acc, val) => {

        acc[val] = {};
        return acc;
    }, {});
});


fs.writeFileSync('Valuelists.json', JSON.stringify(valuelists, null, 2));