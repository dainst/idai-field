import React, { CSSProperties, ReactElement, ReactNode, useState, useEffect } from 'react';
import { Col, Dropdown, Row } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import { flatten, identity } from 'tsfun';
import { FilterBucketTreeNode, ResultFilter } from '../../api/result';
import CategoryIcon from '../../shared/document/CategoryIcon';
import { getLabel } from '../../shared/languages';
import { ProjectView } from '../project/Project';
import CloseButton from './CloseButton';
import { buildParamsForFilterValue, isFilterValueInParams } from './utils';
import FieldFilters from './FieldFilters';
import { deleteFilterFromParams } from '../../api/query';


export default function CategoryFilter({ filter, searchParams = new URLSearchParams(), projectId, projectView,
        onMouseEnter, onMouseLeave, inPopover }: { filter: ResultFilter, searchParams?: URLSearchParams,
        projectId?: string, projectView?: ProjectView, onMouseEnter?: (categories: string[]) => void,
        onMouseLeave?: (categories: string[]) => void, inPopover: boolean }): ReactElement {

    const history = useHistory();

    const [filters, setFilters] = useState<[string,string][]>([]);
    const [category, setCategory] = useState<string|undefined>(undefined);

    const inProjectPopover = projectView !== 'overview' && inPopover;
    
    useEffect(() => {
        if (!inProjectPopover) return;

        const selectedCategories = searchParams.getAll('category');
        if (selectedCategories.length > 1) throw Error('IllegalState');
        const selectedCategory = searchParams.getAll('category')[0];

        if (category !== selectedCategory) {
            setCategory(selectedCategory);
            setFilters([]);
        } else {
            const newFilters = extractFiltersFromSearchParams(searchParams);
            if (!selectedCategory
                    && newFilters.length !== 0
                    && projectView === 'search') {
                
                const qVal = searchParams.getAll('q')[0];
                history.push(`/project/${projectId}/${projectView}?` + (qVal ? `q=${qVal}` : ''));
            } else {
                setFilters(newFilters);
            }
        }
    }, [searchParams, category, inProjectPopover, projectId, projectView, history]);

    const filterValues = filter.unfilteredValues;
    return <div onMouseLeave={ () => onMouseLeave && onMouseLeave([]) }>
        { filterValues
            .map((bucket: FilterBucketTreeNode) =>
                renderFilterValue(filter.name, bucket, searchParams, filters, category, projectId, projectView,
                    !category ? onMouseEnter : identity)) }

        { // false && // TODO remove
            projectId && projectView && inProjectPopover
            &&
            <FieldFilters
              projectId={ projectId }
              projectView={ projectView }
              searchParams={ searchParams }
              filter={ filter }
              filters={ filters }
              setFilters={ setFilters }
              filterValuesCount={ filterValues.length } />
        }
    </div>;
}


const buildParams = (params: URLSearchParams, key: string, bucket: FilterBucketTreeNode,
    filters: [string, string][]) => {

    const params_ = filters.reduce((acc, [k, v]) =>
        buildParamsForFilterValue(acc, k.replace('%3A', ':'), v), params);
    return buildParamsForFilterValue(deleteFilterFromParams(params_, key),
        key, bucket.item.value.name);
};


const renderFilterValue = (key: string, bucket: FilterBucketTreeNode, params: URLSearchParams,
        filters: [string, string][], category: string|undefined, projectId?: string, projectView?: ProjectView,
        onMouseEnter?: (categories: string[]) => void, level: number = 1): ReactNode => {

    const key_ = key === 'resource.category.name' ? 'category' : key;

    return <React.Fragment key={ bucket.item.value.name }>
        <Dropdown.Item
                as={ Link }
                style={ filterValueStyle(level, bucket.item.value.name, category ) }
                onMouseOver={ () => onMouseEnter && onMouseEnter(getCategoryAndSubcategoryNames(bucket)) }
                to={ ((projectId && projectView) ? `/project/${projectId}/${projectView}?` : '/?')
                    + buildParams(params, key_, bucket, filters) + '' }>
            <Row>
                <Col xs={ 1 }><CategoryIcon category={ bucket.item.value }
                                            size="30" /></Col>
                <Col style={ categoryLabelStyle }>
                    { getLabel(bucket.item.value) }
                    {
                        isFilterValueInParams(params, key_, bucket.item.value.name)
                        && <CloseButton params={ params } filterKey={ key_ } value={ bucket.item.value.name }
                                        projectId={ projectId } projectView={ projectView } />
                    }
                </Col>
                {
                    <Col xs={ 1 }
                        style={ { margin: '3px' } }>
                        <span className="float-right"><em>{ bucket.item.count }</em></span>
                    </Col>
                }
            </Row>
        </Dropdown.Item>
        { bucket.trees && bucket.trees.map((b: FilterBucketTreeNode) =>
            renderFilterValue(key_, b, params, filters, category, projectId, projectView,
                onMouseEnter, level + 1))
        }
    </React.Fragment>;
    };


const getCategoryAndSubcategoryNames = (bucket: FilterBucketTreeNode): string[] => {

    return [bucket.item.value.name].concat(
        flatten(bucket.trees.map(subBucket => getCategoryAndSubcategoryNames(subBucket)))
    );
};


const filterValueStyle = (level: number, name: string, category: string|undefined): CSSProperties => {
    const style = { paddingLeft: `${level * 1.2}em` } as CSSProperties;
    // By default if you click a category, it gets color #eceeef
    // If you reload the page or come from outside to a route
    // where a category is already selected, it does not have that background color.
    // Since it is not clear to me, by which magic it gets the color when you click the category,
    // I set it here manually if the category is selected. (ET)
    const isSelected = category === name;
    if (isSelected) style.backgroundColor = '#eceeef';
    // -
    return style;
};


const categoryLabelStyle: CSSProperties = {
    margin: '3px 10px',
    whiteSpace: 'normal'
};


const extractFiltersFromSearchParams = (searchParams: URLSearchParams) =>
    searchParams
        .toString()
        .split('&')
        .filter(param => !param.startsWith('resource'))
        .filter(param => !param.startsWith('category'))
        .filter(param => !param.startsWith('parent')) // TODO we probably also need to add 'r='
        .filter(param => !param.startsWith('q'))
        .map(param => param.split('='))
        // .filter is a hack for as of yet not further investigated problem
        .filter(([k, v]) => !(k === '' && v === undefined)) as undefined as [string, string][];
