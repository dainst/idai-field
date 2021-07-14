import { Category } from '../../model/category';
import { Groups } from '../../model/group';
import { LanguageConfiguration } from '../model/language-configuration';
import { LanguageConfigurations } from '../model/language-configurations';


/**
 * @param languageConfigurations 
 * @param category mutated in place
 * @returns category
 */
export function setGroupLabels(languageConfigurations: LanguageConfigurations,
                               category: Category) {

    category.groups.forEach(group => {
        group.label = getGroupLabel(category, group.name, 'complete', languageConfigurations);
        group.defaultLabel = getGroupLabel(category, group.name, 'default', languageConfigurations);
    });

    return category;
}


function getGroupLabel(category: Category, 
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