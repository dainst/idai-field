import { CategoryForm } from '../../model/configuration/category-form';
import { Groups } from '../../model/configuration/group';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';


/**
 * @param languageConfigurations 
 * @param form mutated in place
 */
export function setGroupLabels(languageConfigurations: LanguageConfigurations,
                               form: CategoryForm): CategoryForm {

    form.groups.forEach(group => {
        group.label = getGroupLabel(form, group.name, 'complete', languageConfigurations);
        group.defaultLabel = getGroupLabel(form, group.name, 'default', languageConfigurations);
    });

    return form;
}


function getGroupLabel(form: CategoryForm, 
                       groupName: string, 
                       configuration: 'default'|'complete',
                       languageConfigurations: LanguageConfigurations) {

    if (groupName === Groups.PARENT) {
        return form.parentCategory
            ? form.parentCategory.label
            : form.label;
    } else if (groupName === Groups.CHILD) {
        return form.label;
    } else {
        return LanguageConfiguration.getI18nString(
            languageConfigurations[configuration], 'groups', groupName
        );
    }
};
