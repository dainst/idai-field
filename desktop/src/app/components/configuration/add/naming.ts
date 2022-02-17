const camelCase = require('camelcase');


/**
 * @author Thomas Kleinke
 */
export module Naming {

    export function getFieldOrGroupName(searchTerm: string, projectName: string): string {

        return projectName + ':' + removeSpecialCharacters(camelCase(searchTerm));
    }
    

    export function getCategoryName(searchTerm: string, projectName: string): string {

        const name: string = removeSpecialCharacters(camelCase(searchTerm));
        
        return convertFirstCharacterToUpperCase(projectName) + ':' + convertFirstCharacterToUpperCase(name);
    }


    function removeSpecialCharacters(name: string): string {

        return name.replace(/[^a-zA-Z0-9 ]/g, '');
    }


    function convertFirstCharacterToUpperCase(name: string): string {

        return name[0].toUpperCase() + name.slice(1, name.length);
    }
}
