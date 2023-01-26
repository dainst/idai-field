const camelCase = require('camelcase');


/**
 * @author Thomas Kleinke
 */
export module Naming {

    export function getFieldOrGroupName(searchTerm: string, projectName: string): string {

        if (searchTerm.startsWith(projectName + ':')) searchTerm = searchTerm.replace(projectName + ':', '');
        return projectName + ':' + removeSpecialCharacters(camelCase(searchTerm));
    }


    export function getCategoryName(searchTerm: string, projectName: string): string {

        projectName = convertFirstCharacterToUpperCase(projectName);
        if (searchTerm.startsWith(projectName + ':')) searchTerm = searchTerm.replace(projectName + ':', '');
        const name: string = removeSpecialCharacters(camelCase(searchTerm));
        
        return projectName + ':' + convertFirstCharacterToUpperCase(name);
    }


    export function getValuelistId(searchTerm: string, projectName: string): string {

        if (searchTerm.startsWith(projectName + ':')) searchTerm = searchTerm.replace(projectName + ':', '');
        const id: string = searchTerm.split('-')
            .map(segment => removeSpecialCharacters(segment))
            .join('-');

        return projectName + ':' + id;
    }


    function removeSpecialCharacters(name: string): string {

        return name.replace(/[^a-zA-Z\u0400-\u04FF0-9ÄÖÜäöüß]/g, '');
    }


    function convertFirstCharacterToUpperCase(name: string): string {

        return name[0].toUpperCase() + name.slice(1, name.length);
    }
}
