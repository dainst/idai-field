import {AppConfigurator} from '../../app/core/configuration/app-configurator';
import {ConfigLoader} from '../../app/core/configuration/boot/config-loader';
import {ProjectConfiguration} from '../../app/core/configuration/project-configuration';
import {mapTreeList, TreeList} from '../../app/core/util/tree-list';
import {Category} from '../../app/core/configuration/model/category';
import {PROJECT_MAPPING} from '../../app/core/settings/settings-service';

const fs = require('fs');


const CONFIG_DIR_PATH = 'src/config';
const OUTPUT_DIR_PATH = 'release';
const LOCALES = ['de', 'en'];

if (!fs.existsSync(OUTPUT_DIR_PATH)) fs.mkdirSync(OUTPUT_DIR_PATH);
if (!fs.existsSync(OUTPUT_DIR_PATH + '/config')) fs.mkdirSync(OUTPUT_DIR_PATH + '/config');


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

    fs.writeFileSync(`${OUTPUT_DIR_PATH}/config/${project}.${locale}.json`, JSON.stringify(tree, null, 2));
}


async function start() {

    for (const locale of LOCALES) {
        console.log(`\nGenerating configuration files for locale: ${locale}`);
        for (const [projectName, configName] of Object.entries(PROJECT_MAPPING)) {
            const appConfigurator = new AppConfigurator(new ConfigLoader(new ConfigReader() as any));
            console.log('');
            try {
                const projectConfiguration = await appConfigurator.go(CONFIG_DIR_PATH, configName, locale);
                writeProjectConfiguration(projectConfiguration, projectName, locale);
            } catch (err) {
                console.error(`Error while trying to generate full configuration for project ${projectName}:`, err);
            }
        }
    }
}


start().then(() => {
    console.log('\nFinished generating configuration files.');
});
