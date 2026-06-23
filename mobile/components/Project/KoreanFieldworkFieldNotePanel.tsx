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
  applyKoreanFieldworkFieldNoteObservationPrompt,
  buildKoreanFieldworkFieldNoteText,
  getKoreanFieldworkFieldNoteChecklist,
  getKoreanFieldworkFieldNoteEvidenceActions,
  getKoreanFieldworkFieldNoteFollowUpActions,
  getKoreanFieldworkFieldNoteGuidance,
  getKoreanFieldworkFieldNoteHistoryItems,
  getKoreanFieldworkFieldNoteObservationPrompts,
  getKoreanFieldworkFieldNotePresets,
  getKoreanFieldworkFieldNoteReportPreview,
  getKoreanFieldworkFieldNoteSummaries,
  KoreanFieldworkFieldNoteContinuationSeed,
  KoreanFieldworkFieldNoteEvidenceAction,
  KoreanFieldworkFieldNoteFollowUpAction,
  KoreanFieldworkFieldNoteGuidanceItem,
  KoreanFieldworkFieldNoteGuidanceTone,
  KoreanFieldworkFieldNoteHistoryItem,
  KoreanFieldworkFieldNoteInput,
  KoreanFieldworkFieldNoteMode,
  KoreanFieldworkFieldNoteObservationPrompt,
  KoreanFieldworkFieldNotePreset,
  KoreanFieldworkFieldNoteReportPreview,
  mergeKoreanFieldworkFieldNoteInput,
} from './korean-fieldwork-field-notes';
import {
  createKoreanFieldworkFieldNoteDraftKey,
  hasKoreanFieldworkFieldNoteDraftText,
  loadKoreanFieldworkFieldNoteDraft,
  removeKoreanFieldworkFieldNoteDraft,
  saveKoreanFieldworkFieldNoteDraft,
} from './korean-fieldwork-field-note-drafts';

interface KoreanFieldworkFieldNotePanelProps {
  selectedDocument: Document;
  documents: Document[];
  operationDocument?: Document;
  existingDailyLog?: Document;
  draftScopeId?: string;
  continuationSeed?: KoreanFieldworkFieldNoteContinuationSeed;
  allowedAddCategoryNames: string[];
  canCreateRecordMemo: boolean;
  canCreateDailyLog: boolean;
  isSaving?: boolean;
  onCreateNote: (
    mode: KoreanFieldworkFieldNoteMode,
    text: string
  ) => Promise<void>;
  onAddDocumentOfCategory: (document: Document, categoryName: string) => void;
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
  draftScopeId,
  continuationSeed,
  allowedAddCategoryNames,
  canCreateRecordMemo,
  canCreateDailyLog,
  isSaving = false,
  onCreateNote,
  onAddDocumentOfCategory,
  onOpenDocument,
}) => {
  const [mode, setMode] =
    useState<KoreanFieldworkFieldNoteMode>('recordMemo');
  const [noteInput, setNoteInput] =
    useState<KoreanFieldworkFieldNoteInput>(EMPTY_FIELD_NOTE_INPUT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] =
    useState<'loaded'|'saved'|undefined>();
  const [appliedContinuationSeedId, setAppliedContinuationSeedId] =
    useState<string>();
  const [continuationStatus, setContinuationStatus] =
    useState<string>();
  const [savedFollowUpActions, setSavedFollowUpActions] =
    useState<KoreanFieldworkFieldNoteFollowUpAction[]>([]);
  const summaries = useMemo(
    () => getKoreanFieldworkFieldNoteSummaries(
      selectedDocument,
      documents,
      operationDocument
    ),
    [documents, operationDocument, selectedDocument]
  );
  const historyItems = useMemo(
    () => getKoreanFieldworkFieldNoteHistoryItems(
      selectedDocument,
      documents,
      operationDocument
    ),
    [documents, operationDocument, selectedDocument]
  );
  const presets = useMemo(
    () => getKoreanFieldworkFieldNotePresets(selectedDocument),
    [selectedDocument]
  );
  const observationPrompts = useMemo(
    () => getKoreanFieldworkFieldNoteObservationPrompts(selectedDocument),
    [selectedDocument]
  );
  const checklist = useMemo(
    () => getKoreanFieldworkFieldNoteChecklist(noteInput),
    [noteInput]
  );
  const guidanceItems = useMemo(
    () => getKoreanFieldworkFieldNoteGuidance(noteInput, selectedDocument),
    [noteInput, selectedDocument]
  );
  const reportPreview = useMemo(
    () => getKoreanFieldworkFieldNoteReportPreview(
      noteInput,
      selectedDocument
    ),
    [noteInput, selectedDocument]
  );
  const evidenceActions = useMemo(
    () => getKoreanFieldworkFieldNoteEvidenceActions(
      selectedDocument,
      documents,
      allowedAddCategoryNames
    ),
    [allowedAddCategoryNames, documents, selectedDocument]
  );
  const selectedModeEnabled = getModeEnabled(
    mode,
    canCreateRecordMemo,
    canCreateDailyLog
  );
  const normalizedText = useMemo(
    () => buildKoreanFieldworkFieldNoteText(noteInput),
    [noteInput]
  );
  const draftKey = useMemo(
    () => draftScopeId
      ? createKoreanFieldworkFieldNoteDraftKey(
        draftScopeId,
        selectedDocument.resource.id
      )
      : undefined,
    [draftScopeId, selectedDocument.resource.id]
  );
  const hasDraftText = hasKoreanFieldworkFieldNoteDraftText(noteInput);
  const isBusy = isSaving || isSubmitting;
  const isSaveDisabled =
    isBusy || !selectedModeEnabled || normalizedText.length === 0;

  useEffect(() => {
    if (mode === 'both' && (!canCreateRecordMemo || !canCreateDailyLog)) {
      setMode(canCreateRecordMemo ? 'recordMemo' : 'dailyLog');
      return;
    }
    if (mode === 'dailyLog' && !canCreateDailyLog && canCreateRecordMemo) {
      setMode('recordMemo');
    }
    if (mode === 'recordMemo' && !canCreateRecordMemo && canCreateDailyLog) {
      setMode('dailyLog');
    }
  }, [canCreateDailyLog, canCreateRecordMemo, mode]);

  useEffect(() => {
    let isActive = true;

    setIsDraftLoaded(false);
    setDraftStatus(undefined);
    setAppliedContinuationSeedId(undefined);
    setContinuationStatus(undefined);
    setSavedFollowUpActions([]);
    setNoteInput(EMPTY_FIELD_NOTE_INPUT);

    if (!draftKey) {
      setIsDraftLoaded(true);
      return () => {
        isActive = false;
      };
    }

    loadKoreanFieldworkFieldNoteDraft(draftKey)
      .then((draft) => {
        if (!isActive) return;

        if (draft) {
          setNoteInput(draft.input);
          setDraftStatus('loaded');
          if (getModeEnabled(
            draft.mode,
            canCreateRecordMemo,
            canCreateDailyLog
          )) {
            setMode(draft.mode);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) setIsDraftLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, [
    canCreateDailyLog,
    canCreateRecordMemo,
    draftKey,
    selectedDocument.resource.id,
  ]);

  useEffect(() => {
    if (
      !continuationSeed
      || !isDraftLoaded
      || appliedContinuationSeedId === continuationSeed.id
    ) {
      return;
    }

    setSavedFollowUpActions([]);
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, continuationSeed.input)
    );
    setContinuationStatus(`${continuationSeed.sourceLabel}에서 가져옴`);
    setAppliedContinuationSeedId(continuationSeed.id);
  }, [
    appliedContinuationSeedId,
    continuationSeed,
    isDraftLoaded,
  ]);

  useEffect(() => {
    if (!draftKey || !isDraftLoaded) return;

    let isActive = true;

    if (!hasDraftText) {
      removeKoreanFieldworkFieldNoteDraft(draftKey)
        .then(() => {
          if (isActive) setDraftStatus(undefined);
        })
        .catch(() => undefined);
      return () => {
        isActive = false;
      };
    }

    saveKoreanFieldworkFieldNoteDraft(draftKey, {
      input: noteInput,
      mode,
      updatedAt: new Date().toISOString(),
    }).then(() => {
      if (isActive) setDraftStatus('saved');
    }).catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [draftKey, hasDraftText, isDraftLoaded, mode, noteInput]);

  const updateNoteInput = (
    fieldName: keyof KoreanFieldworkFieldNoteInput,
    value: string
  ) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setNoteInput((currentInput) => ({
      ...currentInput,
      [fieldName]: value,
    }));
  };
  const applyPreset = (preset: KoreanFieldworkFieldNotePreset) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, preset.input)
    );
  };
  const applyObservationPrompt = (
    prompt: KoreanFieldworkFieldNoteObservationPrompt
  ) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setNoteInput((currentInput) =>
      applyKoreanFieldworkFieldNoteObservationPrompt(currentInput, prompt)
    );
  };
  const applyHistoryItem = (item: KoreanFieldworkFieldNoteHistoryItem) => {
    if (!item.canLoadIntoDraft) return;

    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, item.input)
    );
  };

  const saveNote = async () => {
    if (isSaveDisabled) return;

    try {
      setIsSubmitting(true);
      const followUpActions = getKoreanFieldworkFieldNoteFollowUpActions(
        noteInput,
        evidenceActions
      );
      await onCreateNote(mode, normalizedText);
      if (draftKey) {
        await removeKoreanFieldworkFieldNoteDraft(draftKey)
          .catch(() => undefined);
      }
      setDraftStatus(undefined);
      setSavedFollowUpActions(followUpActions);
      setNoteInput(EMPTY_FIELD_NOTE_INPUT);
    } finally {
      setIsSubmitting(false);
    }
  };
  const clearDraft = async () => {
    setNoteInput(EMPTY_FIELD_NOTE_INPUT);
    setDraftStatus(undefined);
    setContinuationStatus(undefined);
    setSavedFollowUpActions([]);
    if (draftKey) {
      await removeKoreanFieldworkFieldNoteDraft(draftKey)
        .catch(() => undefined);
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

      {savedFollowUpActions.length > 0 && (
        <View style={styles.savedFollowUpPanel}>
          <View style={styles.savedFollowUpHeader}>
            <MaterialIcons name="check-circle" size={16} color="#027a48" />
            <View style={styles.savedFollowUpTitleText}>
              <Text style={styles.savedFollowUpTitle}>저장 완료</Text>
              <Text style={styles.savedFollowUpDetail} numberOfLines={2}>
                방금 쓴 야장과 이어지는 기록을 바로 남기세요.
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedFollowUpRow}
          >
            {savedFollowUpActions.map((action) => (
              <FollowUpActionButton
                action={action}
                key={action.id}
                onPress={() =>
                  onAddDocumentOfCategory(selectedDocument, action.categoryName)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {!!draftKey && (hasDraftText || draftStatus) && (
        <View style={styles.draftStatusRow}>
          <View style={styles.draftStatusText}>
            <MaterialIcons
              name={draftStatus === 'loaded' ? 'restore' : 'save-alt'}
              size={14}
              color="#175cd3"
            />
            <Text style={styles.draftStatusLabel}>
              {draftStatus === 'loaded' ? '임시저장 불러옴' : '임시저장됨'}
            </Text>
          </View>
          {hasDraftText && (
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={clearDraft}
              style={styles.draftClearButton}
              testID="fieldNoteDraftClear"
            >
              <MaterialIcons name="delete-outline" size={15} color="#b42318" />
              <Text style={styles.draftClearText}>지우기</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!!continuationStatus && (
        <View style={styles.continuationStatusRow} testID="fieldNoteContinuationStatus">
          <MaterialIcons name="subdirectory-arrow-right" size={14} color="#2f5f4a" />
          <Text style={styles.continuationStatusLabel}>
            {continuationStatus}
          </Text>
        </View>
      )}

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
        <ModeButton
          icon="library-add-check"
          label="둘 다 저장"
          detail="기록과 일지"
          isActive={mode === 'both'}
          isDisabled={!canCreateRecordMemo || !canCreateDailyLog}
          onPress={() => setMode('both')}
          testID="fieldNoteMode_both"
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetRow}
      >
        {presets.map((preset) => (
          <TouchableOpacity
            activeOpacity={0.86}
            key={preset.id}
            onPress={() => applyPreset(preset)}
            style={styles.presetButton}
            testID={`fieldNotePreset_${preset.id}`}
          >
            <MaterialIcons
              name={getPresetIcon(preset.id)}
              size={16}
              color="#2f5f4a"
            />
            <Text style={styles.presetButtonText} numberOfLines={1}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {observationPrompts.length > 0 && (
        <View style={styles.observationPromptPanel}>
          <View style={styles.observationPromptHeader}>
            <MaterialIcons name="checklist" size={16} color="#344054" />
            <Text style={styles.observationPromptTitle}>관찰 항목</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.observationPromptRow}
          >
            {observationPrompts.map((prompt) => (
              <ObservationPromptButton
                key={prompt.id}
                onPress={() => applyObservationPrompt(prompt)}
                prompt={prompt}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.guidancePanel}>
        <View style={styles.guidanceHeader}>
          <MaterialIcons name="rule" size={16} color="#344054" />
          <Text style={styles.guidanceTitle}>야장 안내</Text>
        </View>
        {guidanceItems.map((item) => (
          <GuidanceRow key={item.id} item={item} />
        ))}
      </View>

      {reportPreview && (
        <ReportPreviewCard preview={reportPreview} />
      )}

      {evidenceActions.length > 0 && (
        <View style={styles.evidenceActionPanel}>
          <View style={styles.evidenceActionHeader}>
            <MaterialIcons name="add-photo-alternate" size={16} color="#344054" />
            <Text style={styles.evidenceActionTitle}>연결 기록</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.evidenceActionRow}
          >
            {evidenceActions.map((action) => (
              <EvidenceActionButton
                action={action}
                key={action.id}
                onPress={() =>
                  onAddDocumentOfCategory(selectedDocument, action.categoryName)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {historyItems.length > 0 && (
        <View style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <MaterialIcons name="history" size={16} color="#344054" />
            <Text style={styles.historyTitle}>최근 야장</Text>
          </View>
          {historyItems.map((item) => (
            <HistoryRow
              item={item}
              key={item.document.resource.id}
              onLoad={() => applyHistoryItem(item)}
              onOpen={() => onOpenDocument(item.document)}
            />
          ))}
        </View>
      )}

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

const ObservationPromptButton: React.FC<{
  prompt: KoreanFieldworkFieldNoteObservationPrompt;
  onPress: () => void;
}> = ({ prompt, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={styles.observationPromptButton}
    testID={`fieldNoteObservationPrompt_${prompt.id}`}
  >
    <MaterialIcons name="add-task" size={16} color="#175cd3" />
    <View style={styles.observationPromptText}>
      <Text style={styles.observationPromptLabel} numberOfLines={1}>
        {prompt.label}
      </Text>
      <Text style={styles.observationPromptDetail} numberOfLines={1}>
        {prompt.detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const GuidanceRow: React.FC<{
  item: KoreanFieldworkFieldNoteGuidanceItem;
}> = ({ item }) => (
  <View
    style={[styles.guidanceRow, guidanceToneStyle(item.tone)]}
    testID={`fieldNoteGuidance_${item.id}`}
  >
    <MaterialIcons
      name={guidanceIcon(item.tone)}
      size={15}
      color={guidanceIconColor(item.tone)}
    />
    <View style={styles.guidanceText}>
      <Text style={styles.guidanceLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={styles.guidanceDetail} numberOfLines={2}>
        {item.detail}
      </Text>
    </View>
  </View>
);

const EvidenceActionButton: React.FC<{
  action: KoreanFieldworkFieldNoteEvidenceAction;
  onPress: () => void;
}> = ({ action, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={styles.evidenceActionButton}
    testID={`fieldNoteEvidenceAction_${action.id}`}
  >
    <MaterialIcons
      name={getEvidenceActionIcon(action.id)}
      size={17}
      color="#175cd3"
    />
    <View style={styles.evidenceActionText}>
      <Text style={styles.evidenceActionLabel} numberOfLines={1}>
        {action.label}
      </Text>
      <Text style={styles.evidenceActionDetail} numberOfLines={1}>
        {action.detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const FollowUpActionButton: React.FC<{
  action: KoreanFieldworkFieldNoteFollowUpAction;
  onPress: () => void;
}> = ({ action, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={styles.followUpActionButton}
    testID={`fieldNoteFollowUpAction_${action.id}`}
  >
    <MaterialIcons
      name={getEvidenceActionIcon(action.id)}
      size={18}
      color="#175cd3"
    />
    <View style={styles.followUpActionText}>
      <Text style={styles.followUpActionLabel} numberOfLines={1}>
        {action.label}
      </Text>
      <Text style={styles.followUpActionReason} numberOfLines={2}>
        {action.reason}
      </Text>
    </View>
  </TouchableOpacity>
);

const ReportPreviewCard: React.FC<{
  preview: KoreanFieldworkFieldNoteReportPreview;
}> = ({ preview }) => (
  <View style={styles.reportPreviewPanel} testID="fieldNoteReportPreview">
    <View style={styles.reportPreviewHeader}>
      <MaterialIcons name="article" size={16} color="#344054" />
      <Text style={styles.reportPreviewTitle} numberOfLines={1}>
        {preview.title}
      </Text>
    </View>
    <Text style={styles.reportPreviewSentence} numberOfLines={4}>
      {preview.sentence}
    </Text>
    {!!preview.supportingDetail && (
      <Text style={styles.reportPreviewSupport} numberOfLines={2}>
        {preview.supportingDetail}
      </Text>
    )}
    {preview.missingParts.length > 0 && (
      <View style={styles.reportPreviewMissingRow}>
        <MaterialIcons name="playlist-add" size={14} color="#b54708" />
        <Text style={styles.reportPreviewMissingText} numberOfLines={2}>
          보완하면 좋은 항목: {preview.missingParts.join(', ')}
        </Text>
      </View>
    )}
  </View>
);

const HistoryRow: React.FC<{
  item: KoreanFieldworkFieldNoteHistoryItem;
  onLoad: () => void;
  onOpen: () => void;
}> = ({ item, onLoad, onOpen }) => (
  <View
    style={styles.historyRow}
    testID={`fieldNoteHistory_${item.document.resource.id}`}
  >
    <View style={styles.historyText}>
      <View style={styles.historyMetaRow}>
        <Text style={styles.historyCategory} numberOfLines={1}>
          {item.categoryLabel}
        </Text>
        {!!item.dateLabel && (
          <Text style={styles.historyDate} numberOfLines={1}>
            {item.dateLabel}
          </Text>
        )}
      </View>
      <Text style={styles.historyLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={styles.historyDetail} numberOfLines={2}>
        {item.detail}
      </Text>
    </View>
    <View style={styles.historyActions}>
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={onOpen}
        style={styles.historyIconButton}
        testID={`fieldNoteHistoryOpen_${item.document.resource.id}`}
      >
        <MaterialIcons name="open-in-new" size={16} color="#344054" />
      </TouchableOpacity>
      {item.canLoadIntoDraft && (
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={onLoad}
          style={[styles.historyIconButton, styles.historyLoadButton]}
          testID={`fieldNoteHistoryLoad_${item.document.resource.id}`}
        >
          <MaterialIcons name="content-copy" size={16} color="#175cd3" />
        </TouchableOpacity>
      )}
    </View>
  </View>
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
  if (mode === 'both') return existingDailyLog ? '둘 다 저장' : '메모+일지';
  if (mode === 'dailyLog') return existingDailyLog ? '일지에 추가' : '일지 만들기';
  return '메모 저장';
};

const getModeEnabled = (
  mode: KoreanFieldworkFieldNoteMode,
  canCreateRecordMemo: boolean,
  canCreateDailyLog: boolean
): boolean => {
  if (mode === 'both') return canCreateRecordMemo && canCreateDailyLog;
  return mode === 'recordMemo' ? canCreateRecordMemo : canCreateDailyLog;
};

const getPresetIcon = (
  presetId: string
): keyof typeof MaterialIcons.glyphMap => {
  switch (presetId) {
    case 'boundary':
      return 'polyline';
    case 'photoDrawing':
      return 'photo-camera';
    case 'findSample':
    case 'findSampleContext':
      return 'inventory';
    case 'layer':
      return 'layers';
    case 'featureProgress':
      return 'account-tree';
    default:
      return 'edit-note';
  }
};

const getEvidenceActionIcon = (
  actionId: string
): keyof typeof MaterialIcons.glyphMap => {
  switch (actionId) {
    case 'photos':
    case 'soilProfilePhotos':
      return 'photo-camera';
    case 'drawings':
      return 'architecture';
    case 'finds':
      return 'inventory-2';
    case 'samples':
      return 'science';
    default:
      return 'add';
  }
};

const guidanceIcon = (
  tone: KoreanFieldworkFieldNoteGuidanceTone
): keyof typeof MaterialIcons.glyphMap => {
  switch (tone) {
    case 'complete':
      return 'check-circle';
    case 'attention':
      return 'priority-high';
    default:
      return 'lightbulb';
  }
};

const guidanceIconColor = (
  tone: KoreanFieldworkFieldNoteGuidanceTone
): string => {
  switch (tone) {
    case 'complete':
      return '#027a48';
    case 'attention':
      return '#b42318';
    default:
      return '#175cd3';
  }
};

const guidanceToneStyle = (
  tone: KoreanFieldworkFieldNoteGuidanceTone
) => {
  switch (tone) {
    case 'complete':
      return styles.guidanceRowComplete;
    case 'attention':
      return styles.guidanceRowAttention;
    default:
      return styles.guidanceRowGuide;
  }
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
  savedFollowUpPanel: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  savedFollowUpHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  savedFollowUpTitleText: {
    flex: 1,
    marginLeft: 7,
    minWidth: 0,
  },
  savedFollowUpTitle: {
    color: '#027a48',
    fontSize: 12,
    fontWeight: '900',
  },
  savedFollowUpDetail: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 1,
  },
  savedFollowUpRow: {
    paddingTop: 8,
  },
  followUpActionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 54,
    paddingHorizontal: 9,
    width: 172,
  },
  followUpActionText: {
    flex: 1,
    marginLeft: 7,
    minWidth: 0,
  },
  followUpActionLabel: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
  },
  followUpActionReason: {
    color: '#475467',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    marginTop: 2,
  },
  draftStatusRow: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  draftStatusText: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  draftStatusLabel: {
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },
  draftClearButton: {
    alignItems: 'center',
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 26,
    paddingHorizontal: 7,
  },
  draftClearText: {
    color: '#b42318',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 3,
  },
  continuationStatusRow: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  continuationStatusLabel: {
    color: '#2f5f4a',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
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
  presetRow: {
    paddingTop: 10,
  },
  presetButton: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    height: 34,
    marginRight: 7,
    paddingHorizontal: 9,
  },
  presetButtonText: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  observationPromptPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  observationPromptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  observationPromptTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  observationPromptRow: {
    paddingTop: 8,
  },
  observationPromptButton: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 44,
    paddingHorizontal: 9,
    width: 132,
  },
  observationPromptText: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0,
  },
  observationPromptLabel: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
  },
  observationPromptDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  guidancePanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  guidanceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  guidanceTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  guidanceRow: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 5,
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  guidanceRowComplete: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  guidanceRowGuide: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  guidanceRowAttention: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  guidanceText: {
    flex: 1,
    marginLeft: 7,
    minWidth: 0,
  },
  guidanceLabel: {
    color: '#27343b',
    fontSize: 12,
    fontWeight: '900',
  },
  guidanceDetail: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  reportPreviewPanel: {
    backgroundColor: '#fffbeb',
    borderColor: '#fedf89',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  reportPreviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  reportPreviewTitle: {
    color: '#344054',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  reportPreviewSentence: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  reportPreviewSupport: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 5,
  },
  reportPreviewMissingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  reportPreviewMissingText: {
    color: '#b54708',
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    marginLeft: 5,
  },
  evidenceActionPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  evidenceActionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  evidenceActionTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  evidenceActionRow: {
    paddingTop: 8,
  },
  evidenceActionButton: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 45,
    paddingHorizontal: 9,
    width: 142,
  },
  evidenceActionText: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0,
  },
  evidenceActionLabel: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
  },
  evidenceActionDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  historyPanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  historyTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  historyRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#eaecf0',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 6,
    minHeight: 62,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  historyText: {
    flex: 1,
    minWidth: 0,
  },
  historyMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  historyCategory: {
    color: '#175cd3',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 6,
  },
  historyDate: {
    color: '#667085',
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
  },
  historyLabel: {
    color: '#101828',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  historyDetail: {
    color: '#475467',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  historyActions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  historyIconButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginLeft: 5,
    width: 32,
  },
  historyLoadButton: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
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
