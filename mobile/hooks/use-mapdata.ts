import { Document, FieldGeometry, Query } from 'idai-field-core';
import { useCallback, useEffect, useState } from 'react';
import { LayoutRectangle } from 'react-native';
import { Matrix4 } from 'react-native-redash';
import {
  defineWorldCoordinateSystem,
  GeometryBoundings,
  getDocumentToWorldTransform,
  getDocumentToWorldTransformMatrix,
  getGeometryBoundings,
  getLayerCoordinates,
  getMinMaxGeometryCoords,
  getScreenToWorldTransformationMatrix,
  processTransform2d,
  Transformation,
} from '../components/Project/Map/GLMap/cs-transform';
import { DocumentRepository } from '@/repositories/document-repository';
import {
  viewBoxPaddingX,
  viewBoxPaddingY,
} from '../components/Project/Map/GLMap/constants';

const geoDocSearchQuery: Query = {
  q: '*',
  constraints: { 'geometry:exist': 'KNOWN' },
};

const layerDocSearchQuery: Query = {
  q: '*',
  constraints: { 'isMapLayerOf:exist': 'KNOWN' },
};

export type UpdatedDocument = {
  document: Document;
  status: 'updated' | 'deleted';
};

type mapDataReturn = [
  Document[],
  Document[],
  Matrix4 | undefined,
  Matrix4 | undefined,
  Transformation | undefined,
  (docId: string) => void,
  UpdatedDocument | undefined
];

const useMapData = (
  repository: DocumentRepository,
  selectedDocumentIds: string[],
  screen?: LayoutRectangle
): mapDataReturn => {
  const [geoDocuments, setGeoDocuments] = useState<Document[]>([]);
  const [layerDocuments, setLayerDocuments] = useState<Document[]>([]);
  const [geometryBoundings, setGeometryBoundings] =
    useState<GeometryBoundings | null>(null);
  const [documentToWorldMatrix, setDocumentToWorldMatrix] = useState<Matrix4>();
  const [screenToWorldMatrix, setScreenToWorldMatrix] = useState<Matrix4>();
  const [viewBox, setViewBox] = useState<Transformation>();
  const [updateDoc, setUpdateDoc] = useState<UpdatedDocument>();

  const focusMapOnDocumentIds = useCallback(
    async (docIds: string[]) => {
      if (!documentToWorldMatrix) return;

      try {
        const docs = await repository.getMultiple(docIds);
        const geometryBoundings = getDocumentsGeometryBoundings(docs);

        if (!geometryBoundings) return;

        const { minX, minY, maxX, maxY } = geometryBoundings;
        const [left, bottom] = processTransform2d(documentToWorldMatrix, [
          minX,
          minY,
        ]);
        const [right, top] = processTransform2d(documentToWorldMatrix, [
          maxX,
          maxY,
        ]);
        setViewBox(
          getDocumentToWorldTransform(
            {
              minX: left,
              minY: bottom,
              height: Math.max(top - bottom, right - left) + viewBoxPaddingY,
              width: Math.max(top - bottom, right - left) + viewBoxPaddingX,
            },
            defineWorldCoordinateSystem()
          )
        );
      } catch (error) {
        console.warn('Unable to focus map on selected documents', error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repository, documentToWorldMatrix]
  );

  const focusMapOnDocumentId = (docId: string) =>
    focusMapOnDocumentIds([docId]);

  const getDocumentsGeometryBoundings = (
    docs: Document[]
  ): GeometryBoundings | null => {
    const usableDocs = docs.filter(isUsableDocument);
    if (!usableDocs.length) return null;

    try {
      let geometryBoundings: GeometryBoundings | null;
      if (isDocumentLayer(usableDocs)) {
        const georeference = usableDocs[0].resource.georeference;
        if (!georeference) return null;
        const layerVertices = getLayerCoordinates(georeference);
        geometryBoundings = {
          minX: Math.min(
            layerVertices.bottomLeftCoordinates[0],
            layerVertices.topLeftCoordinates[0]
          ),
          maxX: Math.max(
            layerVertices.bottomRightCoordinates[0],
            layerVertices.topRightCoordinates[0]
          ),
          minY: Math.min(
            layerVertices.bottomLeftCoordinates[1],
            layerVertices.bottomRightCoordinates[1]
          ),
          maxY: Math.max(
            layerVertices.topLeftCoordinates[1],
            layerVertices.topRightCoordinates[1]
          ),
        };
      } else {
        const geoDocs = usableDocs
          .map((doc) => doc.resource.geometry || null)
          .filter((doc) => doc !== null) as FieldGeometry[];
        geometryBoundings = getMinMaxGeometryCoords(geoDocs);
      }

      return geometryBoundings;
    } catch (error) {
      console.warn('Unable to read map geometry bounds', error);
      return null;
    }
  };

  const isDocumentLayer = (documents: Document[]) => {
    if (documents.length > 1) return false;
    if (documents[0].resource.georeference) return true;
    else return false;
  };

  useEffect(() => {

    repository
      .find(geoDocSearchQuery)
      .then((result) => setGeoDocuments(result.documents))
      .catch((err) => console.log('Document not found. Error:', err));

    repository
      .find(layerDocSearchQuery)
      .then((result) =>
        setLayerDocuments(result.documents.filter(hasGeoreference))
      )
      .catch((err) => console.log('Document not found. Error:', err));

    const changedSubscription = repository
      .remoteChanged()
      .subscribe((changeInfo) => {
        const document = changeInfo.document;
        if (!isUsableDocument(document) || !Document.hasGeometry(document)) return;
        setUpdateDoc({ document, status: 'updated' });
      });

    return () => changedSubscription.unsubscribe();
  }, [repository]);

  useEffect(
    () => {
      try {
        setGeometryBoundings(getGeometryBoundings(geoDocuments, layerDocuments));
      } catch (error) {
        console.warn('Unable to calculate map bounds', error);
        setGeometryBoundings(null);
      }
    },
    [geoDocuments, layerDocuments]
  );

  useEffect(() => {
    const deletedSubscription = repository
      .deleted()
      .subscribe((document) => {
        if (isUsableDocument(document)) {
          setUpdateDoc({ document, status: 'deleted' });
        }
      });
    return () => deletedSubscription.unsubscribe();
  }, [repository]);

  useEffect(
    () =>
      setDocumentToWorldMatrix(
        getDocumentToWorldTransformMatrix(geometryBoundings)
      ),
    [geometryBoundings]
  );

  useEffect(() => {
    focusMapOnDocumentIds(selectedDocumentIds);
  }, [selectedDocumentIds, focusMapOnDocumentIds]);

  useEffect(() => {
    if (!screen) return;
    setScreenToWorldMatrix(getScreenToWorldTransformationMatrix(screen));
  }, [screen]);

  return [
    geoDocuments,
    layerDocuments,
    documentToWorldMatrix,
    screenToWorldMatrix,
    viewBox,
    focusMapOnDocumentId,
    updateDoc,
  ];
};

export default useMapData;

const hasGeoreference = (document: Document | null | undefined): document is Document =>
  isUsableDocument(document) && !!document.resource.georeference;

const isUsableDocument = (document: Document | null | undefined): document is Document =>
  !!document?.resource;
