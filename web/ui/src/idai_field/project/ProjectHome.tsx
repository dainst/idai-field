import { mdiEmail, mdiMapMarker, mdiWeb } from '@mdi/js';
import { mdiViewGrid } from '@mdi/js';
import Icon from '@mdi/react';
import { Location } from 'history';
import { TFunction } from 'i18next';
import { Literature } from 'idai-field-core';
import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { I18N } from 'idai-field-core';
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
import { getTranslation } from '../../shared/languages';


const MAP_FIT_OPTIONS = { padding : [ 10, 10, 10, 10 ], duration: 500 };


export default function ProjectHome(): ReactElement {

    const { projectId } = useParams<{ projectId: string }>();
    const loginData = useContext(LoginContext);
    const searchParams = useSearchParams();
    const location = useLocation();
    const { t } = useTranslation();

    const [categoryFilter, setCategoryFilter] = useState<ResultFilter>();
    const [typeCatalogCount, setTypeCatalogCount] = useState<number>(0);
    const [typeCatalogId, setTypeCatalogId] = useState<string>(null);
    
    const [projectDocument, setProjectDocument] = useState<Document>();
    const [title, setTitle] = useState<string>('');
    const [images, setImages] = useState<ResultDocument[]>();
    const [highlightedCategories, setHighlightedCategories] = useState<string[]>([]);
    const [predecessors] = useState<ResultDocument[]>([]);

    useEffect(() => {

        initFilters(projectId, searchParams, loginData.token)
            .then(result => result.filters.find(filter => filter.name === 'resource.category.name'))
            .then(setCategoryFilter);

        checkTypeCatalogs(projectId, searchParams, loginData.token)
            .then(result => {
                setTypeCatalogId(result.size === 1 ? result.documents[0].resource.id : null);
                setTypeCatalogCount(result.size);
            });

        get(projectId, loginData.token)
            .then(setProjectDocument);
    }, [projectId, loginData, searchParams]);

    useEffect(() => {

        if (projectDocument) {
            setImages(getDocumentImages(projectDocument));
            setTitle(getProjectTitle(projectDocument));
        }
    }, [projectDocument, projectId]);
 
    if (!projectDocument || !categoryFilter) return null;
    
    return (
        <div className="d-flex flex-column p-2" style={ containerStyle }>
            { renderTitle(title, projectDocument) }
            <div className="d-flex flex-fill pt-2" style={ { height: 0 } }>
                { renderSidebar(projectId, projectDocument, categoryFilter, setHighlightedCategories, t,
                    typeCatalogCount, typeCatalogId) }
                { renderContent(projectId, projectDocument, images, location, highlightedCategories, predecessors, t) }
            </div>
        </div>
    );
}


const renderTitle = (title: string, projectDocument: Document) => {

    // TODO review
    const titleStr: string = getTranslation(title as undefined as I18N.String);

    return (<div className="d-flex p-2 m-2" style={ headerStyle }>
            <div className="flex-fill">
                <h2><img src="/marker-icon.svg" alt="Home" style={ homeIconStyle } /> {titleStr}</h2>
            </div>
            <div className="text-right" style={ buttonsStyle }>
                <LicenseInformationButton license={ projectDocument.resource.license } />
                <DocumentPermalinkButton url={ getDocumentPermalink(projectDocument) } />
            </div>
        </div>);
};

const renderSidebar = (projectId: string, projectDocument: Document, categoryFilter: ResultFilter,
        setHighlightedCategories: (categories: string[]) => void, t: TFunction, typeCatalogCount: number,
        typeCatalogId: string) =>
    <div className="mx-2 d-flex flex-column" style={ sidebarStyles }>
        <Card className="mb-2 mt-0">
            <SearchBar basepath={ `/project/${projectId}/search` } />
        </Card>
        <Card className="mb-2 mt-0 p-2">
            <ProjectHierarchyButton projectDocument={ projectDocument }
                label={ t('projectHome.toHierarchicalView') } />
        </Card>
        { typeCatalogCount === 1 &&
        <Card className="mb-2 mt-0 p-2">
            <Link to={ `/type/${projectId}/${typeCatalogId}` } className="document-teaser">
                <div className="d-flex teaser-container teaser-small link">
                    <div>
                        <Icon path={ mdiViewGrid } size={ 0.8 } color="black" />
                    </div>
                    <h3 className="mx-2 my-1" style={ homeHeadingStyle }>
                        { t('projectHome.showCatalog') }
                    </h3>
                </div>
            </Link>
        </Card>
        }
        { typeCatalogCount > 1 &&
        <Card className="mb-2 mt-0 p-2">
            <Link to={ `/type/${projectId}` } className="document-teaser">
                <div className="d-flex teaser-container teaser-small link">
                    <div>
                        <Icon path={ mdiViewGrid } size={ 0.8 } color="black" />
                    </div>
                    <h3 className="mx-2 my-1" style={ homeHeadingStyle }>
                        { t('projectHome.showAllCatalogs', { count: typeCatalogCount }) }
                    </h3>
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


const renderContent = (projectId: string, projectDocument: Document, images: ResultDocument[], location: Location,
        highlightedCategories: string[], predecessors: ResultDocument[], t: TFunction) => {

    const description: string = getTranslation(getFieldValue(projectDocument, 'description') as undefined);

    return <div className="flex-fill" style={ contentStyle }>
        <div className="px-2 my-1 clearfix">
            { images &&
                <div className="float-right p-2">
                    <ImageCarousel document={ projectDocument } images={ images } style={ imageCarouselStyle }
                        location={ location } maxWidth={ 600 } maxHeight={ 400 } />
                </div>
            }
            { description && renderDescription(description as string) }
        </div>
        <div className="d-flex">
            <div className="p-2" style={ mapContainerStyle }>
                <ProjectMap
                        selectedDocument={ projectDocument }
                        highlightedCategories={ highlightedCategories }
                        predecessors={ predecessors }
                        project={ projectId }
                        projectDocument={ projectDocument }
                        onDeselectFeature={ undefined }
                        fitOptions={ MAP_FIT_OPTIONS }
                        spinnerContainerStyle={ mapSpinnerContainerStyle }
                        isMiniMap={ true } />
            </div>
            <div className="p-2" style={ detailsContainerStyle }>
                { renderProjectDetails(projectDocument, t) }
            </div>
        </div>
    </div>;
};


const renderDescription = (description: string) =>
    description.toString()
        .split(/\r\n|\n\r|\r|\n/g)
        .filter(paragraph => paragraph.length > 0)
        .map((paragraph, i) => <ReactMarkdown key={ i } linkTarget={ '_blank' }>{ paragraph }</ReactMarkdown>);


const renderProjectDetails = (projectDocument: Document, t: TFunction) => {
    
    const contactMail: FieldValue = getFieldValue(projectDocument, 'contactMail');
    const homepage: FieldValue = getFieldValue(projectDocument, 'externalReference');
    const gazetteerId: FieldValue = getFieldValue(projectDocument, 'gazId');

    const institution: string = getTranslation(getFieldValue(projectDocument, 'institution') as undefined);
    const projectSupervisor: string = getTranslation(getFieldValue(projectDocument, 'projectSupervisor') as undefined);
    const contactPerson: string = getTranslation(getFieldValue(projectDocument, 'contactPerson') as undefined);
    const staff: string =
        (getFieldValue(projectDocument, 'staff') as undefined[])
            .map(staff => getTranslation(staff))
            .join(', ');

    return <dl>
        <dt>{ t('projectHome.institution') }</dt>
        <dd>{ institution }</dd>
        <dt>{ t('projectHome.projectSupervisor') }</dt>
        <dd>{ projectSupervisor }</dd>
        <dt>{ t('projectHome.contactPerson') }</dt>
        { contactMail && <dd>
            <a href={ `mailto:${contactMail.toString()}` }>
                <Icon path={ mdiEmail } size={ 0.8 } className="mr-1" />
                { contactPerson }
            </a>
        </dd> }
        <dt>{ t('projectHome.staff') }</dt>
        <dd>{ staff }</dd>
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
        { renderBibliographicReferences(projectDocument, t) }
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

export const homeHeadingStyle: CSSProperties = {
    fontSize: '18px',
    color: 'black'
};
