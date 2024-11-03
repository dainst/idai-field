import { Ionicons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Button from '@/components/common/Button';
import DocumentButton from '@/components/common/DocumentButton';
import Row from '@/components/common/Row';

interface DocumentsListProps {
  documents: Document[];
  onDocumentSelected: (document: Document) => void;
  onParentSelected: (document: Document) => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  onDocumentSelected,
  onParentSelected,
}) => {
  const onDrillDown = (document: Document) => {
    onParentSelected(document);
  };

  return (
    <ScrollView>
      {documents.map((document) => (
        <Row style={styles.row} key={document.resource.id}>
          <DocumentButton
            style={styles.documentButton}
            document={document}
            onPress={() => onDocumentSelected(document)}
            size={25}
          />
          <Button
            variant="transparent"
            onPress={() => onDrillDown(document)}
            icon={<Ionicons name="chevron-forward" size={18} />}
          />
        </Row>
      ))}
    </ScrollView>
  );
};

export default DocumentsList;

const styles = StyleSheet.create({
  row: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  documentButton: {
    flex: 1,
  },
});
