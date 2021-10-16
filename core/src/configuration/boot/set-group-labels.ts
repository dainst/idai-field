import { CategoryForm } from '../../model/configuration/category-form';
import { Groups } from '../../model/configuration/group';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';


/**
 * @param languageConfigurations 
 * @param category mutated in place
 * @returns category
 */
export function setGroupLabels(languageConfigurations: LanguageConfigurations,
                               category: CategoryForm): CategoryForm {

    category.groups.forEach(group => {
        group.label = getGroupLabel(category, group.name, 'complete', languageConfigurations);
        group.defaultLabel = getGroupLabel(category, group.name, 'default', languageConfigurations);
    });

    return category;
}


function getGroupLabel(category: CategoryForm, 
                       groupName: string, 
                       configuration: 'default'|'complete',
                       languageConfigurations: LanguageConfigurations) {

    if (groupName === Groups.PARENT) {
        return category.parentCategory
            ? category.parentCategory.label
            : category.label;
    } else if (groupName === Groups.CHILD) {
        return category.label;
    } else {
        return LanguageConfiguration.getI18nString(
            languageConfigurations[configuration], 'groups', groupName
        );
    }
};
