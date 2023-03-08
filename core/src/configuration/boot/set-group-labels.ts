import { CategoryForm } from '../../model/configuration/category-form';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';


/**
 * @param languageConfigurations 
 * @param form mutated in place
 */
export function setGroupLabels(languageConfigurations: LanguageConfigurations,
                               form: CategoryForm): CategoryForm {

    form.groups.forEach(group => {
        group.label = getGroupLabel(group.name, 'complete', languageConfigurations);
        group.defaultLabel = getGroupLabel(group.name, 'default', languageConfigurations);
    });

    return form;
}


function getGroupLabel(groupName: string, 
                       configuration: 'default'|'complete',
                       languageConfigurations: LanguageConfigurations) {

    return LanguageConfiguration.getI18nString(
        languageConfigurations[configuration], 'groups', groupName, false
    );
};
