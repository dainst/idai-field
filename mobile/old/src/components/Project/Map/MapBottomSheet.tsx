import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet from '../../common/BottomSheet';
import Button from '../../common/Button';
import DocumentButton from '../../common/DocumentButton';
import Row from '../../common/Row';
interface MapBottomSheetProps {
  document: Document | undefined;
  addDocument: (parentDoc: Document) => void;
  editDocument: (docId: string, categoryName: string) => void;
  removeDocument: (doc: Document) => void;
  focusHandler: (docId: string) => void;
}

const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  document,
  addDocument,
  editDocument,
  removeDocument,
  focusHandler,
}) => {
  const ICON_SIZE = 20;
  const snapPoints = useMemo(() => [0.1, 0.4, 0.8], []);

  if (!document) return null;

  const docId = document.resource.id;
  const addChildPressHandler = () => addDocument(document);

  return (
    <BottomSheet snapPointsFromTop={snapPoints}>
      <Row style={styles.buttonGroup}>
        <DocumentButton
          document={document}
          disabled={true}
          size={30}
          style={styles.docButton}
        />
        <Button
          style={[styles.button, styles.focusBtn]}
          title="Focus"
          onPress={() => focusHandler(docId)}
          icon={
            <MaterialIcons
              name="center-focus-strong"
              size={ICON_SIZE}
              color="#565350"
            />
          }
        />
        <Button
          style={styles.button}
          variant="success"
          title="Add Child"
          onPress={addChildPressHandler}
          icon={<Ionicons name="add" size={ICON_SIZE} />}
        />
        <Button
          style={styles.button}
          variant="primary"
          title="Edit"
          onPress={() => editDocument(docId, document.resource.category)}
          icon={<Ionicons name="create-outline" size={ICON_SIZE} />}
        />
        <Button
          style={styles.button}
          variant="danger"
          onPress={() => removeDocument(document)}
          icon={<Ionicons name="trash" size={16} />}
        />
      </Row>
      <View style={styles.docOverviewContainer}>
        {document.resource.shortDescription && (
          <View>
            <Text style={styles.fieldLabel}>Short Description:</Text>
            <Text style={{ paddingLeft: 10 }}>
              {document.resource.shortDescription}
            </Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  headingRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  heading: {
    paddingLeft: 5,
  },
  buttonGroup: {
    marginTop: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  docButton: {
    flex: 1,
  },
  button: {
    marginRight: 10,
  },
  focusBtn: {
    borderWidth: 1,
    borderColor: 'black',
  },
  docOverviewContainer: {
    padding: 5,
    backgroundColor: 'white',
    flex: 1,
  },
  fieldLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    paddingRight: 5,
  },
});

export default MapBottomSheet;
