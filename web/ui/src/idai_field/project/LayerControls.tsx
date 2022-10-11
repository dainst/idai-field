import React, { ReactElement, useState, CSSProperties, useEffect } from 'react';
import { Button, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import Icon from '@mdi/react';
import { mdiEye, mdiEyeOff, mdiImageFilterCenterFocus, mdiLayers } from '@mdi/js';
import Map from 'ol/Map';
import { FitOptions } from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import { flatten, isDefined } from 'tsfun';
import { NAVBAR_HEIGHT } from '../../constants';
import { ResultDocument } from '../../api/result';
import { Document } from '../../api/document';
import './layer-controls.css';


type VisibleTileLayersSetter = React.Dispatch<React.SetStateAction<string[]>>;

type LayerGroup = { document: ResultDocument, tileLayers: TileLayer[] };


export default function LayerControls({ map, tileLayers, fitOptions, selectedDocument, predecessors, project,
        projectDocument }
    : { map: Map, tileLayers: TileLayer[], fitOptions: FitOptions, selectedDocument: Document,
            predecessors: ResultDocument[], project: string, projectDocument: Document }): ReactElement {

        const [visibleTileLayers, setVisibleTileLayers] = useState<string[]|null>(null);
        const [layerControlsVisible, setLayerControlsVisible] = useState<boolean>(false);
        const [layerGroups, setLayerGroups] = useState<LayerGroup[]>([]);
        const { t } = useTranslation();

        useEffect(() => {

            const layerControlsCloseClickFunction = getLayerControlsCloseClickFunction(setLayerControlsVisible);
            addLayerControlsCloseEventListener(layerControlsCloseClickFunction);

            setVisibleTileLayers(restoreVisibleTileLayers(project));

            return () => removeLayerControlsCloseEventListener(layerControlsCloseClickFunction);
        }, [project]);


        useEffect(() => {

            if (!projectDocument) return;

            const newLayerGroups: LayerGroup[] = createLayerGroups(
                tileLayers, selectedDocument, predecessors, projectDocument
            );
            setLayerGroups(newLayerGroups);
            updateZIndices(newLayerGroups);
            if (newLayerGroups.length > 0 && !visibleTileLayers) {
                setVisibleTileLayers(getDefaultVisibleTileLayers(projectDocument));
            }
            updateTileLayerVisibility(tileLayers, newLayerGroups, visibleTileLayers);
        }, [tileLayers, selectedDocument, predecessors, visibleTileLayers, projectDocument]);


        return <>
            { layerControlsVisible && renderLayerControls(map, layerGroups, visibleTileLayers, fitOptions, project,
                t, setVisibleTileLayers) }
            { layerGroups.length > 0 && renderLayerControlsButton(layerControlsVisible, setLayerControlsVisible) }
        </>;
}


const renderLayerControlsButton = (layerControlsVisible: boolean,
        setLayerControlsVisible: React.Dispatch<React.SetStateAction<boolean>>): ReactElement => <>
    <Button id="layer-controls-button" variant="primary" style={ layerControlsButtonStyle }
            onClick={ () => setLayerControlsVisible(!layerControlsVisible) }>
        <span style={ layerControlsButtonIconContainerStyle }>
            <Icon path={ mdiLayers } size={ 0.8 } />
        </span>
    </Button>
</>;


const renderLayerControls = (map: Map, layerGroups: LayerGroup[], visibleTileLayers: string[], fitOptions: FitOptions,
        project: string, t: TFunction, setVisibleTileLayers: VisibleTileLayersSetter): ReactElement => {

    return <Card id="layer-controls" style={ cardStyle } className="layer-controls">
        <Card.Body style={ cardBodyStyle }>
            { layerGroups.map(layerGroup => {
                return renderLayerGroup(layerGroup, map, visibleTileLayers, fitOptions, project, t,
                    setVisibleTileLayers);
            }) }
        </Card.Body>
    </Card>;
};


const renderLayerGroup = (layerGroup: LayerGroup, map: Map, visibleTileLayers: string[], fitOptions: FitOptions,
        project: string, t: TFunction, setVisibleTileLayers: VisibleTileLayersSetter) => {

    return <div key={ 'layers-' + layerGroup.document.resource.id }>
        <div style={ layerGroupHeadingStyle }>
            { layerGroup.document.resource.category.name === 'Project'
                ? t('project.map.layerControls.project')
                : layerGroup.document.resource.identifier }
        </div>
        <ul className="list-group" style={ layerGroupStyle }>
            { layerGroup.tileLayers.map(
                renderLayerControl(map, visibleTileLayers, fitOptions, project, setVisibleTileLayers)
            ) }
        </ul>
    </div>;
};

/* eslint-disable react/display-name */
const renderLayerControl = (map: Map, visibleTileLayers: string[], fitOptions: FitOptions, project: string,
        setVisibleTileLayers: VisibleTileLayersSetter) => (tileLayer: TileLayer): ReactElement => {

    const resource = tileLayer.get('document').resource;
    const extent = tileLayer.getSource().getTileGrid().getExtent();

    return (
        <li style={ layerControlStyle } key={ resource.id } className="list-group-item">
                <Button variant="link"
                        onClick={ () => toggleLayer(tileLayer, project, visibleTileLayers, setVisibleTileLayers) }
                        style={ layerButtonStyle }
                        className={ visibleTileLayers.includes(resource.id) && 'active' }>
                    <Icon path={ visibleTileLayers.includes(resource.id) ? mdiEye : mdiEyeOff } size={ 0.7 } />
                </Button>
                <Button variant="link" onClick={ () => map.getView().fit(extent, fitOptions) }
                        style={ layerButtonStyle }>
                    <Icon path={ mdiImageFilterCenterFocus } size={ 0.7 } />
                </Button>
            { resource.shortDescription ?? resource.identifier }
        </li>
    );
};
/* eslint-enable react/display-name */


const toggleLayer = (tileLayer: TileLayer, project: string, visibleTileLayers: string[],
                    setVisibleTileLayers: React.Dispatch<React.SetStateAction<string[]>>): void => {

    const docId = tileLayer.get('document').resource.id;

    tileLayer.setVisible(!tileLayer.getVisible());
    if (!visibleTileLayers) visibleTileLayers = [];
    const newVisibleTileLayers: string[] = tileLayer.getVisible()
        ? [...visibleTileLayers, docId]
        : visibleTileLayers.filter(id => id !== docId);

    setVisibleTileLayers(newVisibleTileLayers);
    saveVisibleTileLayers(newVisibleTileLayers, project);
};


const updateTileLayerVisibility = (tileLayers: TileLayer[], layerGroups: LayerGroup[], visibleTileLayers: string[]) => {

    const groupLayers: TileLayer[] = flatten(layerGroups.map(group => group.tileLayers));
    if (!visibleTileLayers) visibleTileLayers = [];

    tileLayers.forEach(tileLayer => {
        tileLayer.setVisible(groupLayers.includes(tileLayer)
            && visibleTileLayers.includes(tileLayer.get('document').resource.id));
    });
};


const addLayerControlsCloseEventListener = (eventListener: EventListener) => {

    document.addEventListener('click', eventListener);
};


const removeLayerControlsCloseEventListener = (eventListener: EventListener) => {

    document.removeEventListener('click', eventListener);
};


const getLayerControlsCloseClickFunction = (setLayerControlsVisible: (visible: boolean) => void) => {

    return (event: MouseEvent) => {

        let element = event.target as Element;
        let insideLayerControls: boolean = false;
        while (element) {
            if (element.id.startsWith('layer-controls')) {
                insideLayerControls = true;
                break;
            } else {
                element = element.parentElement;
            }
        }
        if (!insideLayerControls) setLayerControlsVisible(false);
    };
};


const createLayerGroups = (tileLayers: TileLayer[], selectedDocument: ResultDocument,
                           predecessors: ResultDocument[], projectDocument: Document): LayerGroup[] => {

    const documents: ResultDocument[] = (selectedDocument ? [selectedDocument] : []).concat(predecessors);

    const layerGroups: LayerGroup[] = documents.map(document => {
        return {
            document,
            tileLayers: getLinkedTileLayers(document, tileLayers)
        };
    });

    layerGroups.push({
        document: projectDocument,
        tileLayers: getLinkedTileLayers(projectDocument, tileLayers)
    });

    const result = layerGroups.filter(layerGroup => layerGroup.tileLayers.length > 0);

    return (result.length === 0 && tileLayers.length > 0)
        ? [{ document: projectDocument, tileLayers }]
        : result;
};


const getLinkedTileLayers = (document: Document|ResultDocument, tileLayers: TileLayer[]): TileLayer[] => {
    
    const relations: ResultDocument[] = document.resource.relations.hasMapLayer;

    return relations
        ? relations.map((relationTarget: ResultDocument) => {
            return tileLayers.find(layer => layer.get('document').resource.id === relationTarget.resource.id);
        }).filter(isDefined)
        : [];
};


const updateZIndices = (layerGroups: LayerGroup[]) => {

    const tileLayers: TileLayer[] = flatten(layerGroups.map(group => group.tileLayers)).reverse();

    for (let i = 0; i < tileLayers.length; i++) {
        tileLayers[i].setZIndex(i);
    }
};


const saveVisibleTileLayers = (visibleTileLayers: string[], project: string) => {

    try {
        localStorage.setItem(`visibleTileLayers_${project}`, JSON.stringify(visibleTileLayers));
    } catch (err) {
        console.warn('Failed to save list of visible tile layers to local storage', err);
    }
};


const restoreVisibleTileLayers = (project: string): string[]|null => {

    try {
        return JSON.parse(localStorage.getItem(`visibleTileLayers_${project}`));
    } catch (err) {
        console.warn('Failed to restore list of visible tile layers from local storage', err);
        return null;
    }
};


const getDefaultVisibleTileLayers = (projectDocument: ResultDocument): string[] => {

    return projectDocument.resource.relations?.hasDefaultMapLayer?.map(target => target.resource.id)
        ?? [];
};


const layerControlsButtonStyle: CSSProperties = {
    position: 'absolute',
    top: `${NAVBAR_HEIGHT + 10}px`,
    right: '10px'
};


const layerControlsButtonIconContainerStyle: CSSProperties = {
    position: 'relative',
    bottom: '1px'
};


const cardStyle: CSSProperties = {
    position: 'absolute',
    top: `${NAVBAR_HEIGHT + 50}px`,
    right: '10px',
    zIndex: 1000,
    border: '1px solid rgba(0, 0, 0, .125)',
    borderRadius: '.25rem',
    marginTop: '-1px'
};


const cardBodyStyle: CSSProperties = {
    maxHeight: `calc(100vh - ${NAVBAR_HEIGHT + 60}px)`,
    padding: 0,
    overflowY: 'auto',
    overflowX: 'hidden'
};


const layerGroupHeadingStyle: CSSProperties = {
    padding: '7px 7px 0 7px'
};


const layerGroupStyle: CSSProperties = {
    marginRight: '-1px',
    marginLeft: '-1px',
    borderRadius: 0
};


const layerControlStyle: CSSProperties = {
    padding: '.25em .75em',
    fontSize: '.9em',
    border: 'none'
};


const layerButtonStyle: CSSProperties = {
    padding: '0 .375em .2em 0',
    lineHeight: 1
};
