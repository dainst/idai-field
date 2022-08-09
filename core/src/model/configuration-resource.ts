import { Map, set } from 'tsfun';
import { CustomFormDefinition } from '../configuration/model/form/custom-form-definition';
import { LanguageConfiguration } from '../configuration/model/language/language-configuration';
import { notCompareInBoth } from '../tools/compare';
import { concatIf } from '../tools/utils';
import { Valuelist } from './configuration/valuelist';
import { Resource } from './resource';


export interface ConfigurationResource extends Resource {

    forms: { [formName: string]: CustomFormDefinition };
    languages: { [language: string]: LanguageConfiguration };
    order: string[];
    valuelists: Map<Valuelist>;
    projectLanguages: string[];
}


/**
 * @author Thomas Kleinke
 */
export module ConfigurationResource {

    export function getDifferingForms(resource1: ConfigurationResource, resource2: ConfigurationResource) {

        return getDifferingSubfields(resource1, resource2, 'forms');
    }


    export function getDifferingLanguages(resource1: ConfigurationResource, resource2: ConfigurationResource) {

        return getDifferingSubfields(resource1, resource2, 'languages');
    }


    export function getDifferingValuelists(resource1: ConfigurationResource, resource2: ConfigurationResource) {

        return getDifferingSubfields(resource1, resource2, 'valuelists');
    }


    function getDifferingSubfields(resource1: ConfigurationResource, resource2: ConfigurationResource,
                                   subfieldName: 'forms'|'languages'|'valuelists') {

        const differingFormsNames: string[]
            = findDifferingSubfields(resource1[subfieldName], resource2[subfieldName])
            .concat(findDifferingSubfields(resource2[subfieldName], resource1[subfieldName]));

        return set(differingFormsNames);
    }


    function findDifferingSubfields(object1: Object, object2: Object): string[] {

        return Object.keys(object1)
            .reduce(
                concatIf(notCompareInBoth(object1, object2)),
                [] as string[]
            );
    }
}
