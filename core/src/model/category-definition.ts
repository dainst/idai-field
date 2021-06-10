import { I18nString } from './i18n-string';


/**
 * CategoryDefinition, as used in ProjectConfiguration
 *
 * @author Daniel de Oliveira
 */
export interface CategoryDefinition {

    name: string;
    label?: I18nString;
    description?: I18nString;
    defaultLabel?: I18nString;
    defaultDescription?: I18nString;
    abstract?: boolean;

    /**
     * @see BuiltinTypeDefinition
     */
    mustLieWithin?: true,

    fields?: any;
    parent?: string;
    color?: string;
    libraryId?: string;
}


export module CategoryDefinition {

    export const FIELDS = 'fields';
    export const PARENT = 'parent';
}