import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TFunction } from 'i18next';
import { Document } from '../../api/document';
import { get, getPredecessors, search } from '../../api/documents';
import { parseFrontendGetParams, Query } from '../../api/query';
import { Result, ResultDocument } from '../../api/result';
import { BREADCRUMB_HEIGHT, NAVBAR_HEIGHT } from '../../constants';
import DocumentBreadcrumb, { BreadcrumbItem } from '../../shared/documents/DocumentBreadcrumb';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import { useSearchParams } from '../../shared/location';
import { LoginContext } from '../../shared/login';
import { useGetChunkOnScroll } from '../../shared/scroll';
import CONFIGURATION from '../../configuration.json';
import DocumentCard from '../../shared/document/DocumentCard';
import './typeView.css';


const CHUNK_SIZE = 50;


export default function TypeView(): ReactElement {

    const { project, documentId } = useParams<{ project: string, documentId: string }>();
    const loginData = useContext(LoginContext);
    const searchParams = useSearchParams();
    const { t } = useTranslation();

    const [document, setDocument] = useState<Document>(null);
    const [documents, setDocuments] = useState<ResultDocument[]>([]);
    const [finds, setFinds] = useState<ResultDocument[]>([]);
    const [breadcrumbs, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
    const [tabKey, setTabKey] = useState<string>('children');
    const [loading, setLoading] = useState(0);

    const { onScroll, resetScrollOffset } = useGetChunkOnScroll((newOffset: number) => {

        const promise = documentId
            ? getChildren(documentId, newOffset, loginData.token, project)
            : getCatalogsForProject(searchParams, newOffset, loginData.token, project);
        promise.then(result => setDocuments(oldDocs => oldDocs.concat(result.documents)));
    });

    useEffect(() => {

        setLoading(0);

        if (documentId) {
            get(documentId, loginData.token).then(doc => {
                setDocument(doc);
                setTabKey('children');
                setLoading(loading => ++loading);
            });
            getChildren(documentId, 0, loginData.token, project).then(result => {
                setDocuments(result.documents);
                setLoading(loading => ++loading);
            });
            getPredecessors(documentId, loginData.token).then(result => {
                setBreadcrumb(predecessorsToBreadcrumbItems(project, result.results, t));
                setLoading(loading => ++loading);
            });
            getLinkedFinds(documentId, 0, loginData.token, project).then(result => {
                setFinds(result.documents);
                setLoading(loading => ++loading);
            });
        } else {
            setDocument(null);
            setBreadcrumb(predecessorsToBreadcrumbItems(project, [], t));
            getCatalogsForProject(searchParams, 0, loginData.token, project).then(res => {
                setDocuments(res.documents);
                resetScrollOffset();
                setLoading(4);
            });
        }
    // eslint-disable-next-line
    }, [documentId, loginData, searchParams]);
        
    return isReady(loading) && (
        <Container fluid className="browse-select">
            <DocumentBreadcrumb breadcrumbs={ breadcrumbs } />
            <Row>
                { document
                    ? <>
                        <Col className="col-4 sidebar">
                            <DocumentCard document={ document }
                                baseUrl={ CONFIGURATION.fieldUrl }
                                cardStyle={ cardStyle }
                                headerStyle={ cardHeaderStyle }
                                bodyStyle={ cardBodyStyle } />
                        </Col>
                        <Col style={ documentGridStyle } onScroll={ onScroll }>
                            
                            <Tabs id="doc-tabs" activeKey={ tabKey } onSelect={ setTabKey }>
                                <Tab eventKey="children" title={ t('type.subtypes') }>
                                    <DocumentGrid documents={ documents }
                                        getLinkUrl={ (doc: ResultDocument): string => doc.resource.id } />
                                </Tab>
                                { document && document.resource.category.name === 'Type' &&
                                    <Tab eventKey="linkedFinds" title={ t('type.linkedFinds.header') }>
                                        <DocumentGrid documents={ finds }
                                            getLinkUrl={
                                                (doc: ResultDocument): string => {
                                                    return `/project/${project}/hierarchy/${doc.resource.id}`;
                                                }
                                            } />
                                    </Tab>
                                }
                            </Tabs>
                        </Col>
                    </>
                    : <Col>
                        <DocumentGrid documents={ documents }
                            getLinkUrl={ (doc: ResultDocument): string => `${ project }/${ doc.resource.id }` } />
                    </Col>
                }
            </Row>
        </Container>
    );
}


const isReady = (loading: number) => loading === 4;


const getChildren = async (parentId: string, from: number, token: string, project: string) => {

    const query: Query = {
        size: CHUNK_SIZE,
        from,
        filters: [
            { field: 'project', value: project },
            { field: 'category', value: 'Type' }
        ]
    };
    query.parent = parentId;
    query.sort = 'sort';
    return search(query, token);
};


const getCatalogsForProject = async (searchParams: URLSearchParams, from: number, token: string,
        project: string): Promise<Result> => {
    
    let query: Query = {
        size: CHUNK_SIZE,
        from,
        filters: [
            { field: 'project', value: project },
            { field: 'category', value: 'TypeCatalog' }
        ]
    };
    query = parseFrontendGetParams(searchParams, query);
    return search(query, token);
};


const predecessorsToBreadcrumbItems = (project: string, predecessors: ResultDocument[],
        t: TFunction): BreadcrumbItem[] => {

    return [
        {
            identifier: t('type.catalogs'),
            url: `/type/${project}`,
        },
        ...predecessors.map(predec => {
            return {
                identifier: predec.resource.identifier,
                id: predec.resource.id,
                url: predec.resource.id,
            };
        })
    ];
};


const getLinkedFinds = async (typeId: string, from: number, token: string, project: string): Promise<Result> =>
    search(getQuery(typeId, from, project), token);


const getQuery = (typeId: string, from: number, project: string): Query => ({
    size: CHUNK_SIZE,
    from,
    filters: [
        { field: 'project', value: project },
        { field: 'resource.relations.isInstanceOf.resource.id', value: typeId }
    ]
});


const cardStyle: CSSProperties = {
    overflow: 'hidden',
    flexGrow: 1,
    flexShrink: 1
};


const cardHeaderStyle: CSSProperties = {
    padding: '12px'
};


const cardBodyStyle: CSSProperties = {
    maxHeight: 'calc(100vh - 195px)',
    overflow: 'auto'
};


const documentGridStyle: CSSProperties = {
    height: 'calc(100vh - ' + (NAVBAR_HEIGHT + BREADCRUMB_HEIGHT) + 'px)',
    overflowY: 'auto'
};
