'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';
import {pureName} from 'idai-components-2';


const fs = require('fs');


const projectName: string = 'WES';



const valuelists = JSON.parse(fs.readFileSync('Library/Valuelists.json'));
const fields = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));
console.log('This is the projectname', projectName )


/**
 * @param valuelists modified in place
 * @param field modified in place
 * @param newValuelistName
 * @param newValuelistValues
 */
function insert(valuelists:any, field:any, newValuelistName:string, newValuelistValues:any) {

    const conflictedLists =
            keysAndValues(valuelists)
            .map(([_, vl]:[string,any]) => [_, Object.keys(vl['values'])])
            .filter(([_, values]) => arrayEquivalent(values)(newValuelistValues))
            .map(([name, _]) => name);

    if (conflictedLists.length > 0) {
      console.log("list exists", conflictedLists[0]);

    } else {
        valuelists[newValuelistName] = {
            createdBy: "Max Haibt",
            description: { de: "", en: "" },
            values: newValuelistValues.reduce((o, key) => ({ ...o, [key]: {}}), {}),
        };
        field['valuelistId'] = newValuelistName;
    }

    delete field['valuelist'];
}


function generateName(typeName: string, fieldName: string, projectName: string) {

    const puretypeName = pureName(typeName);
    return puretypeName + '-' + fieldName + '-' + (projectName === '' ? 'default' : projectName);
}


keysAndValues(fields).forEach(([typeName, type] : [string,any]) => {

    keysAndValues(type['fields']).forEach(([fieldName, field] :[string, any]) => {

        if (field['valuelist'] && !field['valuelistId']) {

            const newValuelistName = generateName(typeName, fieldName, projectName);

            if (valuelists[newValuelistName]) console.error("name already exists", newValuelistName);
            else insert(valuelists, field, newValuelistName, field['valuelist']);
        }
    })
});


fs.writeFileSync('Valuelists.test.json', JSON.stringify(valuelists, null, 2));
fs.writeFileSync(projectName === '' ? 'Fields.test.json' : 'Fields-' + projectName + '.test.json', JSON.stringify(fields, null, 2));
