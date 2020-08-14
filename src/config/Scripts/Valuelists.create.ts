'use strict';

import {sameset} from 'tsfun';
import {forEach, map} from 'tsfun/associative';


const fs = require('fs');


const projectName: string = 'kalapodi';



const valuelists = JSON.parse(fs.readFileSync('Library/Valuelists.json'));
const fieldsKalapodi = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));


/**
 * @param valuelists modified in place
 * @param field modified in place
 * @param newValuelistName
 * @param newValuelistValues
 */
function insert(valuelists:any, field:any, newValuelistName:string, newValuelistValues:any) {

    const conflictedLists =
        map(valuelists, (vl: any, name: string) => [name, Object.keys(vl['values'])])
            .filter(([_, values]) => sameset(values)(newValuelistValues))
            .map(([name, _]) => name);

    if (conflictedLists.length > 0) {
      field['valuelistId'] = conflictedLists[0];
      delete field['valuelist'];
    } else {
        valuelists[newValuelistName] = {
            createdBy: "A.K.",
            creationDate: "2019",
            description: { de: "", en: "" },
            values: newValuelistValues.reduce((o, key) => ({ ...o, [key]: {}}), {}),
        };
        field['valuelistId'] = newValuelistName;
        delete field['valuelist'];
    }
}


function generateName(typeName: string, fieldName: string, projectName: string) {

    return typeName + '-' + fieldName + '-' + (projectName === '' ? 'default' : projectName);
}


forEach(fieldsKalapodi, (type, typeName: string) => {

    if (!type['fields']) type['fields'] = {};

    forEach(type['fields'], (field: any, fieldName: string) => {

        if (field['valuelist']) {
            const newValuelistName = generateName(typeName, fieldName, projectName);
            insert(valuelists, field, newValuelistName, field['valuelist']);
        }
    })
});


fs.writeFileSync('Library/Valuelists.json', JSON.stringify(valuelists, null, 2));
fs.writeFileSync('Config-' + projectName + '.json', JSON.stringify(fieldsKalapodi, null, 2));
