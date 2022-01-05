import React, { CSSProperties, ReactElement, useContext, useEffect, useState } from 'react';
import { Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Document } from '../../api/document';
import { get, getPredecessors, search, search_after } from '../../api/documents';
import { parseFrontendGetParams, Query, NestedSortObject } from '../../api/query';
import { Result, ResultDocument, MinMaxSort, ScrollState } from '../../api/result';
import { BREADCRUMB_HEIGHT, NAVBAR_HEIGHT } from '../../constants';
import DocumentBreadcrumb, { BreadcrumbItem } from '../../shared/documents/DocumentBreadcrumb';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import DocumentGridShapes from '../../shared/documents/DocumentGridShapes';
import { useSearchParams } from '../../shared/location';
import { LoginContext } from '../../shared/login';
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
    const [minmax, setMinMaxSort] = useState<MinMaxSort>(null);
    const [scrollState, setScrollState] = useState<ScrollState>({ 
        'atBottom' : false,
        'atTop' : false
     });  
    type OnScroll = (e: React.UIEvent<Element, UIEvent>) => void;
    const onScroll = (e: React.UIEvent<Element, UIEvent>) => {
        const el = e.currentTarget;
        if ((el.scrollTop + el.clientHeight) >= el.scrollHeight) {
            console.log('Scroll to the Bottom!', minmax)
            const scrollState:ScrollState = { 
                'atBottom' : true,
                'atTop' : false
             };
            setScrollState(scrollState)
        
            }
        
    };
    

    useEffect(() => {
        if (documentId) {
            
            get(documentId, loginData.token)
                .then(doc => setDocument(doc))
                .then(() => setTabKey('similarTypes'));  
            console.log('This is the DOC:', document);
            searchCatalogDocuments(loginData.token, documentId)
                .then(results => setDocuments(results.documents));
            const minmax = getMinMax(documents)
            setMinMaxSort(minmax);
            console.log('This is the documents in the Browse.', documents);
            getPredecessors(documentId, loginData.token)
                .then(result => setBreadcrumb(predecessorsToBreadcrumbItems(result.results)));
        } else {
            setDocument(null);
            setBreadcrumb([]);
            searchDocuments(searchParams, 0, loginData.token).then(res => {
                setDocuments(res.documents);
            });
        }
    // eslint-disable-next-line
    }, [documentId, loginData, searchParams,]);

    useEffect(() => {
        if (scrollState.atBottom) {
            console.log('This is the documents:', documents)
            getNextDocuments(loginData.token, documents)
                .then(results => setDocuments(documents.concat(results.documents)));
            setScrollState({ 
                'atBottom' : false,
                'atTop' : false
             });
             setMinMaxSort(getMinMax(documents));
        }

    }, [scrollState]);

    return (

            <Container fluid className="browse-select">
                <DocumentBreadcrumb breadcrumbs={ breadcrumbs } />
                <Row>
                    { document
                        ? <>
                            <Col style={ documentGridStyle } onScroll={onScroll}>
                                <Row className="catalog">
                                    <Col>
                                        <h1 className="my-5">{ }</h1>
                                        
                                        <DocumentGridShapes documents={ documents } getLinkUrl={ getDocumentLink } />
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
                        : <Col >
                            <DocumentGrid documents={ documents }
                                getLinkUrl={ (doc: ResultDocument): string => doc.resource.id } />
                        </Col>
                    }
                
                </Row>
            </Container>

    );
}


const searchCatalogDocuments = async (token: string, documentId): Promise<Result> => {
    const doc = await get(documentId, token);
    const nest: NestedSortObject = {
        path : 'resource.literature',
        max_children: 1
        };

    const query: Query = {
        size: 50,
        from: 0,
        filters: [
            
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after:[doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['page'], 
                    doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['figure'], 
                    doc.resource.id],
        //search_after: [ doc.resource.identifier, doc.resource.id ],
        sort: [
            
            {field:'resource.literature.page', order:'asc', nested: nest},
            {field:'resource.literature.figure', order:'asc', nested: nest },
            {field:'resource.id', order:'asc'}
        ]

    };
    console.log('This is nest command Page:', )

    return await search_after(query, token);
};

const getNextDocuments = async (token: string, olddocuments): Promise<Result> => {  
    const nest: NestedSortObject = {
        path : 'resource.literature',
        max_children: 1
        };
    const query: Query = {
        size: 10,
        from: 0,
        filters: [
            
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after: [ olddocuments[olddocuments.length-1].resource.literature[0]['page'], olddocuments[olddocuments.length-1].resource.literature[0]['figure'], olddocuments[olddocuments.length-1].resource.id ],
        sort: [{field:'resource.literature.page', order:'asc', nested: nest },
            {field:'resource.literature.figure', order:'asc', nested: nest },
            {field:'resource.id', order:'asc'}
        ]

    };

    return search_after(query, token);
};

const getMinMax = (documents) => {
    const resultBounds:MinMaxSort = { 
        'min' : documents[0].resource.identifier,
        'max' : documents[documents.length-1].resource.identifier
     };
     
    return resultBounds

};

const getChildren = async (parentId: string, from: number, token: string) => {

    const query: Query = getQueryTemplate(from);
    query.parent = parentId;
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
