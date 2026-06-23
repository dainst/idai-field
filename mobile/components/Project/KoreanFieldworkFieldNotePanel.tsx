import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  buildKoreanFieldworkFieldNoteText,
  getKoreanFieldworkFieldNoteChecklist,
  getKoreanFieldworkFieldNoteSummaries,
  KoreanFieldworkFieldNoteInput,
  KoreanFieldworkFieldNoteMode,
} from './korean-fieldwork-field-notes';

interface KoreanFieldworkFieldNotePanelProps {
  selectedDocument: Document;
  documents: Document[];
  operationDocument?: Document;
  existingDailyLog?: Document;
  canCreateRecordMemo: boolean;
  canCreateDailyLog: boolean;
  isSaving?: boolean;
  onCreateNote: (
    mode: KoreanFieldworkFieldNoteMode,
    text: string
  ) => Promise<void>;
  onOpenDocument: (document: Document) => void;
}

const EMPTY_FIELD_NOTE_INPUT: KoreanFieldworkFieldNoteInput = {
  observation: '',
  interpretation: '',
  nextWork: '',
  evidenceNumbers: '',
};

const KoreanFieldworkFieldNotePanel: React.FC<
  KoreanFieldworkFieldNotePanelProps
> = ({
  selectedDocument,
  documents,
  operationDocument,
  existingDailyLog,
  canCreateRecordMemo,
  canCreateDailyLog,
  isSaving = false,
  onCreateNote,
  onOpenDocument,
}) => {
  const [mode, setMode] =
    useState<KoreanFieldworkFieldNoteMode>('recordMemo');
  const [noteInput, setNoteInput] =
    useState<KoreanFieldworkFieldNoteInput>(EMPTY_FIELD_NOTE_INPUT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const summaries = useMemo(
    () => getKoreanFieldworkFieldNoteSummaries(
      selectedDocument,
      documents,
      operationDocument
    ),
    [documents, operationDocument, selectedDocument]
  );
  const checklist = useMemo(
    () => getKoreanFieldworkFieldNoteChecklist(noteInput),
    [noteInput]
  );
  const selectedModeEnabled = mode === 'recordMemo'
    ? canCreateRecordMemo
    : canCreateDailyLog;
  const normalizedText = useMemo(
    () => buildKoreanFieldworkFieldNoteText(noteInput),
    [noteInput]
  );
  const isBusy = isSaving || isSubmitting;
  const isSaveDisabled =
    isBusy || !selectedModeEnabled || normalizedText.length === 0;

  useEffect(() => {
    if (mode === 'dailyLog' && !canCreateDailyLog && canCreateRecordMemo) {
      setMode('recordMemo');
    }
    if (mode === 'recordMemo' && !canCreateRecordMemo && canCreateDailyLog) {
      setMode('dailyLog');
    }
  }, [canCreateDailyLog, canCreateRecordMemo, mode]);

  useEffect(() => {
    setNoteInput(EMPTY_FIELD_NOTE_INPUT);
  }, [selectedDocument.resource.id]);

  const updateNoteInput = (
    fieldName: keyof KoreanFieldworkFieldNoteInput,
    value: string
  ) => {
    setNoteInput((currentInput) => ({
      ...currentInput,
      [fieldName]: value,
    }));
  };

  const saveNote = async () => {
    if (isSaveDisabled) return;

    try {
      setIsSubmitting(true);
      await onCreateNote(mode, normalizedText);
      setNoteInput(EMPTY_FIELD_NOTE_INPUT);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container} testID="fieldNotePanel">
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="edit-note" size={20} color="#175cd3" />
          <Text style={styles.title}>야장 입력</Text>
        </View>
        <Text style={styles.headerMeta} numberOfLines={1}>
          {selectedDocument.resource.identifier || selectedDocument.resource.id}
        </Text>
      </View>

      <View style={styles.modeRow}>
        <ModeButton
          icon="sticky-note-2"
          label="선택 기록 메모"
          detail="선택 기록에 연결"
          isActive={mode === 'recordMemo'}
          isDisabled={!canCreateRecordMemo}
          onPress={() => setMode('recordMemo')}
          testID="fieldNoteMode_recordMemo"
        />
        <ModeButton
          icon="event-note"
          label={existingDailyLog ? '오늘 일지에 추가' : '오늘 작업일지'}
          detail={operationDocument
            ? operationDocument.resource.identifier
            : '조사구역 필요'}
          isActive={mode === 'dailyLog'}
          isDisabled={!canCreateDailyLog}
          onPress={() => setMode('dailyLog')}
          testID="fieldNoteMode_dailyLog"
        />
      </View>

      <View style={styles.checklistRow}>
        {checklist.map((item) => (
          <View
            key={item.id}
            style={[
              styles.checklistChip,
              item.isComplete && styles.checklistChipComplete,
            ]}
            testID={`fieldNoteChecklist_${item.id}`}
          >
            <MaterialIcons
              name={item.isComplete ? 'check-circle' : 'radio-button-unchecked'}
              size={14}
              color={item.isComplete ? '#027a48' : '#667085'}
            />
            <View style={styles.checklistText}>
              <Text
                style={[
                  styles.checklistLabel,
                  item.isComplete && styles.checklistLabelComplete,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text style={styles.checklistDetail} numberOfLines={1}>
                {item.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <FieldNoteInputBlock
        icon="visibility"
        label="관찰 내용"
        onChangeText={(value) => updateNoteInput('observation', value)}
        placeholder="색, 토질, 형태, 경계, 절단관계처럼 현장에서 본 사실"
        testID="fieldNoteTextInput"
        value={noteInput.observation ?? ''}
      />
      <FieldNoteInputBlock
        icon="psychology"
        label="해석"
        onChangeText={(value) => updateNoteInput('interpretation', value)}
        placeholder="수혈·주혈·구상유구 등으로 보는 이유와 아직 애매한 점"
        testID="fieldNoteInterpretationInput"
        value={noteInput.interpretation ?? ''}
      />
      <FieldNoteInputBlock
        icon="task-alt"
        label="다음 작업"
        onChangeText={(value) => updateNoteInput('nextWork', value)}
        placeholder="사진 보강, 단면 정리, 실측, 유물·시료 수습 등"
        testID="fieldNoteNextWorkInput"
        value={noteInput.nextWork ?? ''}
      />
      <FieldNoteInputBlock
        icon="tag"
        label="사진·도면·유물·시료 번호"
        minHeight={52}
        onChangeText={(value) => updateNoteInput('evidenceNumbers', value)}
        placeholder="예: 사진 12-15, 도면 3, 유물 24, 시료 S-02"
        testID="fieldNoteEvidenceNumbersInput"
        value={noteInput.evidenceNumbers ?? ''}
      />

      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={isSaveDisabled}
          onPress={saveNote}
          style={[
            styles.saveButton,
            isSaveDisabled && styles.saveButtonDisabled,
          ]}
          testID="fieldNoteSave"
        >
          <MaterialIcons
            name={mode === 'dailyLog' ? 'playlist-add-check' : 'save'}
            size={17}
            color={isSaveDisabled ? '#98a2b3' : 'white'}
          />
          <Text
            style={[
              styles.saveButtonText,
              isSaveDisabled && styles.saveButtonTextDisabled,
            ]}
          >
            {getSaveLabel(mode, existingDailyLog, isBusy)}
          </Text>
        </TouchableOpacity>
      </View>

      {summaries.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          {summaries.map((summary) => (
            <TouchableOpacity
              activeOpacity={0.86}
              key={summary.document.resource.id}
              onPress={() => onOpenDocument(summary.document)}
              style={styles.summaryChip}
              testID={`fieldNoteSummary_${summary.document.resource.id}`}
            >
              <Text style={styles.summaryCategory} numberOfLines={1}>
                {summary.categoryLabel}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {summary.label}
              </Text>
              <Text style={styles.summaryDetail} numberOfLines={2}>
                {summary.detail}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const ModeButton: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  detail: string;
  isActive: boolean;
  isDisabled: boolean;
  onPress: () => void;
  testID: string;
}> = ({
  icon,
  label,
  detail,
  isActive,
  isDisabled,
  onPress,
  testID,
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    disabled={isDisabled}
    onPress={onPress}
    style={[
      styles.modeButton,
      isActive && styles.modeButtonActive,
      isDisabled && styles.modeButtonDisabled,
    ]}
    testID={testID}
  >
    <MaterialIcons
      name={icon}
      size={17}
      color={isDisabled ? '#98a2b3' : isActive ? '#175cd3' : '#475467'}
    />
    <View style={styles.modeText}>
      <Text
        style={[
          styles.modeLabel,
          isActive && styles.modeLabelActive,
          isDisabled && styles.modeTextDisabled,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[styles.modeDetail, isDisabled && styles.modeTextDisabled]}
        numberOfLines={1}
      >
        {detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const FieldNoteInputBlock: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  minHeight?: number;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID: string;
  value: string;
}> = ({
  icon,
  label,
  minHeight = 78,
  onChangeText,
  placeholder,
  testID,
  value,
}) => (
  <View style={styles.inputBlock}>
    <View style={styles.inputLabelRow}>
      <MaterialIcons name={icon} size={15} color="#344054" />
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <TextInput
      multiline
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#667085"
      style={[styles.input, { minHeight }]}
      testID={testID}
      textAlignVertical="top"
      value={value}
    />
  </View>
);

const getSaveLabel = (
  mode: KoreanFieldworkFieldNoteMode,
  existingDailyLog: Document | undefined,
  isBusy: boolean
): string => {
  if (isBusy) return '저장 중';
  if (mode === 'dailyLog') return existingDailyLog ? '일지에 추가' : '일지 만들기';
  return '메모 저장';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#b7c6d8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 5,
  },
  headerMeta: {
    color: '#667085',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
    textAlign: 'right',
  },
  modeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modeButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: 9,
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    marginTop: 10,
  },
  checklistChip: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 3,
    minHeight: 42,
    paddingHorizontal: 8,
    width: '48%',
  },
  checklistChipComplete: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  checklistText: {
    flex: 1,
    marginLeft: 5,
    minWidth: 0,
  },
  checklistLabel: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '900',
  },
  checklistLabelComplete: {
    color: '#027a48',
  },
  checklistDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  inputBlock: {
    marginTop: 10,
  },
  inputLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  inputLabel: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  modeButtonActive: {
    backgroundColor: '#eff8ff',
    borderColor: '#84caff',
  },
  modeButtonDisabled: {
    backgroundColor: '#f2f4f7',
  },
  modeText: {
    flex: 1,
    marginLeft: 6,
  },
  modeLabel: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
  },
  modeLabelActive: {
    color: '#175cd3',
  },
  modeDetail: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  modeTextDisabled: {
    color: '#98a2b3',
  },
  input: {
    backgroundColor: '#fcfcfd',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    color: '#101828',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#175cd3',
    borderRadius: 6,
    flexDirection: 'row',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#eaecf0',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  saveButtonTextDisabled: {
    color: '#98a2b3',
  },
  summaryRow: {
    paddingTop: 10,
  },
  summaryChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 76,
    padding: 9,
    width: 190,
  },
  summaryCategory: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryDetail: {
    color: '#475467',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
});

export default KoreanFieldworkFieldNotePanel;
