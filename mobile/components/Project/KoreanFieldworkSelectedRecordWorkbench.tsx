import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KoreanFieldworkRecordActionPanel from './KoreanFieldworkRecordActionPanel';
import KoreanFieldworkRecordContextPanel from './KoreanFieldworkRecordContextPanel';
import { getKoreanFieldworkCategoryLabel } from './korean-fieldwork-categories';
import {
  canReviseKoreanFieldworkIdentifier,
  getKoreanFieldworkFieldIdentifier,
  getKoreanFieldworkIdentifierRevisionHistory,
  getKoreanFieldworkIdentifierRevisionUpdates,
  getKoreanFieldworkReportIdentifier,
} from './korean-fieldwork-identifier-revision';
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
  const canReviseIdentifier = canReviseKoreanFieldworkIdentifier(document);

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

      {canReviseIdentifier && (
        <IdentifierRevisionPanel
          document={document}
          onApply={(updates) => onUpdateResourceFields(document, updates)}
        />
      )}

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

const IdentifierRevisionPanel: React.FC<{
  document: Document;
  onApply: (updates: Record<string, unknown>) => void;
}> = ({
  document,
  onApply,
}) => {
  const draftKey = `${document.resource.id}:${document.resource.identifier}:${getKoreanFieldworkReportIdentifier(document)}`;
  const [nextIdentifier, setNextIdentifier] = useState(
    getKoreanFieldworkReportIdentifier(document)
  );
  const [reason, setReason] = useState('');
  const fieldIdentifier = getKoreanFieldworkFieldIdentifier(document);
  const history = getKoreanFieldworkIdentifierRevisionHistory(document);
  const lastRevision = history[history.length - 1];
  const normalizedNextIdentifier = nextIdentifier.trim().replace(/\s+/g, ' ');
  const currentIdentifier = (document.resource.identifier || '').trim();
  const canApply = normalizedNextIdentifier.length > 0
    && normalizedNextIdentifier !== currentIdentifier;

  useEffect(() => {
    setNextIdentifier(getKoreanFieldworkReportIdentifier(document));
    setReason('');
  }, [draftKey, document]);

  return (
    <View style={styles.identifierSection} testID="identifierRevisionPanel">
      <View style={styles.identifierHeaderRow}>
        <MaterialIcons name="drive-file-rename-outline" size={17} color="#344054" />
        <Text style={styles.identifierTitle}>번호 정리</Text>
      </View>
      <View style={styles.identifierInfoRow}>
        <Text style={styles.identifierLabel}>현장번호</Text>
        <Text style={styles.identifierValue} numberOfLines={1}>
          {fieldIdentifier}
        </Text>
      </View>
      <View style={styles.identifierInputRow}>
        <View style={styles.identifierInputColumn}>
          <Text style={styles.identifierLabel}>정리번호</Text>
          <TextInput
            autoCorrect={false}
            onChangeText={setNextIdentifier}
            placeholder="조선시대 3호 수혈"
            placeholderTextColor="#98a2b3"
            style={styles.identifierInput}
            testID="identifierRevisionNextInput"
            value={nextIdentifier}
          />
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={!canApply}
          onPress={() => {
            const updates = getKoreanFieldworkIdentifierRevisionUpdates(
              document,
              { nextIdentifier, reason }
            );
            if (Object.keys(updates).length > 0) onApply(updates);
          }}
          style={[
            styles.identifierApplyButton,
            !canApply && styles.identifierApplyButtonDisabled,
          ]}
          testID="selectedRecordApplyIdentifierRevision"
        >
          <MaterialIcons
            name="done"
            size={16}
            color={canApply ? '#2f5f4a' : '#98a2b3'}
          />
          <Text
            style={[
              styles.identifierApplyText,
              !canApply && styles.identifierApplyTextDisabled,
            ]}
          >
            반영
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        autoCorrect={false}
        onChangeText={setReason}
        placeholder="변경 사유"
        placeholderTextColor="#98a2b3"
        style={styles.identifierReasonInput}
        testID="identifierRevisionReasonInput"
        value={reason}
      />
      {!!lastRevision && (
        <Text style={styles.identifierHistoryText} numberOfLines={1}>
          최근 변경: {lastRevision.previousIdentifier} → {lastRevision.nextIdentifier}
        </Text>
      )}
    </View>
  );
};

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
  identifierSection: {
    borderTopColor: '#eaecf0',
    borderTopWidth: 1,
    marginBottom: 10,
    marginTop: 4,
    paddingTop: 10,
  },
  identifierHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  identifierTitle: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 5,
  },
  identifierInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  identifierLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '900',
    marginRight: 7,
  },
  identifierValue: {
    color: '#1f2937',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  identifierInputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 8,
  },
  identifierInputColumn: {
    flex: 1,
    marginRight: 8,
  },
  identifierInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
    minHeight: 39,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  identifierApplyButton: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 39,
    paddingHorizontal: 10,
  },
  identifierApplyButtonDisabled: {
    backgroundColor: '#f2f4f7',
    borderColor: '#d0d5dd',
  },
  identifierApplyText: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  identifierApplyTextDisabled: {
    color: '#98a2b3',
  },
  identifierReasonInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  identifierHistoryText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
});

export default KoreanFieldworkSelectedRecordWorkbench;
