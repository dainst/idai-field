import { AppConfigurator } from '../../app/core/configuration/app-configurator';
import { ConfigLoader } from '../../app/core/configuration/boot/config-loader';
import { ProjectConfiguration } from '../../app/core/configuration/project-configuration';
import { mapTreeList, TreeList } from '../../app/core/util/tree-list';
import { Category } from '../../app/core/configuration/model/category';
import {SettingsService} from '../../app/core/settings/settings-service';

const fs = require('fs');


const CONFIG_DIR_PATH = 'src/config';
const OUTPUT_DIR_PATH = 'release/config';
const LOCALES = ['de', 'en'];


if (!fs.existsSync(OUTPUT_DIR_PATH)){
    fs.mkdirSync(OUTPUT_DIR_PATH);
}


class ConfigReader {

    public async read(path: string): Promise<any> {
        return Promise.resolve(JSON.parse(fs.readFileSync(path)));
    }
}


function writeProjectConfiguration(projectConfiguration: ProjectConfiguration, project: string, locale: string) {

    let tree: TreeList<Category> = projectConfiguration.getCategoryTreelist();
    tree = mapTreeList((category: Category) => {

        delete category.children;
        delete category.parentCategory;
        return category;
    }, tree);

    fs.writeFileSync(`${OUTPUT_DIR_PATH}/${project}.${locale}.json`, JSON.stringify(tree, null, 2));
}


const appConfigurator = new AppConfigurator(new ConfigLoader(new ConfigReader() as any));

LOCALES.forEach(locale => {
    for (const [projectName, configName] of Object.entries(SettingsService.projMapping)) { // TODO WES gets converted twice
        appConfigurator.go(CONFIG_DIR_PATH, configName, locale)
            .then(projectConfiguration => writeProjectConfiguration(projectConfiguration, projectName, locale))
            .catch(err => {
                console.error(err);
            });
    }
});
