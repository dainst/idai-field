'use strict';

import {objectEqual, keysAndValues} from 'tsfun';



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
          if (objectEqual(oldfields)(newfields)) {
            console.error("fields of type exist already (old/new)", oldtypeName, newTypeName);
          } else {
            Typelib[newTypeName] = {
              "parent": newtypecontent['parent'],
              "typeFamily": "",
              "description": {},
              "createdBy": "WES-project",
              "creationDate": "27-03-2019",
              "color": "#CCFFFF",
              "commons": [              ],
              "fields": newfields
            };
          }

  })

}


function generateName(typeName: string, projectName: string) {

    return typeName +  ':' + (projectName === '' ? 'default' : projectName);
}




keysAndValues(addtoTypelib).forEach(([typeName, typecontent] : [string,any]) => {
    keysAndValues(typecontent['fields']).forEach(([fieldName, fieldcontent] :[string, any]) => {
        if (typecontent['fields'] && !typecontent['typeFamily']) {

            const newTypeName = generateName(typeName, projectName);
            if (Typelib[newTypeName]) console.error("name of type already exists", newTypeName);
            else insert(Typelib, typecontent, newTypeName, typecontent['fields']);
        }
    })
});


fs.writeFileSync('Types.test.json', JSON.stringify(Typelib, null, 2));
