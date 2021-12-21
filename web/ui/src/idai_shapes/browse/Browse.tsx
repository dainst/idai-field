import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Document } from '../../api/document';
import { get, getPredecessors, search, search_after } from '../../api/documents';
import { parseFrontendGetParams, Query } from '../../api/query';
import { Result, ResultDocument } from '../../api/result';
import { BREADCRUMB_HEIGHT, NAVBAR_HEIGHT } from '../../constants';
import DocumentBreadcrumb, { BreadcrumbItem } from '../../shared/documents/DocumentBreadcrumb';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import { useSearchParams } from '../../shared/location';
import { LoginContext } from '../../shared/login';
import { useGetChunkOnScroll } from '../../shared/scroll';
import { SHAPES_PROJECT_ID } from '../constants';
import './browse.css';
import LinkedFinds from './LinkedFinds';
import SimilarTypes from './SimilarTypes';
import CONFIGURATION from '../../configuration.json';
import DocumentCard from '../../shared/document/DocumentCard';


const CHUNK_SIZE = 50;


export default function Browse(): ReactElement {

    const { documentId } = useParams<{ documentId: string }>();
    const loginData = useContext(LoginContext);
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const getDocumentLink = (document: ResultDocument): string => `/${document.resource.id}`;

    const [document, setDocument] = useState<Document>(null);
    const [documents, setDocuments] = useState<ResultDocument[]>(null);
    const [breadcrumbs, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
    const [tabKey, setTabKey] = useState<string>('children');

    const { onScroll, resetScrollOffset } = useGetChunkOnScroll((newOffset: number) => {

        const promise = documentId
            ? getChildren(documentId, newOffset, loginData.token)
            : searchDocuments(searchParams, newOffset, loginData.token);
        promise.then(result => setDocuments(oldDocs => oldDocs.concat(result.documents)));
    });


    useEffect(() => {

        if (documentId) {
            
            get(documentId, loginData.token)
                .then(doc => setDocument(doc))
                .then(() => setTabKey('similarTypes'));
            searchCatalogDocuments(loginData.token)
                .then(result => setDocuments(result.documents));   
            getPredecessors(documentId, loginData.token)
                .then(result => setBreadcrumb(predecessorsToBreadcrumbItems(result.results)));
        } else {
            setDocument(null);
            setBreadcrumb([]);
            searchDocuments(searchParams, 0, loginData.token).then(res => {
                setDocuments(res.documents);
                resetScrollOffset();
            });
        }
    // eslint-disable-next-line
    }, [documentId, loginData, searchParams]);

    return (

            <Container fluid className="browse-select">
                <DocumentBreadcrumb breadcrumbs={ breadcrumbs } />
                <Row>
                    { document
                        ? <>
                            <Col style={ documentGridStyle } >
                                <Row className="catalog">
                                    <Col>
                                        <h1 className="my-5">{ }</h1>
                                        <DocumentGrid documents={ documents } getLinkUrl={ getDocumentLink } />
                                    </Col>
                                </Row>
                            </Col>
                
                            <Col className="col-4 sidebar">
                                <DocumentCard document={ document }
                                    baseUrl={ CONFIGURATION.shapesUrl }
                                    cardStyle={ cardStyle }
                                    headerStyle={ cardHeaderStyle }
                                    bodyStyle={ cardBodyStyle } />
                                    
                            </Col>
                            <Col style={ documentGridStyle } onScroll={ onScroll }>
                                <Tabs id="doc-tabs" activeKey={ tabKey } onSelect={ setTabKey }>
                                    { document && document.resource.category.name === 'Drawing' &&
                                        <Tab eventKey="similarTypes" title={ t('shapes.browse.similarTypes') }>
                                            <SimilarTypes type={ document } />
                                        </Tab>
                                    }
                                    { document && document.resource.category.name === 'Drawing' &&
                                        <Tab eventKey="linkedFinds" title={ t('shapes.browse.linkedFinds.header') }>
                                            <LinkedFinds type={ document } />
                                        </Tab>
                                    }
                                </Tabs>
                            </Col>
                        </>
                        : <Col>
                            <DocumentGrid documents={ documents }
                                getLinkUrl={ (doc: ResultDocument): string => doc.resource.id } />
                        </Col>
                    }
                </Row>
            </Container>

    );
}


const searchCatalogDocuments = async (token: string, documentId): Promise<Result> => {
    
    const query: Query = {
        size: 50,
        from: 0,
        filters: [
            
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after: 'Hayes1972_p114_67.9',
        sort: 'resource.identifier'

    };
    return search_after(query, token);
};





const getChildren = async (parentId: string, from: number, token: string) => {

    const query: Query = getQueryTemplate(from);
    query.parent = parentId;
    query.sort = 'sort';
    return search(query, token);
};


const searchDocuments = async (searchParams: URLSearchParams, from: number, token: string): Promise<Result> => {
    
    let query: Query = getQueryTemplate(from);
    query = parseFrontendGetParams(searchParams, query);
    console.log(query);
    return search(query, token);
};


const getQueryTemplate = (from: number): Query => ({
    size: CHUNK_SIZE,
    from,
    filters: [
        { field: 'project', value: SHAPES_PROJECT_ID },
        { field: 'resource.category.name', value: 'Drawing' }
    ]
});


const predecessorsToBreadcrumbItems = (predecessors: ResultDocument[]): BreadcrumbItem[] => predecessors.map(predec => {
    return {
        identifier: predec.resource.identifier,
        id: predec.resource.id,
        url: predec.resource.id,
    };
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
    height: 'calc(100% - 94px)',
    overflow: 'auto'
};


const documentGridStyle: CSSProperties = {
    height: 'calc(100vh - ' + (NAVBAR_HEIGHT + BREADCRUMB_HEIGHT) + 'px)',
    overflowY: 'auto'
};
