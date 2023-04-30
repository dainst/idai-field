import React, { useState, useEffect, ReactElement } from 'react';
import { Dropdown, DropdownButton, Button, InputGroup, Form } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { Tree, Forest } from 'idai-field-core';
import { Field } from '../../api/document';
import { flatten, Map } from 'tsfun';
import { ResultFilter, FilterBucket, FilterBucketTreeNode } from '../../api/result';
import { ProjectView } from '../project/Project';
import { buildParamsForFilterValue } from './utils';
import { getTranslation } from '../../shared/languages';
import { useTranslation } from 'react-i18next';

// TODO review all occurences of 'resource.' replacements
// TODO review all occurences of '.name' replacements

export default function FieldFilters({ projectId, projectView, searchParams, filter }: { projectId: string,
    projectView: ProjectView, searchParams: URLSearchParams, filter: ResultFilter}): ReactElement {

    const { t } = useTranslation();
    
    const history = useHistory();
    const navigateTo = (k: string, v: string) => history.push(`/project/${projectId}/${projectView}?`
        + buildParamsForFilterValue(searchParams, 'resource.' + k, v));

    const [currentFilter, setCurrentFilter] = useState<[string, string]>(['', '']);
    const [currentFilterText, setCurrentFilterText] = useState<string>('');
    const [filters, setFilters] = useState<[string,string][]>([]);

    const selectCurrentFilter = (k: string, v: string) => {
        setFilters(filters.concat([[k, v]]));
        navigateTo(k, v);
        setCurrentFilter(['', '']);
    };

    const [fields, dropdownMap] = getFields(searchParams, filter);

    useEffect(() => {
        // TODO review problem: We cannot recover the translation from the url params,
        // so we currently use someFieldName:someFieldValue items here, which matches
        // the URL, but is different from behaviour of Field Desktop
        setFilters(extractFiltersFromSearchParams(searchParams));
    }, [searchParams]);

    return (<>
        <ExistingFilters
          filters={ filters }
          setFilters={ setFilters }
          navigateTo={ navigateTo }
          fields={ fields }
          dropdownMap={ dropdownMap } />
        <InputGroup>
            <DropdownButton
                id="field-filters-dropdown"
                title={ currentFilter[0] ? currentFilter[1] : t('fieldFilters.select') }>
                    <DropdownItems
                        fields={ fields }
                        searchParams={ searchParams }
                        currentFilter={ currentFilter[0] }
                        setCurrentFilter={ setCurrentFilter } />
            </DropdownButton>
            { currentFilter[0] && <>
                { dropdownMap[currentFilter[0]]
                    ? <InnerDropdown
                        dropdownMap={ dropdownMap }
                        currentFilter={ currentFilter }
                        selectCurrentFilter={ selectCurrentFilter } />
                    : <><Form.Control aria-label="Text input with dropdown button"
                        onChange={ e => setCurrentFilterText(e.target.value) } />
                        <Button onClick={ () => selectCurrentFilter(currentFilter[0], currentFilterText) }>
                            +
                        </Button>
                    </> }
                
            </>}
        </InputGroup>
    </>);
}


function InnerDropdown({ dropdownMap, currentFilter, selectCurrentFilter }:
    { dropdownMap: unknown, currentFilter: [string, string],
        selectCurrentFilter: (k: string, v: string) => void }): ReactElement {

    const { t } = useTranslation();

    const [selected, setSelected] = useState<string>('');

    return <><DropdownButton id="field-filters-inner-dropdown" title={ selected || t('fieldFilters.select') }>
        { Object.keys(dropdownMap[currentFilter[0]].values).map(k =>
            <Dropdown.Item
                key={ k }
                onClick={ () => setSelected(k) }>
                { getTranslation(dropdownMap[currentFilter[0]].values[k].label) }
            </Dropdown.Item>) }
        </DropdownButton>
        <Button onClick={ () => selectCurrentFilter(currentFilter[0] + '.name', selected) }>
            +
        </Button>
    </>;
}


function ExistingFilters({ filters, setFilters, navigateTo, fields, dropdownMap }: { filters: [string, string][],
    setFilters: React.Dispatch<React.SetStateAction<[string, string][]>>, navigateTo: (k: string, v: string) => void,
    fields: Field[], dropdownMap: Map<Field> }) {

    return <ul>
            { filters.map(filter => {
                const isDropdown = filter[0].endsWith('.name');
                const filterName = filter[0].replace('.name', '');
                const fieldName = getTranslation(fields.find(field => field.name === filterName).label);
                const fieldValue = isDropdown
                    ? getTranslation(dropdownMap[filterName]['values'][filter[1]].label)
                    : filter[1];
                return <li
                        key={ 'existing-filter::' + filter[0] }
                        onClick={ () => {
                            setFilters(filters.filter(f => filter[0] !== f[0]));
                            navigateTo(filter[0], filter[1]);
                        } }>
                    { fieldName + ':' + fieldValue }
                </li>; })}
   </ul>;
}


function DropdownItems({ fields, searchParams, currentFilter, setCurrentFilter }: { fields: Field[],
    searchParams: URLSearchParams, currentFilter: string,
    setCurrentFilter: React.Dispatch<React.SetStateAction<[string, string]>> }) {

    return <>{ fields
        .filter(field => !searchParams.has('resource.' + field.name))
        .map(field =>
            <Dropdown.Item key={ field.name }
                        active={ field.name === currentFilter }
                        onClick={ () => setCurrentFilter([field.name, getTranslation(field.label)]) }>
                { getTranslation(field.label) }
            </Dropdown.Item>)
    }</>;
}


const extractFiltersFromSearchParams = (searchParams: URLSearchParams) =>
    searchParams
        .toString()
        .split('&')
        .filter(param => param.startsWith('resource.'))
        .map(param => param.replace('resource.', ''))
        .filter(param => !param.startsWith('category'))
        .map(param => param.split('=')) as undefined as [string, string][];


const getFieldsForActiveCategory = (searchParams: URLSearchParams, filter: ResultFilter): Field[] => {

    const filterBucket = findFilterBucket(searchParams.get('resource.category.name'), filter.values);
    if (!filterBucket) return [];
    
    const groups = filterBucket.value.groups;
    if (!groups) return [];

    return flatten(groups.map(group => group.fields));
};


const getFields = (searchParams: URLSearchParams, filter: ResultFilter): [Field[], Map<Field>] => {

    const allFields = getFieldsForActiveCategory(searchParams, filter);

    const dropdownMap = {};
    allFields
        .filter(field => field.inputType === 'dropdown')
        .map(field => [field.name, field['valuelist']])
        .forEach(([fieldName, valuelist]: [string, unknown]) => dropdownMap[fieldName] = valuelist);

    const fields = allFields
        .filter(field => field.inputType === 'input' || field.inputType === 'dropdown');

    return [fields, dropdownMap];
};


const findFilterBucket = (match: string, t: (FilterBucketTreeNode|FilterBucket)[]): FilterBucket|undefined => {

    const result: FilterBucketTreeNode = Tree.find(t as undefined as Forest<FilterBucket>,
        item => item.value.name === match );
    return result ? result.item : undefined;
};
