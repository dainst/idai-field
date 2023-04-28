import React, { CSSProperties, ReactElement, ReactNode, useState, useEffect } from 'react';
import { Col, Dropdown, DropdownButton, Row, Button, InputGroup, Form } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import { flatten } from 'tsfun';
import { Tree, Forest } from 'idai-field-core';
import { FilterBucketTreeNode, FilterBucket, ResultFilter } from '../../api/result';
import CategoryIcon from '../../shared/document/CategoryIcon';
import { getLabel } from '../../shared/languages';
import { ProjectView } from '../project/Project';
import CloseButton from './CloseButton';
import { buildParamsForFilterValue, isFilterValueInParams } from './utils';


export default function CategoryFilter({ filter, searchParams = new URLSearchParams(), projectId, projectView,
        onMouseEnter, onMouseLeave }: { filter: ResultFilter, searchParams?: URLSearchParams, projectId?: string,
        projectView?: ProjectView, onMouseEnter?: (categories: string[]) => void,
        onMouseLeave?: (categories: string[]) => void }): ReactElement {

    if (!filter.values.length) return null;

    return <div onMouseLeave={ () => onMouseLeave && onMouseLeave([]) }>
        { filter.values.map((bucket: FilterBucketTreeNode) =>
            renderFilterValue(filter.name, bucket, searchParams, onMouseEnter, projectId, projectView)) }

        { false && // TODO remove later
            (projectId && projectView)
            && (searchParams.getAll('resource.category.name').length === 1)
            &&
            <InputFieldFilters
              projectId={ projectId }
              projectView={ projectView }
              searchParams={ searchParams }
              filter={ filter } />
        }
    </div>;
}

function InputFieldFilters({ projectId, projectView, searchParams, filter }: { projectId: string,
    projectView: ProjectView, searchParams: URLSearchParams, filter: ResultFilter}) {

    const history = useHistory();

    const [currentFilter, setCurrentFilter] = useState<string>('');
    const [currentFilterText, setCurrentFilterText] = useState<string>('');
    const [filters, setFilters] = useState<[string,string][]>([]);

    const fieldNames = getInputFieldNames(searchParams, filter);

    useEffect(() => {

        const params = searchParams
            .toString()
            .split('&')
            .filter(param => param.startsWith('resource.'))
            .map(param => param.replace('resource.', ''))
            .filter(param => !param.startsWith('category'))
            .map(param => param.split("="));
        setFilters(params as undefined as [string, string][]);

    }, [searchParams])

    return (<>
        <ul>
            { filters.map(filter => <li key={ filter[0] }>{filter[0] + ':' + filter[1]}</li>)}
        </ul>
        <InputGroup>
            <DropdownButton
            id="basicbutton"
            title={ currentFilter !== '' ? currentFilter : 'Auswählen' }>
                {
                    fieldNames.map(fieldName =>
                        <Dropdown.Item key={ fieldName }
                                    active={ fieldName === currentFilter }
                                    onClick={ () => setCurrentFilter(fieldName) }>
                            { fieldName }
                        </Dropdown.Item>)
                }
            
            </DropdownButton>
            { currentFilter && <>
                <Form.Control aria-label="Text input with dropdown button"
                              onChange={ e => setCurrentFilterText(e.target.value) } />
                <Button onClick={ () => { setFilters(filters.concat([[currentFilter, currentFilterText]]));
                    history.push(`/project/${projectId}/${projectView}?`
                    + buildParamsForFilterValue(searchParams, 'resource.' + currentFilter, currentFilterText)); } }>
                        Add
                </Button>
            </>}
        </InputGroup>
    </>);
}


const getInputFieldNames = (searchParams: URLSearchParams, filter: ResultFilter) => {

    const filterBucket = findFilterBucket(searchParams.get('resource.category.name'), filter.values);
    if (!filterBucket) return [];
    
    const groups = filterBucket.value['groups'];
    if (!groups) return [];

    const fields = groups.map(group => group['fields']);

    return (flatten(fields) as unknown as { inputType: string, name: string }[])
        .filter(field => field.inputType === 'input')
        .map(field => field.name);
};


const findFilterBucket = (match: string, t: (FilterBucketTreeNode|FilterBucket)[]): FilterBucket|undefined => {

    const result: FilterBucketTreeNode = Tree.find(t as undefined as Forest<FilterBucket>,
        item => item.value.name === match );
    return result ? result.item : undefined;
};


const renderFilterValue = (key: string, bucket: FilterBucketTreeNode, params: URLSearchParams,
        onMouseEnter?: (categories: string[]) => void, projectId?: string, projectView?: ProjectView,
        level: number = 1): ReactNode => {
    return <React.Fragment key={ bucket.item.value.name }>

        <Dropdown.Item
                as={ Link }
                style={ filterValueStyle(level) }
                onMouseOver={ () => onMouseEnter && onMouseEnter(getCategoryAndSubcategoryNames(bucket)) }
                to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
                    + buildParamsForFilterValue(params, key, bucket.item.value.name) + '' }>
            <Row>
                <Col xs={ 1 }><CategoryIcon category={ bucket.item.value }
                                            size="30" /></Col>
                <Col style={ categoryLabelStyle }>
                    { getLabel(bucket.item.value) }
                    {
                        isFilterValueInParams(params, key, bucket.item.value.name)
                        && <CloseButton params={ params } filterKey={ key } value={ bucket.item.value.name }
                                        projectId={ projectId } projectView={ projectView } />
                    }
                </Col>
                <Col xs={ 1 } style={ { margin: '3px' } }>
                    <span className="float-right"><em>{ bucket.item.count }</em></span>
                </Col>
            </Row>
        </Dropdown.Item>
        { bucket.trees && bucket.trees.map((b: FilterBucketTreeNode) =>
            renderFilterValue(key, b, params, onMouseEnter, projectId, projectView, level + 1))
        }
    </React.Fragment>;
    };


const getCategoryAndSubcategoryNames = (bucket: FilterBucketTreeNode): string[] => {

    return [bucket.item.value.name].concat(
        flatten(bucket.trees.map(subBucket => getCategoryAndSubcategoryNames(subBucket)))
    );
};


const filterValueStyle = (level: number): CSSProperties => ({
    paddingLeft: `${level * 1.2}em`
});


const categoryLabelStyle: CSSProperties = {
    margin: '3px 10px',
    whiteSpace: 'normal'
};
