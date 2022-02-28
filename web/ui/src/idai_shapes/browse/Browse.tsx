import React, { CSSProperties, ReactElement, useContext, useEffect, useLayoutEffect, useState, useRef} from 'react';
import { Col, Container, Row, Tab, Tabs, Button, Form } from 'react-bootstrap';
import * as tf from '@tensorflow/tfjs';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Document } from '../../api/document';
import { get, getPredecessors, search, search_after, searchAggLiterature } from '../../api/documents';
import { parseFrontendGetParams, Query, NestedSortObject } from '../../api/query';
import { Result, ResultDocument,ScrollState, loadDocsState } from '../../api/result';
import { BREADCRUMB_HEIGHT, NAVBAR_HEIGHT } from '../../constants';
import DocumentBreadcrumb, { BreadcrumbItem } from '../../shared/documents/DocumentBreadcrumb';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import DocumentGridShapes from '../../shared/documents/DocumentGridShapes';
import { useSearchParams } from '../../shared/location';
import { LoginContext } from '../../shared/login';
import { SHAPES_PROJECT_ID } from '../constants';
import './browse.css';
import LinkedFinds from './LinkedFinds';
import { getSimilar } from '../../api/documents';
import CONFIGURATION from '../../configuration.json';
import DocumentCard from '../../shared/document/DocumentCard';
import CanvasDraw, { DrawCanvasObject } from '../drawcanvas/DrawCanvas';



const CHUNK_SIZE = 50;


export default function Browse(): ReactElement {
    const myRef = useRef<HTMLDivElement>(null);
    const ParentmyRef = useRef<HTMLDivElement>(null);
    const { documentId } = useParams<{ documentId: string }>();
    const loginData = useContext(LoginContext);
    const [similarTypes, setSimilarTypes] = useState<ResultDocument[]>([]);
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const getDocumentLink = (document: ResultDocument): string => `/${document.resource.id}`;
    const [document, setDocument] = useState<Document>(null);
    const [documents, setDocuments] = useState<ResultDocument[]>(null);
    const [breadcrumbs, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
    const [tabKey, setTabKey] = useState<string>('similarTypes');
    const [tabKeymiddle, setTabKeymiddle] = useState<string>('selected');
    const [FindDrawingButton, setFindDrawingButton] = useState(false)

    const [brushRadius, setBrushRadius] = useState<number>(10);
    const [dataUrl, setDataUrl] = useState<string>(null);
    const canvas = useRef<DrawCanvasObject>();
    const image = useRef<HTMLImageElement>(null);
    const buttonHandlerFindDrawing = () => {
        setFindDrawingButton(current => !current)
      };
    const canavasImage = () => canvas.current.getCanvas().toDataURL();
    const [scrollState, setScrollState] = useState<ScrollState>({ 
        'atBottom' : false,
        'atTop' : false
     });
     const [loadDocsState, setloadDocsState] = useState<loadDocsState>({ 
        'readyToScroll' : false,
     });  
    type OnScroll = (e: React.UIEvent<Element, UIEvent>) => void;
    const executeScroll = () => ParentmyRef.current.scrollTo({ top: myRef.current.offsetTop, left: 0, behavior: 'smooth'});
    const onScrollBrowse = (e: React.UIEvent<Element, UIEvent>) => {
        const el = e.currentTarget;
        //console.log('scrollHeight:',el.scrollHeight)
        //console.log('scrollTop:',el.scrollTop)
        //console.log('scrollclientHeight:',el.clientHeight)
        if ((el.scrollTop + el.clientHeight) >= el.scrollHeight) {

            const scrollState:ScrollState = { 
                'atBottom' : true,
                'atTop' : false
             };
            setScrollState(scrollState)
        
            }
        if ((el.scrollTop) <= 0) {
            const scrollState:ScrollState = { 
                'atBottom' : false,
                'atTop' : true
            };
            setScrollState(scrollState)
            el.scrollTo(0, 5)
            console.log('this is the element', el)
        
            }
        
    };
    
    const brushRadiusHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    
        setBrushRadius(parseInt(e.target.value));
    };
    
    const clearHandler = () => {
    
        canvas.current && canvas.current.clear();
    };


    useEffect(() => {
        if (documentId) {

            const fetchData = async () => { 
                const doc = await get(documentId, loginData.token)
                getAggLiterature(loginData.token)
                  .then(results => console.log('This is Agg Literature',results));
                console.log('Agg should have been here')
                setDocument(doc)
                getSimilar(documentId, loginData.token)
                    .then(result => setSimilarTypes(result.documents))
                const beforedocs = await searchBeforeDoc(loginData.token, documentId)
                console.log('Check for the sort', beforedocs)
                const docs = await searchCatalogDocuments(loginData.token, documentId)
                beforedocs.documents.reverse()
                beforedocs.documents.push(doc)
                const merge = beforedocs.documents.concat(docs.documents)
                console.log('Reverse Documents', merge)

                setDocuments(merge)
                const loadDocsState:loadDocsState = { 
                    'readyToScroll' : true
                };
                setloadDocsState(loadDocsState)
            }

            fetchData();

            
            //getPredecessors(documentId, loginData.token)
                //.then(result => setBreadcrumb(predecessorsToBreadcrumbItems(result.results)));
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
        if (myRef.current) {
            console.log('MyRef exists!', myRef.current)
            executeScroll()
        } else { console.log('NO Ref!')}

    }, [loadDocsState]);

    useEffect(() => {
        if (scrollState.atTop) {
            getPreviousDocuments(loginData.token, documentId, documents)
                //.then(results => console.log('This is the previous results:',results.documents.reverse()));
                .then(results => setDocuments(results.documents.reverse().concat(documents.slice(0,(documents.length-6)))))
            
            
            setScrollState({ 
                'atBottom' : false,
                'atTop' : false
             });
            
        }
        if (scrollState.atBottom) {
            getNextDocuments(loginData.token, documentId, documents)
                //.then(results => console.log('This is the next results:',results));
                .then(results => setDocuments(documents.slice(6).concat(results.documents)));
            setScrollState({ 
                'atBottom' : false,
                'atTop' : false
             });
        }
        //console.log('Number of Documents:', documents.length)

    }, [scrollState]);

    useEffect(() => {
        if (FindDrawingButton) {

            //console.log('This is canvas', canvas.current.getCanvas().toDataURL())
            setDataUrl(canvas.current.getCanvas().toDataURL())
            
            searchSimilarDocuments(loginData.token, image.current , 'true' )
                .then(result => setSimilarTypes(result.documents));
            buttonHandlerFindDrawing()
        }


    }, [FindDrawingButton]);
    return (

            <Container fluid className="browse-select">
                <DocumentBreadcrumb breadcrumbs={ breadcrumbs } />
                <Row>
                    { document
                        ? <>
                            <Col lg={5} style={ documentGridBrowseStyle } onScroll={onScrollBrowse} ref={ParentmyRef}>
                                <Row className="catalog">
                                    <Col>
                                        <h1 className="my-5">{ }</h1>
                                        
                                        <DocumentGridShapes documents={ documents } getLinkUrl={ getDocumentLink } selecteddoc = { document} myRef = { myRef }/>
                                    </Col>
                                </Row>
                            </Col>
                
                            <Col lg={3} className="catalog">
                                <Tabs id="doc-tabs" activeKey={ tabKeymiddle } onSelect={ setTabKeymiddle }>
                                { document && document.resource.category.name === 'Drawing' &&
                                        <Tab eventKey="selected" title= 'Selected'>
                                            <DocumentCard document={ document }
                                                baseUrl={ CONFIGURATION.shapesUrl }
                                                cardStyle={ cardStyle }
                                                headerStyle={ cardHeaderStyle }
                                                bodyStyle={ cardBodyStyle } />
                                        </Tab>
                                    }
                                    { document && document.resource.category.name === 'Drawing' &&
                                        <Tab eventKey="sketched" title={ 'Sketched'}>
                                            <>
                                            <CanvasDraw brushRadius={ brushRadius } ref={ canvas } />
                                            <Button
                                                variant="primary"
                                                className="mx-1 mt-1"
                                                style={ buttonStyle }
                                                onClick={ buttonHandlerFindDrawing } >
                                            { t('shapes.draw.search') }
                                            </Button>
                                            <Button
                                                variant="primary"
                                                className="mt-1"
                                                style={ buttonStyle }
                                                onClick={ clearHandler } >
                                                { t('shapes.draw.clear') }
                                            </Button>
                                            <Col>
                                                <Form.Control type="range" min="5" max="30" custom
                                                    className="mt-2 w-25" value={ brushRadius }
                                                    onChange={ brushRadiusHandler } />
                                                <p>{ t('shapes.draw.brushRadius') }</p>
                                            </Col>
                                            <img src={ dataUrl } ref={ image } alt="no dataUrl" className="mx-auto d-block" />
                                        </>
                                        </Tab>
                                    }

                                 </Tabs>
                                    
                            </Col>
                            <Col lg={4} style={ documentGridSimilarStyle } >
                                <Tabs id="doc-tabs" activeKey={ tabKey } onSelect={ setTabKey }>
                                    { document && document.resource.category.name === 'Drawing' &&
                                        <Tab eventKey="similarTypes" title={ t('shapes.browse.similarTypes') }>
                                                <DocumentGrid documents={ similarTypes }
                                                    getLinkUrl={ (doc: ResultDocument): string => doc.resource.id } />
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





const searchCatalogDocuments = async (token: string, documentId: string): Promise<Result> => {
    const doc = await get(documentId, token);
    const docsliterature = doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]
    console.log(docsliterature['zenonId'] )
    
    const nest: NestedSortObject = {
        path : 'resource.literature',
        max_children: 1
        };

    const query: Query = {
        size: 20,
        from: -1,
        //filtersnested:[
            //{ path: 'resource.literature', field: 'literature.zenonId', value: docsliterature['zenonId'] }
        //],
        filters: [
            
            { field: 'resource.literature0.zenonId', value: docsliterature['zenonId'] },
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after:[doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['zenonId'],
                    doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['page'], 
                    doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['figure'], 
                    doc.resource.id],
        //search_after: [ doc.resource.identifier, doc.resource.id ],
        sort: [
            {field:'resource.literature.zenonId', order:'desc', nested: nest},
            {field:'resource.literature.page', order:'asc', nested: nest},
            {field:'resource.literature.figure', order:'asc', nested: nest },
            {field:'resource.id', order:'asc'}
        ]
    };

    return search_after(query, token);
};

const searchBeforeDoc = async (token: string, documentId: string): Promise<Result> => {
    const doc = await get(documentId, token);
    const docsliterature = doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]

    const nest: NestedSortObject = {
        path : 'resource.literature',
        max_children: 1
        };

    const query: Query = {
        size: 20,
        from: 0,
        //filtersnested:[
            //{ path: 'resource.literature', field: 'literature.zenonId', value: docsliterature['zenonId'] }
        //],
        filters: [
            { field: 'resource.literature0.zenonId', value: docsliterature['zenonId'] },           
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after:[doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['zenonId'], 
                    doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['page'], 
                    doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]['figure'], 
                    doc.resource.id],
        //search_after: [ doc.resource.identifier, doc.resource.id ],
        sort: [
            {field:'resource.literature.zenonId', order:'desc', nested: nest},
            {field:'resource.literature.page', order:'desc', nested: nest},
            {field:'resource.literature.figure', order:'desc', nested: nest },
            {field:'resource.id', order:'desc'}
        ]
    };

    return search_after(query, token);
};


const getNextDocuments = async (token: string, documentId: string, olddocuments: ResultDocument[]): Promise<Result> => { 
    const doc = await get(documentId, token);
    const docsliterature = doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]
    const lastdoc : ResultDocument = olddocuments[olddocuments.length-1] 
    const nest: NestedSortObject = {
        path : 'resource.literature',
        max_children: 1
        };

    const query: Query = {
        size: 6,
        from: 0,
        filters: [
            { field: 'resource.literature0.zenonId', value: docsliterature['zenonId'] },
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after: [lastdoc.resource.literature[0]['zenonId'],lastdoc.resource.literature[0]['page'], lastdoc.resource.literature[0]['figure'], lastdoc.resource.id ],
        sort: [{field:'resource.literature.zenonId', order:'desc', nested: nest},
            {field:'resource.literature.page', order:'asc', nested: nest },
            {field:'resource.literature.figure', order:'asc', nested: nest },
            {field:'resource.id', order:'asc'}
        ]

    };

    return search_after(query, token);
};


const getPreviousDocuments = async (token: string,  documentId: string, olddocuments: ResultDocument[] ): Promise<Result> => { 
    console.log('This is the searchafter for previousDocuments:', olddocuments[0].sort) 
    const doc = await get(documentId, token);
    const docsliterature = doc.resource.groups.find(group => group.name === 'parent').fields.find(fields => fields.name === 'literature').value[0]
    const nest: NestedSortObject = {
        path : 'resource.literature',
        max_children: 1
        };
    const query: Query = {
        size: 6,
        from: 0,
        filters: [
            { field: 'resource.literature0.zenonId', value: docsliterature['zenonId'] },
            { field: 'project', value: SHAPES_PROJECT_ID },
            { field: 'resource.category.name', value: 'Drawing' }

        ],
        search_after: [olddocuments[0].resource.literature[0]['zenonId'], olddocuments[0].resource.literature[0]['page'], olddocuments[0].resource.literature[0]['figure'], olddocuments[0].resource.id ],
        sort: [{field:'resource.literature.zenonId', order:'desc', nested: nest},
            {field:'resource.literature.page', order:'desc', nested: nest },
            {field:'resource.literature.figure', order:'desc', nested: nest },
            {field:'resource.id', order:'desc'}
        ]

    };
    console.log('Query API-Endpoint /api/documents/searchafter with: ', query );

    return search_after(query, token);
};


const getAggLiterature = async (token: string): Promise<Result> => { 
    const query: Query = {
        size: 100,
        from: 0
    };

    return searchAggLiterature(query, token);
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

const searchSimilarDocuments = async (token: string, image:HTMLImageElement, isDrawing: string): Promise<Result> => {

    const query: Query = {
        size: 60,
        image_query:  {
            model: 'resnet',
            segment_image: isDrawing === 'false',
            image: tf.browser.fromPixels(image,3)

        },
        filters: [{ field: 'resource.category.name' ,value: 'Drawing' },]
    };

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

const documentGridSimilarStyle: CSSProperties = {
    height: 'calc(100vh - ' + (NAVBAR_HEIGHT + BREADCRUMB_HEIGHT) + 'px)',
    overflowY: 'auto'
};

const documentGridBrowseStyle: CSSProperties = {
    height: 'calc(100vh - ' + (NAVBAR_HEIGHT + BREADCRUMB_HEIGHT) + 'px)',
    overflowY: 'auto'
};

const buttonStyle: CSSProperties = {
    borderColor: 'white',
    borderStyle: 'solid',
    borderRadius: '5px'
};
