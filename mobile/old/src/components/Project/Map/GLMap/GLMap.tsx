import { MaterialIcons } from '@expo/vector-icons';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Document } from 'idai-field-core';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LayoutRectangle,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Matrix4 } from 'react-native-redash';
import { OrthographicCamera, Scene } from 'three';
import { ConfigurationContext } from '../../../../contexts/configuration-context';
import { PreferencesContext } from '../../../../contexts/preferences-context';
import { UpdatedDocument } from '../../../../hooks/use-mapdata';
import usePrevious from '../../../../hooks/use-previous';
import { colors } from '../../../../utils/colors';
import {
  Transformation,
  WORLD_CS_HEIGHT,
  WORLD_CS_WIDTH,
} from './cs-transform';
import {
  addDocumentToScene,
  addHighlightedDocToScene,
  addLayerToScene,
  addlocationPointToScene,
  ObjectChildValues,
  removeDocumentFromScene,
  updateDocumentInScene,
  updatePointRadiusOfScene,
} from './geojson/geojson-gl-shape';
import MapSettingsModal from './MapSettingsModal';
import useMapGestureHandler from './use-map-gesture-handler';
import useMapPressHandler from './use-map-press-handler';

const cameraDefaultPos = {
  x: 0,
  y: 0,
  z: 5,
};

interface GLMapProps {
  setHighlightedDocId: (docId: string) => void;
  highlightedDocId: string | undefined;
  screen: LayoutRectangle;
  viewBox: Transformation | undefined;
  documentToWorldMatrix: Matrix4;
  screenToWorldMatrix: Matrix4;
  selectedDocumentIds: string[];
  geoDocuments: Document[];
  location: { x: number; y: number } | undefined;
  updateDoc?: UpdatedDocument;
  selectParentId: (docId: string) => void;
  layerDocuments: Document[];
  focusMapOnDocumentId: (docId: string) => void;
}

const GLMap: React.FC<GLMapProps> = ({
  setHighlightedDocId,
  highlightedDocId,
  screen,
  viewBox,
  documentToWorldMatrix,
  screenToWorldMatrix,
  selectedDocumentIds,
  geoDocuments,
  location,
  updateDoc,
  selectParentId,
  layerDocuments,
  focusMapOnDocumentId,
}) => {
  const previousSelectedDocIds = usePrevious(selectedDocumentIds);
  const config = useContext(ConfigurationContext);
  const { getMapSettings, setMapSettings, preferences } =
    useContext(PreferencesContext);

  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [pointRadius, setPointRadius] = useState<number>(
    getMapSettings(preferences.currentProject).pointRadius
  );
  const [layerInfo, setLayerInfo] = useState<
    { doc: Document; visible: boolean }[]
  >([]);

  const camera = useRef<OrthographicCamera>(
    new OrthographicCamera(0, WORLD_CS_WIDTH, WORLD_CS_HEIGHT, 0)
  ).current;
  const scene = useRef<Scene>(new Scene()).current;
  const renderer = useRef<Renderer>();
  const glContext = useRef<ExpoWebGLRenderingContext>();
  const glContextToScreenFactor = useRef<number>(0);

  const pressStartTime = useRef<number>(0);

  // scene transformation refs
  const zoom = useRef<number>(1);
  const left = useRef<number>(0);
  const top = useRef<number>(0);

  const renderScene = useCallback(() => {
    scene.position.set(
      left.current + zoom.current,
      top.current + zoom.current,
      0
    );
    scene.scale.set(zoom.current, zoom.current, 1);
    if (glContext && glContext.current && renderer && renderer.current) {
      renderer.current.render(scene, camera);
      glContext.current.endFrameEXP();
    }
  }, [camera, scene]);

  const panResponder = useMapGestureHandler(
    top,
    left,
    zoom,
    pressStartTime,
    screenToWorldMatrix,
    renderScene
  );
  const { onPress, onTouchEnd } = useMapPressHandler(
    setHighlightedDocId,
    highlightedDocId,
    selectParentId,
    screen,
    camera,
    scene,
    pressStartTime
  );

  const showLayer = (docId: string) => {
    const layer = scene.getObjectByProperty('uuid', docId);
    const layerDocIndex = layerInfo.findIndex(
      (doc) => doc.doc.resource.id === docId
    );
    if (!layer || layerDocIndex < 0) return;
    layer.visible = layerInfo[layerDocIndex].visible ? false : true;
    setLayerInfo(
      layerInfo.map((item, i) =>
        i !== layerDocIndex ? item : { doc: item.doc, visible: !item.visible }
      )
    );
    renderScene();
  };

  useEffect(
    () => setLayerInfo(layerDocuments.map((doc) => ({ doc, visible: false }))),
    [layerDocuments]
  );

  useEffect(() => {
    if (!viewBox) return;
    const { scaleX, translateX, translateY } = viewBox;
    if (!isNaN(translateX)) left.current = translateX;
    if (!isNaN(translateY)) top.current = translateY;
    if (!isNaN(scaleX)) zoom.current = scaleX;
    renderScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBox]);

  useEffect(() => {
    if (!geoDocuments.length) return;

    scene.clear();
    geoDocuments.forEach((doc) =>
      addDocumentToScene(doc, documentToWorldMatrix, scene, config)
    );
    layerDocuments.forEach((doc) =>
      addLayerToScene(doc, documentToWorldMatrix, scene)
    );
    renderScene();
  }, [
    geoDocuments,
    config,
    scene,
    documentToWorldMatrix,
    renderScene,
    pointRadius,
    layerDocuments,
  ]);

  useEffect(() => {
    if (previousSelectedDocIds) {
      previousSelectedDocIds.forEach((docId) => {
        const object = scene.getObjectByProperty('uuid', docId);

        if (object) {
          object.userData = { ...object.userData, isSelected: false };

          object.children.forEach((child) => {
            child.visible =
              child.name === ObjectChildValues.notSelected ? true : false;
          });
        }
      });
    }

    selectedDocumentIds.forEach((docId) => {
      const object = scene.getObjectByProperty('uuid', docId);

      if (object) {
        object.userData = { ...object.userData, isSelected: true };
        object.children.forEach((child) => {
          child.visible =
            child.name === ObjectChildValues.selected ? true : false;
        });
      }
    });
    renderScene();
  }, [scene, selectedDocumentIds, previousSelectedDocIds, renderScene]);

  useEffect(() => {
    if (!location) return;
    addlocationPointToScene(documentToWorldMatrix, scene, [
      location.x,
      location.y,
    ]);
    renderScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, scene, documentToWorldMatrix]);

  useEffect(() => {
    if (renderer.current && glContextToScreenFactor.current) {
      renderer.current.setSize(
        screen.width * glContextToScreenFactor.current,
        screen.height * glContextToScreenFactor.current
      );

      renderScene();
    }
  }, [screen, renderScene]);

  useEffect(() => {
    if (!updateDoc) return;

    const { document, status } = updateDoc;
    if (status === 'deleted')
      removeDocumentFromScene(document.resource.id, scene);
    else updateDocumentInScene(document, documentToWorldMatrix, scene, config);

    renderScene();
  }, [updateDoc, scene, documentToWorldMatrix, config, renderScene]);

  useEffect(() => {
    if (highlightedDocId) {
      addHighlightedDocToScene(highlightedDocId, scene);
      renderScene();
    }
  }, [highlightedDocId, scene, renderScene]);

  useEffect(() => {
    updatePointRadiusOfScene(
      geoDocuments,
      documentToWorldMatrix,
      config,
      scene,
      pointRadius
    );
    setMapSettings(preferences.currentProject, { pointRadius });
    selectedDocumentIds.forEach((docId) => {
      const object = scene.getObjectByProperty('uuid', docId);
      if (object) {
        object.userData = { ...object.userData, isSelected: true };
        object.children.forEach((child) => {
          child.visible =
            child.name === ObjectChildValues.selected ? true : false;
        });
      }
    });
    renderScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointRadius, scene, geoDocuments, documentToWorldMatrix, renderScene]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    glContext.current = gl;
    renderer.current = new Renderer({ gl: glContext.current });
    glContextToScreenFactor.current = width / screen.width;
    renderer.current.setSize(width, height);
    renderer.current.setClearColor(colors.containerBackground);

    camera.position.set(
      cameraDefaultPos.x,
      cameraDefaultPos.y,
      cameraDefaultPos.z
    );

    renderScene();
  };

  if (!camera || !scene.children.length) return null;

  return (
    <View style={styles.mapSettingsContainer}>
      {isSettingsModalOpen && (
        <MapSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          pointRadius={pointRadius}
          onChangePointRadius={(radius: number) => setPointRadius(radius)}
          layerInfo={layerInfo}
          showLayer={showLayer}
          focusMapOnLayer={focusMapOnDocumentId}
        />
      )}
      <TouchableOpacity
        onPress={() => setIsSettingsModalOpen(true)}
        style={styles.mapSettings}
      >
        <MaterialIcons name="layers" size={30} color="black" />
      </TouchableOpacity>
      <GLView
        onTouchStart={onPress}
        onTouchEnd={onTouchEnd}
        {...panResponder.panHandlers}
        style={styles.container}
        onContextCreate={onContextCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapSettingsContainer: {
    backgroundColor: colors.containerBackground,
    flex: 1,
  },
  mapSettings: {
    padding: 4,
    marginLeft: 'auto',
    margin: 4,
  },
});

export default GLMap;
