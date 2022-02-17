const camelCase = require('camelcase');


/**
 * @author Thomas Kleinke
 */
export module Naming {

    export function getFieldName(searchTerm: string, projectName: string): string {

        return projectName + ':' + removeSpecialCharacters(camelCase(searchTerm));
    }


    function removeSpecialCharacters(name: string): string {

        return name.replace(/[^a-zA-Z0-9 ]/g, '');
    }
}
