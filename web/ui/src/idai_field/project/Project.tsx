import { History } from 'history';
import { TFunction } from 'i18next';
import React, { CSSProperties, ReactElement, Ref, useContext, useEffect, useRef, useState } from 'react';
import { Card } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Document, Field, FieldGroup } from '../../api/document';
import { get, search } from '../../api/documents';
import { buildProjectQueryTemplate, parseFrontendGetParams, Query } from '../../api/query';
import { ResultDocument, ResultFilter } from '../../api/result';
import CONFIGURATION from '../../configuration.json';
import { SIDEBAR_WIDTH } from '../../constants';
import DocumentCard from '../../shared/document/DocumentCard';
import DocumentHierarchy from '../../shared/documents/DocumentHierarchy';
import DocumentList from '../../shared/documents/DocumentList';
import LinkButton from '../../shared/linkbutton/LinkButton';
import { LoginContext } from '../../shared/login';
import NotFound from '../../shared/NotFound';
import { useGetChunkOnScroll } from '../../shared/scroll';
import SearchBar from '../../shared/search/SearchBar';
import { EXCLUDED_CATEGORIES } from '../constants';
import { getMapDeselectionUrl } from './navigation';
import ProjectBreadcrumb from './ProjectBreadcrumb';
import ProjectMap from './ProjectMap';
import { fetchProjectData, ProjectData } from './projectData';
import ProjectSidebar from './ProjectSidebar';
import Total from '../widgets/Total';


export const CHUNK_SIZE = 50;
const MAP_FIT_OPTIONS = { padding : [ 100, 100, 100, SIDEBAR_WIDTH + 100 ], duration: 500 };


export type ProjectView = 'search'|'hierarchy';


export default function Project(): ReactElement {

    const { projectId, documentId, view } = useParams<{ projectId: string, documentId: string, view: ProjectView }>();

    const location = useLocation();
    const history = useHistory();
    const loginData = useContext(LoginContext);
    const { t } = useTranslation();

    const [document, setDocument] = useState<Document>(null);
    const [documents, setDocuments] = useState<ResultDocument[]>([]);
    const [hoverDocument, setHoverDocument] = useState<ResultDocument>(null);
    const [mapHighlightedIds, setMapHighlightedIds] = useState<string[]>([]);
    const [mapHighlightedCategories, setMapHighlightedCategories] = useState<string[]>(null);
    const [predecessors, setPredecessors] = useState<ResultDocument[]>([]);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [filters, setFilters] = useState<ResultFilter[]>([]);
    const [total, setTotal] = useState<number>();

    const previousSearchParams = useRef(new URLSearchParams());
    const documentListRef = useRef<HTMLDivElement>();

    const { onScroll, resetScrollOffset } = useGetChunkOnScroll((newOffset: number) => search(
        buildQuery(projectId, new URLSearchParams(location.search), newOffset), loginData.token)
            .then(result => setDocuments(oldDocs => oldDocs.concat(result.documents)))
    );

    const resetScroll = () => {

        if (documentListRef.current) documentListRef.current.scrollTo(0, 0);
        resetScrollOffset();
    };

    useEffect(() => {

        const searchParams = new URLSearchParams(location.search);
        const parent: string = searchParams.get('parent');

        if (view === 'hierarchy' && !parent) {
            reloadWithParent(projectId, searchParams, documentId, loginData.token, history);
            return () => null;
        }

        const query: Query = (searchParams.toString() !== previousSearchParams.current.toString())
            ? buildQuery(projectId, searchParams, 0)
            : null;
        previousSearchParams.current = searchParams;
        const predecessorsId: string = isResource(parent) ? parent : documentId;

        fetchProjectData(loginData.token, query, documentId, predecessorsId).then(data => {
            const newPredecessors = getPredecessors(data, parent, documentId);

            unstable_batchedUpdates(() => {

                if (data.searchResult) {
                    setDocuments(data.searchResult.documents);
                    setTotal(data.searchResult.size);
                    setFilters(data.searchResult.filters);
                    resetScroll();
                }
                if (data.mapSearchResult) {
                    setMapHighlightedIds(
                        data.mapSearchResult.documents
                            ? data.mapSearchResult.documents.map(document => document.resource.id)
                            : []
                    );
                }

                if (data.selected && data.children.length > 0) {
                    // "Fake" field group in order to display child relations, translations are created
                    // on the fly because the data itself does not contain labels/descriptions for the relation
                    // like the regular fields of a resource.
                    data.selected.resource.groups.push({
                        name: 'Children',
                        fields: [
                            {
                                name: 'hasChildren',
                                targets: data.children,
                                description: { 'de': 'Kindbeziehung', 'en': 'Child relation' },
                                label: {
                                    'de': 'Enthält', 'en': 'Includes', 'es': 'Incluye', 'fr': 'Inclut', 'it': 'Include'
                                }
                            } as Field
                        ]
                    } as FieldGroup);
                }

                setDocument(data.selected);
                setPredecessors(newPredecessors);
                setHoverDocument(null);
            });
            if (documentId && !data.selected) setNotFound(true);
        });
        // eslint-disable-next-line
    }, [projectId, documentId, view, location.search, history, loginData]);

    const renderSidebarContent = () => {

        const searchParams = new URLSearchParams(location.search);

        const breadcrumbBox = renderBreadcrumb(projectId, predecessors);
        const totalBox = renderTotal(
            total, searchParams, view, !!document, filters, projectId, setMapHighlightedCategories
        );

        return document
            ? view === 'hierarchy'
                ? [breadcrumbBox, totalBox, renderDocumentDetails(document)]
                : [view === 'search' && totalBox, breadcrumbBox, renderDocumentDetails(document)]
            : view === 'hierarchy'
                ? [breadcrumbBox, totalBox, renderDocumentHierarchy(
                    documents, predecessors, searchParams, projectId, onScroll, setHoverDocument
                )]
                : [view === 'search' && totalBox, renderDocumentList(documents, searchParams, documentListRef,
                    onScroll, setHoverDocument, t)];
    };

    if (notFound) return <NotFound />;

    return <>
        <ProjectSidebar>
            <Card className="d-flex flex-row" style={ searchCardStyle }>
                <LinkButton to={ `/project/${projectId}` } variant="secondary" style={ homeButtonStyle }>
                    <img src="/marker-icon.svg" alt="Home" style={ homeIconStyle } />
                </LinkButton>
                <div style={ { flexGrow: 1 } }>
                    <SearchBar basepath={ `/project/${projectId}/search` } />
                </div>
            </Card>
            { renderSidebarContent() }
        </ProjectSidebar>
        <ProjectMap selectedDocument={ document }
            hoverDocument={ hoverDocument }
            highlightedIds={ mapHighlightedIds }
            highlightedCategories={ mapHighlightedCategories }
            predecessors={ predecessors }
            project={ projectId }
            onDeselectFeature={ () => deselectFeature(document, new URLSearchParams(location.search), view, history) }
            spinnerContainerStyle={ mapSpinnerContainerStyle }
            fitOptions={ MAP_FIT_OPTIONS }
            isMiniMap={ false } />
    </>;
}


const deselectFeature = (document: Document, searchParams: URLSearchParams, view: ProjectView, history: History) =>
    document && history.push(getMapDeselectionUrl(document.project, searchParams, view, document));


const renderDocumentDetails = (document: Document): React.ReactNode =>
    <DocumentCard key="documentCard" document={ document }
        baseUrl={ CONFIGURATION.fieldUrl }
        cardStyle={ mainSidebarCardStyle } />;


const renderDocumentHierarchy = (documents: ResultDocument[], predecessors: ResultDocument[],
        searchParams: URLSearchParams, projectId: string, onScroll: (e: React.UIEvent<Element, UIEvent>) => void,
        setHoverDocument: (document: ResultDocument) => void) =>
    <Card key="documentHierarchy" style={ mainSidebarCardStyle }>
        <DocumentHierarchy documents={ documents } predecessors={ predecessors } project={ projectId }
            searchParams={ searchParams } onScroll={ onScroll }
            onMouseEnter={ document => setHoverDocument(document) }
            onMouseLeave={ () => setHoverDocument(null) } />
    </Card>;


const renderBreadcrumb = (projectId: string, predecessors: ResultDocument[]) =>
    <Card key="projectBreadcrumb" className="p-2">
        <ProjectBreadcrumb projectId={ projectId } predecessors={ predecessors } />
    </Card>;


const renderDocumentList = (documents: ResultDocument[], searchParams: URLSearchParams,
        ref: Ref<HTMLDivElement>, onScroll: (e: React.UIEvent<Element, UIEvent>) => void,
        setHoverDocument: (document: ResultDocument) => void, t: TFunction) =>
    documents?.length
        ? <Card key="documentList" ref={ ref } onScroll={ onScroll } style={ mainSidebarCardStyle }>
            <DocumentList documents={ documents } searchParams={ searchParams }
                onMouseEnter={ document => setHoverDocument(document) }
                onMouseLeave={ () => setHoverDocument(null) } />
        </Card>
        : <Card key="noResults" style={ mainSidebarCardStyle } className="text-center p-5">
            <em>{ t('project.noResults') }</em>
        </Card>;


const renderTotal = (total: number, searchParams: URLSearchParams, view: ProjectView, asLink: boolean,
        filters: ResultFilter[], projectId: string,
        setMapHighlightedCategories: (categories: string[]) => void): ReactElement => {

    return <Total key="total" total={ total } searchParams={ searchParams } projectView={ view } asLink={ asLink }
        filters={ filters } projectId={ projectId } setMapHighlightedCategories={ setMapHighlightedCategories } />;
};


const reloadWithParent = async (projectId: string, searchParams: URLSearchParams, documentId: string,
        token: string, history: History) => {

    const document: Document|undefined = documentId ? await get(documentId, token) : undefined;
    searchParams.set('parent', document?.resource?.parentId || 'root');

    history.push(`/project/${projectId}/hierarchy${documentId ? `/${documentId}` : ''}?${searchParams.toString()}`);
};


const buildQuery = (projectId: string, searchParams: URLSearchParams, from: number): Query => {

    const query = buildProjectQueryTemplate(projectId, from, CHUNK_SIZE, EXCLUDED_CATEGORIES);
    return parseFrontendGetParams(searchParams, query);
};


const getPredecessors = (data: ProjectData, parent: string, documentId: string): ResultDocument[] => {

    const predecessors = data.predecessors;
    if (!isResource(parent) && documentId && predecessors.length > 0) {
        predecessors.pop();
    }
    return predecessors;
};


const isResource = (parent: string) => parent && parent !== 'root';


const mainSidebarCardStyle: CSSProperties = {
    overflow: 'hidden auto',
    flex: '1 1'
};

const mapSpinnerContainerStyle: CSSProperties = {
    position: 'absolute',
    top: '50vh',
    left: '50vw',
    transform: `translate(calc(-50% + ${SIDEBAR_WIDTH / 2}px), -50%)`,
    zIndex: 1
};

const searchCardStyle: CSSProperties = {
    backgroundColor: 'transparent'
};

const homeButtonStyle: CSSProperties = {
    border: 0,
    marginRight: '2px'
};

const homeIconStyle: CSSProperties = {
    height: '20px',
    width: '20px',
    fill: 'black',
    verticalAlign: 'sub'
};
