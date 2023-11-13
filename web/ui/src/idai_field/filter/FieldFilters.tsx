import { mdiCloseCircle } from '@mdi/js';
import Icon from '@mdi/react';
import React, { useState, ReactElement } from 'react';
import { Dropdown, DropdownButton, Button, InputGroup, Form, Row, Col } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { Tree, Forest } from 'idai-field-core';
import { Field } from '../../api/document';
import { flatten, Map } from 'tsfun';
import { ResultFilter, FilterBucket, FilterBucketTreeNode } from '../../api/result';
import { ProjectView } from '../project/Project';
import { buildParamsForFilterValue } from './utils';
import { getTranslation } from '../../shared/languages';
import { useTranslation } from 'react-i18next';


export default function FieldFilters({ projectId, projectView, searchParams, filter, filters,
    setFilters, filterValuesCount }: {
    projectId: string, projectView: ProjectView, searchParams: URLSearchParams, filter: ResultFilter,
    filterValuesCount: number,
    filters: [string, string][], setFilters: React.Dispatch<React.SetStateAction<[string, string][]>>}): ReactElement {

    const { t } = useTranslation();
    
    const history = useHistory();
    const navigateTo = (k: string, v: string) => history.push(`/project/${projectId}/${projectView}?`
        + buildParamsForFilterValue(searchParams, k, v));

    const [currentFilter, setCurrentFilter] = useState<[string, string]>(['', '']);
    const [currentFilterText, setCurrentFilterText] = useState<string>('');

    const selectCurrentFilter = (k: string, v: string) => {
        setFilters(filters.concat([[k, v]]));
        navigateTo(k, v);
        setCurrentFilter(['', '']);
    };

    const [fields, dropdownMap] = getFields(searchParams, filter);

    return (<>
        <ExistingFilters
          filters={ filters }
          setFilters={ setFilters }
          navigateTo={ navigateTo }
          fields={ fields }
          dropdownMap={ dropdownMap } />
        { filterValuesCount > 0 &&
        <InputGroup>
            <DropdownButton
                id="field-filters-dropdown"
                title={ shortenString(currentFilter[0] ? currentFilter[1] : t('fieldFilters.select')) }>
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
                        value={ currentFilterText }
                        onChange={ e => setCurrentFilterText(e.target.value.replace(/[^a-zA-Z0-9]*/g, '')) } />
                        <Button onClick={ () => selectCurrentFilter(currentFilter[0], currentFilterText) }>
                            +
                        </Button>
                    </> }
                
            </>}
        </InputGroup> }
    </>);
}


function InnerDropdown({ dropdownMap, currentFilter, selectCurrentFilter }:
    { dropdownMap: unknown, currentFilter: [string, string],
        selectCurrentFilter: (k: string, v: string) => void }): ReactElement {

    const { t } = useTranslation();

    const [selected, setSelected] = useState<string>('');

    return <><DropdownButton 
            id="field-filters-inner-dropdown" 
            title={ shortenString(selected || t('fieldFilters.select')) }>
        { Object.keys(dropdownMap[currentFilter[0]].values).map(k =>
            <Dropdown.Item
                key={ k }
                onClick={ () => setSelected(k) }>
                { getTranslation(dropdownMap[currentFilter[0]].values[k].label) }
            </Dropdown.Item>) }
        </DropdownButton>
        <Button onClick={ () => selectCurrentFilter(currentFilter[0], selected) }>
            +
        </Button>
    </>;
}


function ExistingFilters({ filters, setFilters, navigateTo, fields, dropdownMap }: { filters: [string, string][],
    setFilters: React.Dispatch<React.SetStateAction<[string, string][]>>, navigateTo: (k: string, v: string) => void,
    fields: Field[], dropdownMap: Map<Field> }) {

    return <><hr></hr><ul>
            { filters.map(([k, v]) => {
                const filterName = k
                    .replace('%3A', ':');
                const isDropdown = dropdownMap[filterName];
                const field = fields.find(field => field.name === filterName);
                if (!field) return null; // for example for the parent=root param
                const fieldName = translate(field);
                const fieldValue = isDropdown
                    ? getTranslation(dropdownMap[filterName]['values'][v].label)
                    : v;
                return <Row
                        key={ 'existing-filter::' + k }
                        style={ { position: 'relative', left: '-22px' } }>
                    <Col>
                    { (fieldName.includes(':') ? '\'' + fieldName + '\'' : fieldName) + ': "' + fieldValue + '"'}
                    </Col>
                    <Col xs={ 1 }
                        style={ { margin: '3px' } }>
                        <span
                            className="float-right"
                            style={ { color: 'red' } }
                            onClick={ () => {
                                setFilters(filters.filter(f => filterName !== f[0]));
                                navigateTo(k, v);
                            } }>
                            <Icon path={ mdiCloseCircle } size={ 0.8 } />
                        </span>
                    </Col>
                </Row>; })}
   </ul></>;
}


function DropdownItems({ fields, searchParams, currentFilter, setCurrentFilter }: { fields: Field[],
    searchParams: URLSearchParams, currentFilter: string,
    setCurrentFilter: React.Dispatch<React.SetStateAction<[string, string]>> }) {

    return <>{ fields
        .filter(field => !searchParams.has(field.name))
        .map(field => <Dropdown.Item key={ field.name }
                        active={ field.name === currentFilter }
                        onClick={ () => setCurrentFilter([field.name, translate(field)]) }>
                { translate(field) }
            </Dropdown.Item> )
    }</>;
}


const translate = (field: Field) => getTranslation(field.label) || field.name;


const getFieldsForActiveCategory = (searchParams: URLSearchParams, filter: ResultFilter): Field[] => {

    const filterBucket = findFilterBucket(searchParams.get('category'), filter.unfilteredValues);
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

const shortenString = (s: string) => {

    const maxLength = 15;
    if (s.length > maxLength) {
        return s.substring(0, maxLength) + "…";
    } 
    return s;
};
