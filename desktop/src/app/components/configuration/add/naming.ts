const camelCase = require('camelcase');


/**
 * @author Thomas Kleinke
 */
export module Naming {

    export function getFieldOrGroupName(searchTerm: string, projectIdentifier: string): string {

        if (searchTerm.startsWith(projectIdentifier + ':')) searchTerm = searchTerm.replace(projectIdentifier + ':', '');
        return projectIdentifier + ':' + removeSpecialCharacters(camelCase(searchTerm));
    }


    export function getCategoryName(searchTerm: string, projectIdentifier: string): string {

        projectIdentifier = convertFirstCharacterToUpperCase(projectIdentifier);
        if (searchTerm.startsWith(projectIdentifier + ':')) searchTerm = searchTerm.replace(projectIdentifier + ':', '');
        const name: string = removeSpecialCharacters(camelCase(searchTerm));
        
        return projectIdentifier + ':' + convertFirstCharacterToUpperCase(name);
    }


    export function getValuelistId(searchTerm: string, projectIdentifier: string): string {

        if (searchTerm.startsWith(projectIdentifier + ':')) searchTerm = searchTerm.replace(projectIdentifier + ':', '');
        const id: string = searchTerm.split('-')
            .map(segment => removeSpecialCharacters(segment))
            .join('-');

        return projectIdentifier + ':' + id;
    }


    function removeSpecialCharacters(name: string): string {

        return name.replace(/[^a-zA-Z\u0400-\u04FF0-9ÄÖÜäöüß]/g, '');
    }


    function convertFirstCharacterToUpperCase(name: string): string {

        return name[0].toUpperCase() + name.slice(1, name.length);
    }
}
