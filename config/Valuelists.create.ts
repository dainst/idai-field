'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';

const fs = require('fs');


const projectName: string = '';



const valuelists = JSON.parse(fs.readFileSync('Valuelists.json'));
const fields = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));


function pureName(s: string) { // TODO remove duplicate

    return  s.includes(':') ? s.substr(0, s.indexOf(':')) : s;
}


/**
 * @param valuelists modified in place
 * @param field modified in place
 * @param newValuelistName
 * @param newValuelistValues
 */
function insert(valuelists, field, newValuelistName, newValuelistValues) {

    const conflictedLists = keysAndValues(valuelists).reduce((conflictedLists: any, [k, v]) => {
        const conflicted = arrayEquivalent(v['values'])(newValuelistValues);
        return conflicted ? conflictedLists.concat([k]) : conflictedLists
    }, []);


    if (conflictedLists.length === 0) {
        valuelists[newValuelistName] = {
            createdBy: "",
            description: { de: "", en: "" },
            values: newValuelistValues
        };
    }

    delete field['valuelist'];
    field['valuelistId'] = newValuelistName;
}


function generateName(typeName: string, fieldName: string, projectName: string) {

    const pureTypeName = pureName(typeName);
    return pureTypeName + '-' + fieldName + '-' + (projectName === '' ? 'default' : projectName);
}


keysAndValues(fields).forEach(([typeName, type]) => {

    keysAndValues(type['fields']).forEach(([fieldName, field]) => {

        if (field['valuelist'] && !field['valuelistId']) {

            const newValuelistName = generateName(typeName, fieldName, projectName);

            if (valuelists[newValuelistName]) console.error("name already exists", newValuelistName);
            else insert(valuelists, field, newValuelistName, field['valuelist']);
        }
    })
});


fs.writeFileSync('Valuelists.out.json', JSON.stringify(valuelists, null, 2));
fs.writeFileSync(projectName === '' ? 'Fields.out.json' : 'Fields-' + projectName + '.out.json', JSON.stringify(fields, null, 2));