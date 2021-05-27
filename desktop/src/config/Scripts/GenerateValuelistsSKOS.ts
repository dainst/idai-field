import { flatten } from 'tsfun';
import { Tree, Forest, ValueDefinition, ValuelistDefinition } from 'idai-field-core';
import { PROJECT_MAPPING } from '../../app/core/settings/settings-service';
import { COMMON_FIELDS } from '../../app/core/configuration/app-configurator';

const fs = require('fs');
const parameterize = require('parameterize');

const CONFIG_PATH = 'release/config/';
const ROOT_CONCEPT_ID = '_5b453bab';

const PREFIX_THESAURUS = 'http://thesauri.dainst.org/';
const PREFIX_SKOS = 'http://www.w3.org/2004/02/skos/core#';
const PREFIX_SKOS_XL = 'http://www.w3.org/2008/05/skos-xl#';
const PREFIX_RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

PROJECT_MAPPING['default'] = {};


type Concept = {
    id: string;
    label: { [languageCode: string]: string };
    description: { [languageCode: string]: string };
    parents: Array<Concept>;
}


const IDAI_FIELD_CONCEPT: Concept = {
    id: 'idai-field',
    label: {
        de: 'iDAI.field Wertelisten',
        en: 'iDAI.field value lists'
    },
    description: {},
    parents: [
        {
            id: ROOT_CONCEPT_ID,
            label: {},
            description: {},
            parents: []
        }
    ]
};


function getConcepts(): Array<Concept> {

    const concepts: { [id: string]: Concept } = {
        'idai-field': IDAI_FIELD_CONCEPT
    };

    getProjectNames().forEach(projectName => addConceptsForProject(projectName, concepts));

    return Object.values(concepts);
}


function addConceptsForProject(projectName: string, concepts: { [id: string]: Concept }) {

    const configuration: Forest = readJSON(CONFIG_PATH + projectName + '.json');
    configuration.forEach(categoryTree => addCategoryConcept(categoryTree, concepts, projectName));
}


function addCategoryConcept(categoryTree: Tree, concepts: { [id: string]: Concept }, projectName: string,
                            parent?: Concept) {

    const category: any = categoryTree.item;

    const concept: Concept = {
        id: 'idai-field_' + parameterize(category.name),
        label: getLabel(category.label, category.name),
        description: category.description,
        parents: [parent ?? IDAI_FIELD_CONCEPT]
    };

    if (!concepts[concept.id]) concepts[concept.id] = concept;

    getFields(category)
        .filter(field => field.valuelist)
        .forEach(field => addFieldConcept(field, Object.keys(COMMON_FIELDS).includes(field.name),
            concepts, projectName, concept));
    categoryTree.trees.forEach(subtree => addCategoryConcept(subtree, concepts, projectName, concept));
}


function addFieldConcept(field: any, commonField: boolean, concepts: { [id: string]: Concept },
                         projectName: string, parent: Concept) {

    const concept: Concept = {
        id: commonField ? 'idai-field_common_' + parameterize(field.name) : parent.id + '_' + parameterize(field.name),
        label: getLabel(field.label, field.name),
        description: field.description,
        parents: [parent]
    };

    if (!concepts[concept.id]) {
        concepts[concept.id] = concept;
    } else if (!concepts[concept.id].parents.find(p => p.id === parent.id)) {
        concepts[concept.id].parents.push(parent);
    }

    addValuelistConcept(field.valuelist, concepts, projectName, concept);
}


function addValuelistConcept(valuelist: ValuelistDefinition, concepts: { [id: string]: Concept },
                             projectName: string, parent: Concept) {

    const concept: Concept = {
        id: 'idai-field-valuelist-' + parameterize(valuelist.id),
        label: getValuelistLabel(projectName),
        description: {},
        parents: [parent]
    };

    if (!concepts[concept.id]) {
        concepts[concept.id] = concept;
    } else if (!concepts[concept.id].parents.find(p => p.id === parent.id)) {
        concepts[concept.id].parents.push(parent);
    }

    Object.entries(valuelist.values).forEach(([valueName, value]) => {
        addValueConcept(value, valueName, concepts, concept);
    });
}


function getValuelistLabel(projectName: string) {

    return projectName === 'default'
        ? {
            de: 'Basiswerteliste',
            en: 'Basic value list'
        }
        : {
            de: 'Werteliste ' + PROJECT_MAPPING[projectName].label,
            en: 'Value list ' + PROJECT_MAPPING[projectName].label
        };
}


function addValueConcept(value: ValueDefinition, valueName: string, concepts: { [id: string]: Concept },
                         parent: Concept) {

    const concept: Concept = {
        id: parent.id + '_' + parameterize(valueName),
        label: getLabel(value.labels, valueName),
        description: {},
        parents: [parent]
    };

    if (!concepts[concept.id]) concepts[concept.id] = concept;
}


function getFields(category: any): Array<any> {

    const groups = category.groups.find(group => group.name === 'child')
        ? category.groups.filter(group => group.name !== 'parent')
        : category.groups;

    return (flatten(groups.map(group => group.fields)) as any);
}


function getLabel(labels: any, name: string): { [languageCode: string]: string } {

    if (!labels['de']) labels['de'] = name;
    if (!labels['en']) labels['en'] = name;

    return labels;
}


function readJSON(filepath: string): any {

    return JSON.parse(fs.readFileSync(filepath));
}


function getProjectNames(): string[] {

    return ['default'].concat(Object.keys(PROJECT_MAPPING).filter(projectName => projectName !== 'default'));
}


function convertToSKOS(concepts: Array<Concept>): string {

    return concepts.map(getSKOSConcept).join('');
}


function getSKOSConcept(concept: Concept): string {

    let result = '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_RDF + 'type> '
        + '<' + PREFIX_SKOS + 'Concept> .\n';

    result += concept.parents.map(parent =>
        '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_SKOS + 'broader> '
        + '<' + PREFIX_THESAURUS + parent.id + '> .\n'
    ).join('');

    result += Object.keys(concept.label)
        .map(languageCode => getSKOSLabel(concept, languageCode))
        .join('');

    result += Object.keys(concept.description)
        .map(languageCode => getSKOSNote(concept, languageCode))
        .join('');

    return result;
}


function getSKOSLabel(concept: Concept, languageCode: string): string {

    const label: string = concept.label[languageCode];
    if (label.length === 0) return '';

    return '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_SKOS + 'prefLabel> '
        + '"' + label + '"@' + languageCode + ' .\n'
        + '<' + PREFIX_THESAURUS + concept.id + '> '
        + '<' + PREFIX_SKOS_XL + 'prefLabel> '
        + '<' + PREFIX_THESAURUS + concept.id + '_label_' + languageCode + '> .\n'
        + '<' + PREFIX_THESAURUS + concept.id + '_label_' + languageCode + '> '
        + '<' + PREFIX_RDF + 'type> '
        + '<' + PREFIX_SKOS_XL + 'Label> .\n'
        + '<' + PREFIX_THESAURUS + concept.id + '_label_' + languageCode + '> '
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
