'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';



const fs = require('fs');


const projectName: string = 'WES';



const valuelists = JSON.parse(fs.readFileSync('Library/Valuelists.json'));
const fields = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));
console.log('This is the projectname', projectName)


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
      field['valuelistId'] = conflictedLists[0];
      delete field['valuelist'];
      console.error("list exists already (old/new)", conflictedLists[0], newValuelistName );

    } else {
        valuelists[newValuelistName] = {
            createdBy: "Max Haibt",
            "creationDate": "27-3-2019",
            description: { de: "", en: "" },
            values: newValuelistValues.reduce((o, key) => ({ ...o, [key]: {}}), {}),
        };
        field['valuelistId'] = newValuelistName
        delete field['valuelist'];
    }


}


function generateName(typeName: string, fieldName: string, projectName: string) {

    return typeName + '-' + fieldName + '-' + (projectName === '' ? 'default' : projectName);
}


keysAndValues(fields).forEach(([typeName, type] : [string,any]) => {

    keysAndValues(type['fields']).forEach(([fieldName, field] :[string, any]) => {

        if (field['valuelist'] && !field['valuelistId']) {

            const newValuelistName = generateName(typeName, fieldName, projectName);

            if(valuelists[newValuelistName]) console.error("name already exists", newValuelistName);
            else insert(valuelists, field, newValuelistName, field['valuelist']);
        }
    })
});


fs.writeFileSync('Valuelists_vMH.json', JSON.stringify(valuelists, null, 2));
fs.writeFileSync(projectName === '' ? 'Config.json' : 'Config-' + projectName + '.json', JSON.stringify(fields, null, 2));
