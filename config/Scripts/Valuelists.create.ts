'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';
import {pureName} from 'idai-components-2';


const fs = require('fs');


const projectName: string = '';



const valuelists = JSON.parse(fs.readFileSync('Valuelists.json'));
const fields = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));


/**
 * @param valuelists modified in place
 * @param field modified in place
 * @param newValuelistName
 * @param newValuelistValues
 */
function insert(valuelists, field, newValuelistName, newValuelistValues) {

    const conflictedLists =
            keysAndValues(valuelists)
            .map(([_, vl]) => [_, vl['values']])
            .filter(([_, values]) => arrayEquivalent(values)(newValuelistValues))
            .map(([name, _]) => name);

    if (conflictedLists.length > 0) {
        field['valuelistId'] = conflictedLists[0];
    } else {
        valuelists[newValuelistName] = {
            createdBy: "",
            description: { de: "", en: "" },
            values: newValuelistValues
        };
        field['valuelistId'] = newValuelistName;
    }

    delete field['valuelist'];
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


fs.writeFileSync('Valuelists.json', JSON.stringify(valuelists, null, 2));
fs.writeFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json', JSON.stringify(fields, null, 2));