'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';
import {pureName} from 'idai-components-2';


const fs = require('fs');


const projectName: string = 'Castiglione';



const valuelists = JSON.parse(fs.readFileSync('Valuelists.json'));
const fields = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));


/**
 * @param valuelists modified in place
 * @param field modified in place
 * @param newValuelistName
 * @param newValuelistValues
 */
function insert(valuelists, field, newValuelistName, newValuelistValues) {

    const conflictedList =
        Object
            .values(valuelists)
            .find(vl => arrayEquivalent(vl['values'])(newValuelistValues));

    if (conflictedList) {
        field['valuelistId'] = conflictedList;
    } else {
        valuelists[newValuelistName] = {
            createdBy: "",
            description: { de: "", en: "" },
            values: newValuelistValues
        };
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