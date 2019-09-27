'use strict';

import {arrayEquivalent, keysAndValues} from 'tsfun';
import {pureName} from 'idai-components-2';


const fs = require('fs');


/**
 *
 * @param projectName user input !
 *
 *
 */
const projectName: string = 'WES.test';



const Typelib = JSON.parse(fs.readFileSync('Library/Types.json'));
const addtoTypelib = JSON.parse(fs.readFileSync(projectName === '' ? 'Fields.json' : 'Fields-' + projectName + '.json'));
console.log('This is the projectname', projectName )


/**
 * @param valuelists modified in place
 * @param field modified in place
 * @param newValuelistName
 * @param newValuelistValues
 */

function insert(Typelib, newtypecontent, newTypeName, newfields) {
            keysAndValues(Typelib).forEach(([oldtypeName, oldtypecontent] : [string,any]) => {
          const oldfields =  oldtypecontent['fields']
          console.log('this is an old fields', oldfields)
          console.log('this is a new fields', newfields)
  })

}


function generateName(typeName: string, projectName: string) {

    const pureTypeName = pureName(typeName);
    return pureTypeName + '-' + typeName + ':' + (projectName === '' ? 'default' : projectName);
}




keysAndValues(addtoTypelib).forEach(([typeName, typecontent] : [string,any]) => {
    console.log('this is the typename', typeName)
    keysAndValues(typecontent['fields']).forEach(([fieldName, fieldcontent] :[string, any]) => {
        console.log('this is the entire fields', typecontent['fields'])
        console.log('these are the fieldnames', fieldName)
        console.log('this is the inputType and valuelists', fieldcontent)
        if (typecontent['fields'] && !typecontent['typeFamily']) {

            const newTypeName = generateName(typeName, projectName);
            console.log('this is the new Typename', newTypeName)
            if (Typelib[newTypeName]) console.error("name of type already exists", newTypeName);
            else insert(Typelib, typecontent, newTypeName, typecontent['fields']);
        }
    })
});


fs.writeFileSync('Types.test.json', JSON.stringify(Typelib, null, 2));
