import { TFunction } from 'i18next';
import React, { CSSProperties, ReactElement, useContext, useEffect, useState, useRef, Ref } from 'react';
import { Alert, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { search } from '../../api/documents';
import { buildProjectsOverviewQueryTemplate, parseFrontendGetParams } from '../../api/query';
import { Result, ResultDocument, ResultFilter } from '../../api/result';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants';
import DocumentList from '../../shared/documents/DocumentList';
import { useSearchParams } from '../../shared/location';
import { LoginContext } from '../../shared/login';
import { useGetChunkOnScroll } from '../../shared/scroll';
import SearchBar from '../../shared/search/SearchBar';
import { EXCLUDED_CATEGORIES } from '../constants';
import { CHUNK_SIZE } from '../project/Project';
import Total from '../widgets/Total';
import OverviewMap from './OverviewMap';
import './projects-overview.css';


export default function ProjectsOverview(): ReactElement {
    
    const searchParams = useSearchParams();
    const loginData = useContext(LoginContext);
    const { t } = useTranslation();

    const [projectDocuments, setProjectDocuments] = useState<ResultDocument[]>([]);
    const [documents, setDocuments] = useState<ResultDocument[]>(null);
    const [total, setTotal] = useState<number>(0);
    const [projectFilter, setProjectFilter] = useState<ResultFilter>(undefined);
    const [filters, setFilters] = useState<ResultFilter[]>([]);
    const [error, setError] = useState(false);

    const documentListRef = useRef<HTMLDivElement>();

    const { onScroll, resetScrollOffset } = useGetChunkOnScroll((newOffset: number) =>
        searchDocuments(searchParams, newOffset, loginData.token)
            .then(result => setDocuments(oldDocuments => oldDocuments.concat(result.documents)))
    );

    useEffect (() => {
        
        getProjectDocuments(loginData.token)
            .then(setProjectDocuments)
            .catch(err => setError(err));
    }, [loginData]);

    useEffect (() => {

        if (searchParams.has('q')) {
            searchDocuments(searchParams, 0, loginData.token).then(result => {
                setProjectFilter(result.filters.find(filter => filter.name === 'project'));
                setFilters(result.filters.filter(filter => filter.name !== 'project'));
                setDocuments(result.documents);
                setTotal(result.size);
                resetScroll();
            });
        } else {
            setProjectFilter(undefined);
            setFilters([]);
            setDocuments(null);
            setTotal(0);
        }
    // eslint-disable-next-line
    }, [searchParams, loginData]);

    const resetScroll = () => {

        if (documentListRef.current) documentListRef.current.scrollTo(0, 0);
        resetScrollOffset();
    };

    return <>
        <div style={ leftSidebarStyle } className="sidebar">
            <Card>
                <SearchBar basepath="/" />
            </Card>
            { searchParams.has('q') && documents
                && renderSidebar(total, filters, searchParams, documents, documentListRef, onScroll) }
        </div>
        <div>
            { error ? renderError(t) : renderMap(projectDocuments, projectFilter, documents?.length > 0) }
        </div>
    </>;
}


const renderSidebar = (total: number, filters: ResultFilter[], searchParams: URLSearchParams,
        documents: ResultDocument[], documentListRef: Ref<HTMLDivElement>,
        onScroll: (e: React.UIEvent<Element, UIEvent>) => void): ReactElement => {

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('r', 'overview');

    return <div className="projects-overview-sidebar">
        <Total total={ total } filters={ filters } searchParams={ searchParams } projectView={ 'overview' } />
        <Card ref={ documentListRef } style={ documentListContainerStyle } onScroll={ onScroll }>
            <DocumentList searchParams={ newSearchParams } documents={ documents } />
        </Card>
    </div>;
};


const renderError = (t: TFunction): ReactElement => (
    <Alert variant="danger">
        { t('projectsOverview.backendNotAvailable') }
    </Alert>
);


const renderMap = (projectDocuments: ResultDocument[], projectFilter: ResultFilter,
                   withSearchResults: boolean): ReactElement =>
    <OverviewMap documents={ projectDocuments } filter={ projectFilter } withSearchResults={ withSearchResults } />;


const getProjectDocuments = async (token: string): Promise<ResultDocument[]> =>
    (await search({ q: 'resource.category.name:Project' }, token)).documents;


const searchDocuments = async (searchParams: URLSearchParams, from: number, token: string): Promise<Result> => {

    const query = parseFrontendGetParams(searchParams,
        buildProjectsOverviewQueryTemplate(from, CHUNK_SIZE, EXCLUDED_CATEGORIES));
    return search(query, token);
};


const documentListContainerStyle: CSSProperties = {
    overflow: 'hidden scroll'
};


const leftSidebarStyle: CSSProperties = {
    maxHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    width: `${SIDEBAR_WIDTH}px`,
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    left: '10px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
};
