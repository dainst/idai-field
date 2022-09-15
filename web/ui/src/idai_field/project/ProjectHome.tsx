import { mdiEmail, mdiMapMarker, mdiWeb } from '@mdi/js';
import Icon from '@mdi/react';
import { Location } from 'history';
import { TFunction } from 'i18next';
import { Literature } from 'idai-field-core';
import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Document, FieldValue, getDocumentImages, getFieldValue } from '../../api/document';
import { get, search } from '../../api/documents';
import { buildProjectQueryTemplate, parseFrontendGetParams, Query } from '../../api/query';
import { Result, ResultDocument, ResultFilter } from '../../api/result';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants';
import { getDocumentPermalink } from '../../shared/document/document-utils';
import DocumentPermalinkButton from '../../shared/document/DocumentPermalinkButton';
import LicenseInformationButton from '../../shared/document/LicenseInformationButton';
import { ImageCarousel } from '../../shared/image/ImageCarousel';
import { useSearchParams } from '../../shared/location';
import { LoginContext } from '../../shared/login';
import SearchBar from '../../shared/search/SearchBar';
import { EXCLUDED_CATEGORIES } from '../constants';
import CategoryFilter from '../filter/CategoryFilter';
import ProjectHierarchyButton from './ProjectHierarchyButton';
import ProjectMap from './ProjectMap';


const MAP_FIT_OPTIONS = { padding : [ 10, 10, 10, 10 ], duration: 500 };


export default function ProjectHome ():ReactElement {

    const { projectId } = useParams<{ projectId: string }>();
    const loginData = useContext(LoginContext);
    const searchParams = useSearchParams();
    const location = useLocation();
    const { t } = useTranslation();

    const [categoryFilter, setCategoryFilter] = useState<ResultFilter>();
    const [typeCatalogCount, setTypeCatalogCount] = useState<number>(0);
    
    const [projectDoc, setProjectDoc] = useState<Document>();
    const [title, setTitle] = useState<string>('');
    const [images, setImages] = useState<ResultDocument[]>();
    const [highlightedCategories, setHighlightedCategories] = useState<string[]>([]);
    const [predecessors] = useState<ResultDocument[]>([]);

    useEffect(() => {

        initFilters(projectId, searchParams, loginData.token)
            .then(result => result.filters.find(filter => filter.name === 'resource.category.name'))
            .then(setCategoryFilter);

        checkTypeCatalogs(projectId, searchParams, loginData.token)
            .then(result => setTypeCatalogCount(result.size));

        get(projectId, loginData.token)
            .then(setProjectDoc);
    }, [projectId, loginData, searchParams]);

    useEffect(() => {

        if (projectDoc) {
            setImages(getDocumentImages(projectDoc));
            setTitle(getProjectTitle(projectDoc));
        }
    }, [projectDoc, projectId]);
 
    if (!projectDoc || !categoryFilter) return null;
    
    return (
        <div className="d-flex flex-column p-2" style={ containerStyle }>
            { renderTitle(title, projectDoc) }
            <div className="d-flex flex-fill pt-2" style={ { height: 0 } }>
                { renderSidebar(projectId, projectDoc, categoryFilter, setHighlightedCategories, t, typeCatalogCount) }
                { renderContent(projectId, projectDoc, images, location, highlightedCategories, predecessors, t) }
            </div>
        </div>
    );
}


const renderTitle = (title: string, projectDoc: Document) =>
    <div className="d-flex p-2 m-2" style={ headerStyle }>
        <div className="flex-fill">
            <h2><img src="/marker-icon.svg" alt="Home" style={ homeIconStyle } /> {title}</h2>
        </div>
        <div className="text-right" style={ buttonsStyle }>
            <LicenseInformationButton license={ projectDoc.resource.license } />
            <DocumentPermalinkButton url={ getDocumentPermalink(projectDoc) } />
        </div>
    </div>;


const renderSidebar = (projectId: string, projectDoc: Document, categoryFilter: ResultFilter,
        setHighlightedCategories: (categories: string[]) => void, t: TFunction, typeCatalogCount: number) =>
    <div className="mx-2 d-flex flex-column" style={ sidebarStyles }>
        <Card className="mb-2 mt-0">
            <SearchBar basepath={ `/project/${projectId}/search` } />
        </Card>
        <Card className="mb-2 mt-0 p-2">
            <ProjectHierarchyButton projectDocument={ projectDoc }
                label={ t('projectHome.toHierarchicalView') } />
        </Card>
        { typeCatalogCount > 0 &&

        <Card className="mb-2 mt-0 p-2">
            <Link to={ `/type/${projectId}` } className="document-teaser">
                <div className="d-flex teaser-container teaser-small link">
                    { t('projectHome.showAllCatalogs', {count: typeCatalogCount}) }
                </div>
            </Link>
        </Card>
        }
        
        <Card className="my-0 flex-fill" style={ { height: 0 } }>
            <div className="py-1 card-header">
                <h5>{ t('projectHome.categories') }</h5>
            </div>
            <div className="flex-fill py-2" style={ filterColStyle }>
                <CategoryFilter filter={ categoryFilter } projectId={ projectId } projectView="search"
                    onMouseEnter={ setHighlightedCategories }
                    onMouseLeave={ setHighlightedCategories } />
            </div>
        </Card>
    </div>;


const renderContent = (projectId: string, projectDoc: Document, images: ResultDocument[], location: Location,
        highlightedCategories: string[], predecessors: ResultDocument[], t: TFunction) => {

    const description = getFieldValue(projectDoc, 'description');

    return <div className="flex-fill" style={ contentStyle }>
        <div className="px-2 my-1 clearfix">
            { images &&
                <div className="float-right p-2">
                    <ImageCarousel document={ projectDoc } images={ images } style={ imageCarouselStyle }
                        location={ location } maxWidth={ 600 } maxHeight={ 400 } />
                </div>
            }
            { description && renderDescription(description as string) }
        </div>
        <div className="d-flex">
            <div className="p-2" style={ mapContainerStyle }>
                <ProjectMap
                        selectedDocument={ projectDoc }
                        highlightedCategories={ highlightedCategories }
                        predecessors={ predecessors }
                        project={ projectId }
                        onDeselectFeature={ undefined }
                        fitOptions={ MAP_FIT_OPTIONS }
                        spinnerContainerStyle={ mapSpinnerContainerStyle }
                        isMiniMap={ true } />
            </div>
            <div className="p-2" style={ detailsContainerStyle }>
                { renderProjectDetails(projectDoc, t) }
            </div>
        </div>
    </div>;
};


const renderDescription = (description: string) =>
    description.toString()
        .split(/\r\n|\n\r|\r|\n/g)
        .filter(paragraph => paragraph.length > 0)
        .map((paragraph, i) => <ReactMarkdown key={ i } linkTarget={ '_blank' }>{ paragraph }</ReactMarkdown>);


const renderProjectDetails = (projectDoc: Document, t: TFunction) => {
    
    const contactMail: FieldValue = getFieldValue(projectDoc, 'contactMail');
    const homepage: FieldValue = getFieldValue(projectDoc, 'externalReference');
    const gazetteerId: FieldValue = getFieldValue(projectDoc, 'gazId');

    
    return <dl>
        <dt>{ t('projectHome.institution') }</dt>
        <dd>{ getFieldValue(projectDoc, 'institution')?.toString() }</dd>
        <dt>{ t('projectHome.projectSupervisor') }</dt>
        <dd>{ getFieldValue(projectDoc, 'projectSupervisor')?.toString() }</dd>
        <dt>{ t('projectHome.contactPerson') }</dt>
        { contactMail && <dd>
            <a href={ `mailto:${contactMail.toString()}` }>
                <Icon path={ mdiEmail } size={ 0.8 } className="mr-1" />
                { getFieldValue(projectDoc, 'contactPerson')?.toString() }
            </a>
        </dd> }
        <dt>{ t('projectHome.staff') }</dt>
        <dd>{ (getFieldValue(projectDoc, 'staff') as FieldValue[])?.join(', ') }</dd>
        { (homepage || gazetteerId) && <dt>{ t('projectHome.links') }</dt> }
        <dd>
            <ul className="list-unstyled" style={ listStyle }>
                { homepage && <li>
                    <a href={ `${homepage.toString()}` }
                            target="_blank" rel="noreferrer">
                        <Icon path={ mdiWeb } size={ 0.8 } className="mr-1" />
                        { t('projectHome.externalReference') }
                    </a>
                </li> }
                { gazetteerId && <li>
                    <a href={ 'https://gazetteer.dainst.org/place/' + gazetteerId.toString() }
                            target="_blank" rel="noreferrer">
                        <Icon path={ mdiMapMarker } size={ 0.8 } className="mr-1" />
                        { t('projectHome.gazId') }
                    </a>
                </li> }
            </ul>
        </dd>
        { renderBibliographicReferences(projectDoc, t) }
    </dl>;
};


const renderBibliographicReferences = (projectDocument: Document, t: TFunction) => {
    
    const bibliographicReferences: Literature[]
        = getFieldValue(projectDocument, 'bibliographicReferences') as Literature[];
    if (!bibliographicReferences) return <></>;

    return <>
        <dt>{ t('projectHome.bibliography') }</dt>
        <dd>
            <ul className="list-unstyled" style={ listStyle }>
                { bibliographicReferences.map(renderBibliographicReference) }
            </ul>
        </dd>
    </>;
};


const renderBibliographicReference = (bibliographicReference: Literature, index: number) => {

    // TODO Use newest Literature typings from idai-field-core
    return <li key={ `bibliographic-reference-${index}` }>
        <a href={ bibliographicReference['doi'] }
            target="_blank" rel="noopener noreferrer">
            { bibliographicReference.quotation }
        </a>
    </li>;
};


const initFilters = async (id: string, searchParams: URLSearchParams, token: string): Promise<Result> => {

    let query = buildProjectQueryTemplate(id, 0, 0, EXCLUDED_CATEGORIES);
    query = parseFrontendGetParams(searchParams, query);
    return search(query, token);
};

const checkTypeCatalogs = async (id: string, searchParams: URLSearchParams, token: string): Promise<Result> => {

    let query = {
        size: 0,
        from: 0,
        filters: [
            { field: 'project', value: id },
            { field: 'resource.category.name', value: 'TypeCatalog' }
        ]
    } as Query;
    query = parseFrontendGetParams(searchParams, query);
    return search(query, token);
};


const getProjectTitle = (projectDocument: Document): string => {

    return projectDocument.resource.shortDescription
        ?? projectDocument.resource.shortName
        ?? projectDocument.resource.identifier;
};


const containerStyle: CSSProperties = {
    height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
};

const headerStyle: CSSProperties = {
    color: 'var(--main-link-color)',
    borderBottom: '4px dotted var(--main-link-color)'
};

const buttonsStyle: CSSProperties = {
    display: 'flex',
    flex: '0 0 45px',
    alignItems: 'center',
    position: 'relative',
    bottom: '4px',
    height: '38px',
};

const sidebarStyles: CSSProperties = {
    width: `${SIDEBAR_WIDTH}px`,
    flexShrink: 0
};

const filterColStyle: CSSProperties = {
    overflowY: 'auto'
};

const imageCarouselStyle: CSSProperties = {
    background: '#d3d3cf',
    width: '30vw',
    maxWidth: '600px',
    maxHeight: '400px'
};

const contentStyle: CSSProperties = {
    overflowY: 'auto'
};

const listStyle: CSSProperties = {
    marginBottom: 0
};

const mapContainerStyle: CSSProperties = {
    flex: '1 1 50%',
    height: '30vw',
    maxHeight: '40vw',
    position: 'relative'
};

const detailsContainerStyle: CSSProperties = {
    flex: '1 1 50%'
};

const mapSpinnerContainerStyle: CSSProperties = {
    position: 'absolute',
    top: '45%',
    left: '45%',
    zIndex: 1
};

const homeIconStyle: CSSProperties = {
    height: '1.5rem',
    width: '1.5rem',
    marginTop: '-0.3rem'
};