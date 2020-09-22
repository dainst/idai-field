import {flatten} from 'tsfun';
import {PROJECT_MAPPING} from '../../app/core/settings/settings-service';
import {Tree, TreeList} from '../../app/core/util/tree-list';
import {ValueDefinition, ValuelistDefinition} from '../../app/core/configuration/model/valuelist-definition';

const fs = require('fs');
const parameterize = require('parameterize');

const CONFIG_PATH = 'release/config/';

const PREFIX_THESAURUS = 'http://thesauri.dainst.org/';
const PREFIX_SKOS = 'http://www.w3.org/2004/02/skos/core#';
const PREFIX_SKOS_XL = 'http://www.w3.org/2008/05/skos-xl#';
const PREFIX_RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

PROJECT_MAPPING['default'] = 'Default';


type Concept = {
    id: string;
    label: { [languageCode: string]: string };
    description: { [languageCode: string]: string };
    parent?: Concept;
}


const ROOT_CONCEPT: Concept = {
    id: 'idai-field',
    label: {
        de: 'iDAI.field Wertelisten',
        en: 'iDAI.field value lists'
    },
    description: {},
    parent: {
        id: '_5b453bab',
        label: {},
        description: {}
    }
};


function getConcepts(): Array<Concept> {

    const concepts: { [id: string]: Concept } = {
        'idai-field': ROOT_CONCEPT
    };

    getProjectNames().forEach(projectName => addConceptsForProject(projectName, concepts));

    return Object.values(concepts);
}


function addConceptsForProject(projectName: string, concepts: { [id: string]: Concept }) {

    const configuration: TreeList = readJSON(CONFIG_PATH + projectName + '.json');
    configuration.forEach(categoryTree => addCategoryConcept(categoryTree, concepts, projectName));
}


function addCategoryConcept(categoryTree: Tree, concepts: { [id: string]: Concept }, projectName: string,
                            parent?: Concept) {

    const category: any = categoryTree.item;

    const concept: Concept = {
        id: 'idai-field_' + parameterize(category.name),
        label: category.label,
        description: category.description,
        parent: parent ?? ROOT_CONCEPT
    };

    if (!concepts[concept.id]) concepts[concept.id] = concept;

    (flatten(category.groups.map(group => group.fields)) as any)
        .filter(field => field.valuelist)
        .forEach(field => addFieldConcept(field, concepts, projectName, concept));
    categoryTree.trees.forEach(subtree => addCategoryConcept(subtree, concepts, projectName, concept));
}


function addFieldConcept(field: any, concepts: { [id: string]: Concept }, projectName: string,
                         parent: Concept) {

    const concept = {
        id: parent.id + '_' + parameterize(field.name),
        label: field.label,
        description: field.description,
        parent: parent
    };

    if (!concepts[concept.id]) concepts[concept.id] = concept;

    addValuelistConcept(field.valuelist, concepts, projectName, concept);
}


function addValuelistConcept(valuelist: ValuelistDefinition, concepts: { [id: string]: Concept },
                             projectName: string, parent: Concept) {

    const concept = {
        id: parent.id + '_' + parameterize(projectName),
        label: {
            de: 'Werteliste ' + PROJECT_MAPPING[projectName],
            en: 'Value list ' + PROJECT_MAPPING[projectName]
        },
        description: {},
        parent: parent
    };

    if (!concepts[concept.id]) concepts[concept.id] = concept;

    Object.entries(valuelist.values).forEach(([valueName, value]) => {
        addValueConcept(value, valueName, concepts, concept);
    });
}


function addValueConcept(value: ValueDefinition, valueName: string, concepts: { [id: string]: Concept },
                         parent: Concept) {

    const concept = {
        id: parent.id + '_' + parameterize(valueName),
        label: value.labels,
        description: {},
        parent: parent
    };

    if (!concepts[concept.id]) concepts[concept.id] = concept;
}


function readJSON(filepath: string): any {

    return JSON.parse(fs.readFileSync(filepath));
}


function getProjectNames(): string[] {

    return ['default'].concat(Object.keys(PROJECT_MAPPING).filter(projectName => projectName !== 'default'));
}


function convertToSKOS(concepts: Array<Concept>): string {

    return concepts.map(getSKOSConcept).join('\n');
}


function getSKOSConcept(concept: Concept): string {

    let result = '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_RDF + 'type> '
        + '<' + PREFIX_SKOS + 'Concept> .\n';

    if (concept.parent) {
        result += '<' + PREFIX_THESAURUS + concept.id + '> '
            + '<' + PREFIX_SKOS + 'broader> '
            + '<' + PREFIX_THESAURUS + concept.parent.id + '> .\n';
    }

    result += Object.keys(concept.label).map(languageCode => getSKOSLabel(concept, languageCode));
    result += Object.keys(concept.description).map(languageCode => getSKOSNote(concept, languageCode));

    return result;
}


function getSKOSLabel(concept: Concept, languageCode: string): string {

    const label: string = concept.label[languageCode];
    if (label.length === 0) return '';

    return '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_SKOS + 'prefLabel>'
        + '"' + label + '"@' + languageCode + ' .\n'
        + '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_SKOS_XL + 'prefLabel> '
        + '<' + PREFIX_THESAURUS + concept.id + '_label_' + languageCode + ' .\n'
        + '<' + PREFIX_THESAURUS + concept.id + '_label_' + languageCode + ' '
        + '<' + PREFIX_RDF + 'type> '
        + '<' + PREFIX_SKOS_XL + 'Label> .\n'
        + '<' + PREFIX_THESAURUS + concept.id + '_label_' + languageCode + ' '
        + '<' + PREFIX_SKOS_XL + 'literalForm> '
        + '"' + label + '"@' + languageCode + ' .\n';
}


function getSKOSNote(concept: Concept, languageCode: string): string {

    const description: string = concept.description[languageCode];
    if (description.length === 0) return '';

    return '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_SKOS + 'scopeNote> '
        + '"' + description + '"@' + languageCode + ' .\n';
}


const concepts: Array<Concept> = getConcepts();
fs.writeFileSync(CONFIG_PATH + 'iDAI.field valuelists.nt', convertToSKOS(concepts));
