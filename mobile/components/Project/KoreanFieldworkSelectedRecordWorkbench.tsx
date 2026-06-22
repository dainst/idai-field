import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import KoreanFieldworkRecordActionPanel from './KoreanFieldworkRecordActionPanel';
import KoreanFieldworkRecordContextPanel from './KoreanFieldworkRecordContextPanel';
import { getKoreanFieldworkCategoryLabel } from './korean-fieldwork-categories';
import { formatKoreanFieldworkParentPath } from './korean-fieldwork-record-summary';

interface KoreanFieldworkSelectedRecordWorkbenchProps {
  document: Document;
  documents: Document[];
  allowedAddCategoryNames: string[];
  onAddChild: (document: Document) => void;
  onAddDocumentOfCategory: (parentDoc: Document, categoryName: string) => void;
  onClearSelection: () => void;
  onEditDocument: (document: Document) => void;
  onOpenDocument: (document: Document) => void;
  onOpenMapDocument: (document: Document) => void;
  onUpdateResourceFields: (
    document: Document,
    updates: Record<string, unknown>
  ) => void;
}

const KoreanFieldworkSelectedRecordWorkbench: React.FC<
  KoreanFieldworkSelectedRecordWorkbenchProps
> = ({
  document,
  documents,
  allowedAddCategoryNames,
  onAddChild,
  onAddDocumentOfCategory,
  onClearSelection,
  onEditDocument,
  onOpenDocument,
  onOpenMapDocument,
  onUpdateResourceFields,
}) => {
  const documentsById = useMemo(
    () => new Map(documents.map((candidate) => [
      candidate.resource.id,
      candidate,
    ])),
    [documents]
  );
  const parentPath = formatKoreanFieldworkParentPath(document, documentsById);
  const title = document.resource.identifier || document.resource.id;

  return (
    <View style={styles.container} testID="selectedRecordWorkbench">
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>선택 기록 작업대</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.contextLine} numberOfLines={1}>
            {getKoreanFieldworkCategoryLabel(document.resource.category)}
            {parentPath ? ` · ${parentPath}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="선택 해제"
          activeOpacity={0.82}
          hitSlop={8}
          onPress={onClearSelection}
          style={styles.closeButton}
          testID="selectedRecordClear"
        >
          <MaterialIcons name="close" size={18} color="#667085" />
        </TouchableOpacity>
      </View>

      <View style={styles.commandRow}>
        <CommandButton
          icon="map"
          label="지도"
          onPress={() => onOpenMapDocument(document)}
          testID="selectedRecordOpenMap"
        />
        <CommandButton
          icon="edit"
          label="편집"
          onPress={() => onEditDocument(document)}
          testID="selectedRecordEdit"
        />
        <CommandButton
          icon="add"
          label="하위"
          onPress={() => onAddChild(document)}
          testID="selectedRecordAddChild"
        />
      </View>

      <KoreanFieldworkRecordContextPanel
        document={document}
        documents={documents}
        allowedAddCategoryNames={allowedAddCategoryNames}
        onAddDocumentOfCategory={onAddDocumentOfCategory}
        onOpenDocument={onOpenDocument}
        onUpdateResourceFields={(updates) =>
          onUpdateResourceFields(document, updates)}
      />
      <KoreanFieldworkRecordActionPanel
        document={document}
        documents={documents}
        allowedAddCategoryNames={allowedAddCategoryNames}
        onAddDocumentOfCategory={onAddDocumentOfCategory}
        onOpenDocument={onOpenDocument}
      />
    </View>
  );
};

const CommandButton: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
}> = ({
  icon,
  label,
  onPress,
  testID,
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={styles.commandButton}
    testID={testID}
  >
    <MaterialIcons name={icon} size={17} color="#2f5f4a" />
    <Text style={styles.commandLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#a9c8b4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  kicker: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  contextLine: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 34,
  },
  commandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    marginTop: 10,
  },
  commandButton: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    marginTop: 5,
    minHeight: 37,
    paddingHorizontal: 10,
  },
  commandLabel: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
});

export default KoreanFieldworkSelectedRecordWorkbench;
