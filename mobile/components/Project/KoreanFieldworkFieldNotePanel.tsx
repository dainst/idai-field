import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, {
  useEffect,
  useMemo,
  useRef,
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
  getKoreanFieldworkFieldNoteIssuePrompts,
  getKoreanFieldworkFieldNoteObservationPrompts,
  getKoreanFieldworkFieldNotePresets,
  getKoreanFieldworkFieldNoteRecordUpdates,
  getKoreanFieldworkFieldNoteReportPreview,
  getKoreanFieldworkFieldNoteSeedFromRecord,
  getKoreanFieldworkFieldNoteSummaries,
  KoreanFieldworkFieldNoteContinuationSeed,
  KoreanFieldworkFieldNoteEvidenceAction,
  KoreanFieldworkFieldNoteFollowUpAction,
  KoreanFieldworkFieldNoteGuidanceItem,
  KoreanFieldworkFieldNoteGuidanceTone,
  KoreanFieldworkFieldNoteHistoryItem,
  KoreanFieldworkFieldNoteInput,
  KoreanFieldworkFieldNoteIssuePrompt,
  KoreanFieldworkFieldNoteMode,
  KoreanFieldworkFieldNoteObservationPrompt,
  KoreanFieldworkFieldNotePreset,
  KoreanFieldworkFieldNoteRecordUpdates,
  KoreanFieldworkFieldNoteReportPreview,
  mergeKoreanFieldworkFieldNoteInput,
} from './korean-fieldwork-field-notes';
import {
  isKoreanFieldworkStylusPointer,
  KoreanFieldworkPointerInputEvent,
} from './korean-fieldwork-stylus-input';
import {
  buildKoreanFieldworkHandwritingNoteText,
  hasKoreanFieldworkHandwriting,
  KoreanFieldworkHandwritingPoint,
  KoreanFieldworkHandwritingStroke,
  normalizeKoreanFieldworkHandwritingStrokes,
  serializeKoreanFieldworkHandwriting,
} from './korean-fieldwork-handwriting';
import {
  createKoreanFieldworkFieldNoteDraftKey,
  hasKoreanFieldworkFieldNoteDraftText,
  loadKoreanFieldworkFieldNoteDraft,
  removeKoreanFieldworkFieldNoteDraft,
  saveKoreanFieldworkFieldNoteDraft,
} from './korean-fieldwork-field-note-drafts';
import {
  FIELDWORK_QUICK_FIELDS,
  getKoreanFieldworkChecklistQuickOptions,
  isKoreanFieldworkChecklistRecord,
  KoreanFieldworkQuickOption,
} from './korean-fieldwork-quick-record';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkFieldNotePanelProps {
  selectedDocument: Document;
  documents: Document[];
  operationDocument?: Document;
  existingDailyLog?: Document;
  draftScopeId?: string;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
  continuationSeed?: KoreanFieldworkFieldNoteContinuationSeed;
  allowedAddCategoryNames: string[];
  canCreateRecordMemo: boolean;
  canCreateDailyLog: boolean;
  isSaving?: boolean;
  onCreateNote: (
    mode: KoreanFieldworkFieldNoteMode,
    text: string
  ) => Promise<void>;
  onApplyToRecord?: (
    updates: KoreanFieldworkFieldNoteRecordUpdates
  ) => Promise<void> | void;
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
  investigationModeId,
  continuationSeed,
  allowedAddCategoryNames,
  canCreateRecordMemo,
  canCreateDailyLog,
  isSaving = false,
  onCreateNote,
  onApplyToRecord,
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
  const [recordApplyStatus, setRecordApplyStatus] =
    useState<string>();
  const [recordApplyStatusTone, setRecordApplyStatusTone] =
    useState<'success' | 'error'>('success');
  const [isApplyingToRecord, setIsApplyingToRecord] = useState(false);
  const [isApplyingWorkflowStep, setIsApplyingWorkflowStep] = useState(false);
  const [isSavingAndApplying, setIsSavingAndApplying] = useState(false);
  const [recordSeedStatus, setRecordSeedStatus] =
    useState<string>();
  const [issuePromptStatus, setIssuePromptStatus] =
    useState<string>();
  const [workflowChecklistStatus, setWorkflowChecklistStatus] =
    useState<string>();
  const [workflowChecklistStatusTone, setWorkflowChecklistStatusTone] =
    useState<'success' | 'error'>('success');
  const [workflowChecklistOverride, setWorkflowChecklistOverride] =
    useState<{ documentId: string; values: string[] }>();
  const [isStylusInputMode, setIsStylusInputMode] = useState(false);
  const [handwritingStrokes, setHandwritingStrokes] =
    useState<KoreanFieldworkHandwritingStroke[]>([]);
  const [appliedRecordUpdateSignature, setAppliedRecordUpdateSignature] =
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
  const recordSeed = useMemo(
    () => getKoreanFieldworkFieldNoteSeedFromRecord(
      selectedDocument,
      documents
    ),
    [documents, selectedDocument]
  );
  const hasRecordSeed = Object.values(recordSeed).some((value) =>
    typeof value === 'string' && value.length > 0
  );
  const guidanceItems = useMemo(
    () => getKoreanFieldworkFieldNoteGuidance(noteInput, selectedDocument),
    [noteInput, selectedDocument]
  );
  const issuePrompts = useMemo(
    () => getKoreanFieldworkFieldNoteIssuePrompts(
      selectedDocument,
      documents
    ),
    [documents, selectedDocument]
  );
  const reportPreview = useMemo(
    () => getKoreanFieldworkFieldNoteReportPreview(
      noteInput,
      selectedDocument
    ),
    [noteInput, selectedDocument]
  );
  const handwritingNoteText = useMemo(
    () => buildKoreanFieldworkHandwritingNoteText(handwritingStrokes),
    [handwritingStrokes]
  );
  const recordUpdates = useMemo(
    () => getKoreanFieldworkFieldNoteRecordUpdates(
      noteInput,
      selectedDocument,
      handwritingNoteText
    ),
    [handwritingNoteText, noteInput, selectedDocument]
  );
  const recordUpdateSignature = useMemo(
    () => JSON.stringify(recordUpdates),
    [recordUpdates]
  );
  const evidenceActions = useMemo(
    () => getKoreanFieldworkFieldNoteEvidenceActions(
      selectedDocument,
      documents,
      allowedAddCategoryNames
    ),
    [allowedAddCategoryNames, documents, selectedDocument]
  );
  const workflowChecklistOptions = useMemo(
    () => getKoreanFieldworkChecklistQuickOptions(investigationModeId),
    [investigationModeId]
  );
  const isWorkflowChecklistVisible =
    !!onApplyToRecord
    && isKoreanFieldworkChecklistRecord(
      selectedDocument.resource.category,
      investigationModeId
    );
  const workflowChecklistValues = workflowChecklistOverride?.documentId
    === selectedDocument.resource.id
    ? workflowChecklistOverride.values
    : getFieldNoteWorkflowChecklistValues(selectedDocument);
  const selectedModeEnabled = getModeEnabled(
    mode,
    canCreateRecordMemo,
    canCreateDailyLog
  );
  const normalizedText = useMemo(
    () => [
      buildKoreanFieldworkFieldNoteText(noteInput),
      handwritingNoteText,
    ].filter((value) => value.length > 0).join('\n'),
    [handwritingNoteText, noteInput]
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
  const hasDraftText = hasKoreanFieldworkFieldNoteDraftText(
    noteInput,
    handwritingStrokes
  );
  const hasPendingRecordUpdates =
    !!onApplyToRecord
    && Object.keys(recordUpdates).length > 0
    && appliedRecordUpdateSignature !== recordUpdateSignature;
  const isBusy =
    isSaving
    || isSubmitting
    || isApplyingToRecord
    || isApplyingWorkflowStep
    || isSavingAndApplying;
  const isSaveDisabled =
    isBusy || !selectedModeEnabled || normalizedText.length === 0;
  const isRecordApplyDisabled = isBusy || !hasPendingRecordUpdates;
  const isSaveAndApplyDisabled = isSaveDisabled || !hasPendingRecordUpdates;

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
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setWorkflowChecklistOverride(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setSavedFollowUpActions([]);
    setNoteInput(EMPTY_FIELD_NOTE_INPUT);
    setHandwritingStrokes([]);

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
          setHandwritingStrokes(draft.handwritingStrokes ?? []);
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
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
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
      handwritingStrokes,
      input: noteInput,
      mode,
      updatedAt: new Date().toISOString(),
    }).then(() => {
      if (isActive) setDraftStatus('saved');
    }).catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [
    draftKey,
    handwritingStrokes,
    hasDraftText,
    isDraftLoaded,
    mode,
    noteInput,
  ]);

  const updateNoteInput = (
    fieldName: keyof KoreanFieldworkFieldNoteInput,
    value: string
  ) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setNoteInput((currentInput) => ({
      ...currentInput,
      [fieldName]: value,
    }));
  };
  const handlePointerInput = (event: KoreanFieldworkPointerInputEvent) => {
    if (isKoreanFieldworkStylusPointer(event.nativeEvent?.pointerType)) {
      setIsStylusInputMode(true);
    }
  };
  const updateHandwritingStrokes = (
    nextStrokes: KoreanFieldworkHandwritingStroke[]
  ) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setHandwritingStrokes(normalizeKoreanFieldworkHandwritingStrokes(nextStrokes));
  };
  const applyPreset = (preset: KoreanFieldworkFieldNotePreset) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, preset.input)
    );
  };
  const applyObservationPrompt = (
    prompt: KoreanFieldworkFieldNoteObservationPrompt
  ) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setNoteInput((currentInput) =>
      applyKoreanFieldworkFieldNoteObservationPrompt(currentInput, prompt)
    );
  };
  const applyHistoryItem = (item: KoreanFieldworkFieldNoteHistoryItem) => {
    if (!item.canLoadIntoDraft) return;

    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, item.input)
    );
  };
  const applyRecordSeed = () => {
    if (!hasRecordSeed) return;

    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setRecordSeedStatus('기록 카드에서 불러옴');
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, recordSeed)
    );
  };
  const applyIssuePrompt = (prompt: KoreanFieldworkFieldNoteIssuePrompt) => {
    setSavedFollowUpActions([]);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setWorkflowChecklistStatus(undefined);
    setIssuePromptStatus('보강 항목에서 불러옴');
    setNoteInput((currentInput) =>
      mergeKoreanFieldworkFieldNoteInput(currentInput, prompt.input)
    );
  };
  const toggleWorkflowChecklistStep = async (
    option: KoreanFieldworkQuickOption
  ) => {
    if (!onApplyToRecord || isApplyingWorkflowStep) return;

    const nextValues = toggleFieldNoteWorkflowChecklistValue(
      workflowChecklistValues,
      option.value
    );

    setWorkflowChecklistOverride({
      documentId: selectedDocument.resource.id,
      values: nextValues,
    });
    setWorkflowChecklistStatus(undefined);
    setIsApplyingWorkflowStep(true);

    try {
      await onApplyToRecord({
        [FIELDWORK_QUICK_FIELDS.checklist]: nextValues,
      });
      setWorkflowChecklistStatusTone('success');
      setWorkflowChecklistStatus(`${option.label} 반영됨`);
    } catch {
      setWorkflowChecklistOverride(undefined);
      setWorkflowChecklistStatusTone('error');
      setWorkflowChecklistStatus(`${option.label} 반영 실패`);
    } finally {
      setIsApplyingWorkflowStep(false);
    }
  };
  const applyNoteToRecord = async () => {
    if (isRecordApplyDisabled || !onApplyToRecord) return;

    setIsApplyingToRecord(true);
    setRecordApplyStatus(undefined);
    try {
      await onApplyToRecord(recordUpdates);
      setRecordApplyStatusTone('success');
      setRecordApplyStatus('선택 기록에 반영됨');
      setAppliedRecordUpdateSignature(recordUpdateSignature);
    } catch {
      setRecordApplyStatusTone('error');
      setRecordApplyStatus('기록 반영 실패');
      setAppliedRecordUpdateSignature(undefined);
    } finally {
      setIsApplyingToRecord(false);
    }
  };

  const saveNote = async (applyToRecord = false) => {
    const shouldApplyToRecord = applyToRecord && hasPendingRecordUpdates;
    if (isSaveDisabled || (applyToRecord && !shouldApplyToRecord)) return;

    let didApplyToRecord = false;
    try {
      setIsSubmitting(true);
      setIsSavingAndApplying(applyToRecord);
      if (applyToRecord) setRecordApplyStatus(undefined);

      if (shouldApplyToRecord && onApplyToRecord) {
        await onApplyToRecord(recordUpdates);
        didApplyToRecord = true;
        setAppliedRecordUpdateSignature(recordUpdateSignature);
      }

      const followUpActions = getKoreanFieldworkFieldNoteFollowUpActions(
        noteInput,
        evidenceActions
      );
      await onCreateNote(mode, normalizedText);
      if (shouldApplyToRecord) {
        setRecordApplyStatusTone('success');
        setRecordApplyStatus('저장·반영 완료');
      }
      if (draftKey) {
        await removeKoreanFieldworkFieldNoteDraft(draftKey)
          .catch(() => undefined);
      }
      setDraftStatus(undefined);
      setRecordSeedStatus(undefined);
      setIssuePromptStatus(undefined);
      setWorkflowChecklistStatus(undefined);
      setSavedFollowUpActions(followUpActions);
      setNoteInput(EMPTY_FIELD_NOTE_INPUT);
      setHandwritingStrokes([]);
    } catch {
      if (applyToRecord) {
        setRecordApplyStatusTone('error');
        setRecordApplyStatus('저장·반영 실패');
        if (!didApplyToRecord) setAppliedRecordUpdateSignature(undefined);
      }
    } finally {
      setIsSubmitting(false);
      setIsSavingAndApplying(false);
    }
  };
  const clearDraft = async () => {
    setNoteInput(EMPTY_FIELD_NOTE_INPUT);
    setDraftStatus(undefined);
    setContinuationStatus(undefined);
    setRecordApplyStatus(undefined);
    setRecordSeedStatus(undefined);
    setIssuePromptStatus(undefined);
    setWorkflowChecklistStatus(undefined);
    setAppliedRecordUpdateSignature(undefined);
    setSavedFollowUpActions([]);
    setHandwritingStrokes([]);
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => setIsStylusInputMode((current) => !current)}
            style={[
              styles.stylusModeButton,
              isStylusInputMode && styles.stylusModeButtonActive,
            ]}
            testID="fieldNoteStylusModeToggle"
          >
            <MaterialIcons
              name="draw"
              size={15}
              color={isStylusInputMode ? '#175cd3' : '#667085'}
            />
            <Text
              style={[
                styles.stylusModeText,
                isStylusInputMode && styles.stylusModeTextActive,
              ]}
            >
              펜 입력
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerMeta} numberOfLines={1}>
            {selectedDocument.resource.identifier || selectedDocument.resource.id}
          </Text>
        </View>
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

      {!!recordApplyStatus && (
        <View
          style={[
            styles.recordApplyStatusRow,
            recordApplyStatusTone === 'error'
            && styles.recordApplyStatusRowError,
          ]}
          testID="fieldNoteRecordApplyStatus"
        >
          <MaterialIcons
            name={recordApplyStatusTone === 'error'
              ? 'error-outline'
              : 'assignment-turned-in'}
            size={14}
            color={recordApplyStatusTone === 'error' ? '#b42318' : '#027a48'}
          />
          <Text
            style={[
              styles.recordApplyStatusLabel,
              recordApplyStatusTone === 'error'
              && styles.recordApplyStatusLabelError,
            ]}
          >
            {recordApplyStatus}
          </Text>
        </View>
      )}

      {!!recordSeedStatus && (
        <View style={styles.recordSeedStatusRow} testID="fieldNoteRecordSeedStatus">
          <MaterialIcons name="content-paste-go" size={14} color="#175cd3" />
          <Text style={styles.recordSeedStatusLabel}>
            {recordSeedStatus}
          </Text>
        </View>
      )}

      {!!issuePromptStatus && (
        <View style={styles.issuePromptStatusRow} testID="fieldNoteIssuePromptStatus">
          <MaterialIcons name="playlist-add-check" size={14} color="#b54708" />
          <Text style={styles.issuePromptStatusLabel}>
            {issuePromptStatus}
          </Text>
        </View>
      )}

      {!!workflowChecklistStatus && (
        <View
          style={[
            styles.workflowChecklistStatusRow,
            workflowChecklistStatusTone === 'error'
            && styles.workflowChecklistStatusRowError,
          ]}
          testID="fieldNoteWorkflowChecklistStatus"
        >
          <MaterialIcons
            name={workflowChecklistStatusTone === 'error'
              ? 'error-outline'
              : 'assignment-turned-in'}
            size={14}
            color={workflowChecklistStatusTone === 'error' ? '#b42318' : '#027a48'}
          />
          <Text
            style={[
              styles.workflowChecklistStatusLabel,
              workflowChecklistStatusTone === 'error'
              && styles.workflowChecklistStatusLabelError,
            ]}
          >
            {workflowChecklistStatus}
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

      {isWorkflowChecklistVisible && (
        <WorkflowChecklistPanel
          activeValues={workflowChecklistValues}
          isDisabled={isBusy}
          onToggle={toggleWorkflowChecklistStep}
          options={workflowChecklistOptions}
        />
      )}

      {hasRecordSeed && (
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={applyRecordSeed}
          style={styles.recordSeedButton}
          testID="fieldNoteLoadRecordSeed"
        >
          <MaterialIcons name="content-paste-go" size={17} color="#175cd3" />
          <View style={styles.recordSeedText}>
            <Text style={styles.recordSeedLabel} numberOfLines={1}>
              기록 카드 불러오기
            </Text>
            <Text style={styles.recordSeedDetail} numberOfLines={1}>
              설명·해석·연결 번호
            </Text>
          </View>
        </TouchableOpacity>
      )}

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

      {issuePrompts.length > 0 && (
        <View style={styles.issuePromptPanel}>
          <View style={styles.issuePromptHeader}>
            <MaterialIcons name="playlist-add-check" size={16} color="#344054" />
            <Text style={styles.issuePromptTitle}>기록 보강</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.issuePromptRow}
          >
            {issuePrompts.map((prompt) => (
              <IssuePromptButton
                key={prompt.id}
                onPress={() => applyIssuePrompt(prompt)}
                prompt={prompt}
              />
            ))}
          </ScrollView>
        </View>
      )}

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
        isStylusInputMode={isStylusInputMode}
        label="관찰 내용"
        onChangeText={(value) => updateNoteInput('observation', value)}
        onPointerInput={handlePointerInput}
        placeholder="색, 토질, 형태, 경계, 절단관계처럼 현장에서 본 사실"
        testID="fieldNoteTextInput"
        value={noteInput.observation ?? ''}
      />
      <FieldNoteInputBlock
        icon="psychology"
        isStylusInputMode={isStylusInputMode}
        label="해석"
        onChangeText={(value) => updateNoteInput('interpretation', value)}
        onPointerInput={handlePointerInput}
        placeholder="수혈·주혈·구상유구 등으로 보는 이유와 아직 애매한 점"
        testID="fieldNoteInterpretationInput"
        value={noteInput.interpretation ?? ''}
      />
      <FieldNoteInputBlock
        icon="task-alt"
        isStylusInputMode={isStylusInputMode}
        label="다음 작업"
        onChangeText={(value) => updateNoteInput('nextWork', value)}
        onPointerInput={handlePointerInput}
        placeholder="사진 보강, 단면 정리, 실측, 유물·시료 수습 등"
        testID="fieldNoteNextWorkInput"
        value={noteInput.nextWork ?? ''}
      />
      <FieldNoteInputBlock
        icon="tag"
        isStylusInputMode={isStylusInputMode}
        label="사진·도면·유물·시료 번호"
        minHeight={52}
        onChangeText={(value) => updateNoteInput('evidenceNumbers', value)}
        onPointerInput={handlePointerInput}
        placeholder="예: 사진 12-15, 도면 3, 유물 24, 시료 S-02"
        testID="fieldNoteEvidenceNumbersInput"
        value={noteInput.evidenceNumbers ?? ''}
      />
      {(isStylusInputMode || hasKoreanFieldworkHandwriting(handwritingStrokes)) && (
        <HandwritingPad
          isStylusInputMode={isStylusInputMode}
          onPointerInput={handlePointerInput}
          onStrokesChange={updateHandwritingStrokes}
          strokes={handwritingStrokes}
        />
      )}

      <View style={styles.footerRow}>
        {!!onApplyToRecord && (
          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isRecordApplyDisabled}
            onPress={applyNoteToRecord}
            style={[
              styles.applyRecordButton,
              isRecordApplyDisabled && styles.applyRecordButtonDisabled,
            ]}
            testID="fieldNoteApplyToRecord"
          >
            <MaterialIcons
              name="assignment-turned-in"
              size={17}
              color={isRecordApplyDisabled ? '#98a2b3' : '#2f5f4a'}
            />
            <Text
              style={[
                styles.applyRecordButtonText,
                isRecordApplyDisabled && styles.applyRecordButtonTextDisabled,
              ]}
            >
              {isApplyingToRecord ? '반영 중' : '기록 반영'}
            </Text>
          </TouchableOpacity>
        )}
        {!!onApplyToRecord && (
          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isSaveAndApplyDisabled}
            onPress={() => saveNote(true)}
            style={[
              styles.saveAndApplyButton,
              isSaveAndApplyDisabled && styles.saveAndApplyButtonDisabled,
            ]}
            testID="fieldNoteSaveAndApply"
          >
            <MaterialIcons
              name="done-all"
              size={17}
              color={isSaveAndApplyDisabled ? '#98a2b3' : 'white'}
            />
            <Text
              style={[
                styles.saveAndApplyButtonText,
                isSaveAndApplyDisabled && styles.saveAndApplyButtonTextDisabled,
              ]}
            >
              {isSavingAndApplying ? '저장·반영 중' : '저장·반영'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={isSaveDisabled}
          onPress={() => saveNote()}
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

const WorkflowChecklistPanel: React.FC<{
  activeValues: string[];
  isDisabled: boolean;
  onToggle: (option: KoreanFieldworkQuickOption) => void;
  options: readonly KoreanFieldworkQuickOption[];
}> = ({
  activeValues,
  isDisabled,
  onToggle,
  options,
}) => {
  const activeValueSet = new Set(activeValues);
  const activeOptionCount = options.filter((option) =>
    activeValueSet.has(option.value)
  ).length;

  return (
    <View
      style={styles.workflowChecklistPanel}
      testID="fieldNoteWorkflowChecklistPanel"
    >
      <View style={styles.workflowChecklistHeader}>
        <MaterialIcons name="fact-check" size={16} color="#344054" />
        <Text style={styles.workflowChecklistTitle}>조사 과정표</Text>
        <Text style={styles.workflowChecklistCount}>
          {activeOptionCount}/{options.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workflowChecklistRow}
      >
        {options.map((option) => {
          const isActive = activeValueSet.has(option.value);

          return (
            <TouchableOpacity
              activeOpacity={0.86}
              disabled={isDisabled}
              key={option.value}
              onPress={() => onToggle(option)}
              style={[
                styles.workflowChecklistChip,
                isActive && styles.workflowChecklistChipActive,
                isDisabled && styles.workflowChecklistChipDisabled,
              ]}
              testID={`fieldNoteWorkflowStep_${option.value}`}
            >
              <MaterialIcons
                name={isActive ? 'check-circle' : 'radio-button-unchecked'}
                size={15}
                color={isActive ? '#027a48' : '#667085'}
              />
              <Text
                style={[
                  styles.workflowChecklistChipText,
                  isActive && styles.workflowChecklistChipTextActive,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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

const IssuePromptButton: React.FC<{
  prompt: KoreanFieldworkFieldNoteIssuePrompt;
  onPress: () => void;
}> = ({ prompt, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={[
      styles.issuePromptButton,
      prompt.severity === 'critical' && styles.issuePromptButtonCritical,
    ]}
    testID={`fieldNoteIssuePrompt_${prompt.id}`}
  >
    <MaterialIcons
      name={prompt.severity === 'info' ? 'info-outline' : 'playlist-add'}
      size={16}
      color={prompt.severity === 'critical' ? '#b42318' : '#b54708'}
    />
    <View style={styles.issuePromptText}>
      <Text style={styles.issuePromptLabel} numberOfLines={1}>
        {prompt.label}
      </Text>
      <Text style={styles.issuePromptDetail} numberOfLines={2}>
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

const HandwritingPad: React.FC<{
  isStylusInputMode: boolean;
  onPointerInput: (event: KoreanFieldworkPointerInputEvent) => void;
  onStrokesChange: (strokes: KoreanFieldworkHandwritingStroke[]) => void;
  strokes: KoreanFieldworkHandwritingStroke[];
}> = ({
  isStylusInputMode,
  onPointerInput,
  onStrokesChange,
  strokes,
}) => {
  const activeStrokeRef = useRef<KoreanFieldworkHandwritingStroke>();
  const [activeStroke, setActiveStroke] =
    useState<KoreanFieldworkHandwritingStroke>();
  const visibleStrokes = activeStroke
    ? strokes.concat(activeStroke)
    : strokes;
  const strokeCount = strokes.length;
  const pointCount = useMemo(
    () => visibleStrokes.reduce((count, stroke) =>
      count + stroke.points.length, 0),
    [visibleStrokes]
  );
  const strokePreview = useMemo(
    () => serializeKoreanFieldworkHandwriting(strokes),
    [strokes]
  );
  const startStroke = (event: KoreanFieldworkPointerInputEvent) => {
    onPointerInput(event);
    const point = getHandwritingPoint(event);
    if (!point) return;

    setActiveHandwritingStroke(
      { points: [point] },
      activeStrokeRef,
      setActiveStroke
    );
  };
  const moveStroke = (event: KoreanFieldworkPointerInputEvent) => {
    const point = getHandwritingPoint(event);
    const currentStroke = activeStrokeRef.current;
    if (!point || !currentStroke) return;

    const previousPoint = currentStroke.points[currentStroke.points.length - 1];
    if (previousPoint && getPointDistance(previousPoint, point) < 3) return;

    setActiveHandwritingStroke(
      { points: currentStroke.points.concat(point) },
      activeStrokeRef,
      setActiveStroke
    );
  };
  const finishStroke = () => {
    finishHandwritingStroke(activeStrokeRef, setActiveStroke, strokes, onStrokesChange);
  };

  return (
    <View style={styles.handwritingPanel} testID="fieldNoteHandwritingPad">
      <View style={styles.handwritingHeader}>
        <View style={styles.handwritingTitleRow}>
          <MaterialIcons name="gesture" size={16} color="#344054" />
          <Text style={styles.handwritingTitle}>손그림 메모</Text>
          <Text style={styles.handwritingCount}>
            획 {strokeCount} · 점 {pointCount}
          </Text>
        </View>
        <View style={styles.handwritingActions}>
          <TouchableOpacity
            activeOpacity={0.86}
            disabled={strokeCount === 0}
            onPress={() => onStrokesChange(strokes.slice(0, -1))}
            style={[
              styles.handwritingActionButton,
              strokeCount === 0 && styles.handwritingActionButtonDisabled,
            ]}
            testID="fieldNoteHandwritingUndo"
          >
            <MaterialIcons
              name="undo"
              size={15}
              color={strokeCount === 0 ? '#98a2b3' : '#475467'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.86}
            disabled={strokeCount === 0}
            onPress={() => onStrokesChange([])}
            style={[
              styles.handwritingActionButton,
              strokeCount === 0 && styles.handwritingActionButtonDisabled,
            ]}
            testID="fieldNoteHandwritingClear"
          >
            <MaterialIcons
              name="delete-outline"
              size={15}
              color={strokeCount === 0 ? '#98a2b3' : '#b42318'}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View
        onPointerCancel={finishStroke}
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={finishStroke}
        style={[
          styles.handwritingCanvas,
          isStylusInputMode && styles.handwritingCanvasStylus,
        ]}
        testID="fieldNoteHandwritingCanvas"
      >
        {[0, 1, 2, 3].map((lineIndex) => (
          <View
            key={lineIndex}
            style={[
              styles.handwritingGuideLine,
              { top: 36 + lineIndex * 32 },
            ]}
          />
        ))}
        {visibleStrokes.flatMap((stroke, strokeIndex) =>
          toHandwritingSegments(stroke, strokeIndex, isStylusInputMode)
        )}
      </View>
      <Text
        style={styles.handwritingSerialized}
        testID="fieldNoteHandwritingSerialized"
      >
        {strokePreview}
      </Text>
    </View>
  );
};

const FieldNoteInputBlock: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  isStylusInputMode: boolean;
  label: string;
  minHeight?: number;
  onChangeText: (value: string) => void;
  onPointerInput: (event: KoreanFieldworkPointerInputEvent) => void;
  placeholder: string;
  testID: string;
  value: string;
}> = ({
  icon,
  isStylusInputMode,
  label,
  minHeight = 78,
  onChangeText,
  onPointerInput,
  placeholder,
  testID,
  value,
}) => (
  <View
    onPointerDown={onPointerInput}
    style={[styles.inputBlock, isStylusInputMode && styles.inputBlockStylus]}
    testID={`${testID}Block`}
  >
    <View style={styles.inputLabelRow}>
      <MaterialIcons name={icon} size={15} color="#344054" />
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <TextInput
      multiline
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#667085"
      style={[
        styles.input,
        { minHeight: isStylusInputMode ? Math.max(minHeight, 124) : minHeight },
        isStylusInputMode && styles.inputStylus,
      ]}
      testID={testID}
      textAlignVertical="top"
      value={value}
    />
  </View>
);

const getHandwritingPoint = (
  event: KoreanFieldworkPointerInputEvent
): KoreanFieldworkHandwritingPoint | undefined => {
  const { locationX, locationY } = event.nativeEvent ?? {};
  if (typeof locationX !== 'number' || typeof locationY !== 'number') {
    return undefined;
  }

  return {
    x: Math.max(0, Math.round(locationX)),
    y: Math.max(0, Math.round(locationY)),
  };
};

const setActiveHandwritingStroke = (
  stroke: KoreanFieldworkHandwritingStroke,
  activeStrokeRef: React.MutableRefObject<
    KoreanFieldworkHandwritingStroke | undefined
  >,
  setActiveStroke: React.Dispatch<
    React.SetStateAction<KoreanFieldworkHandwritingStroke | undefined>
  >
) => {
  activeStrokeRef.current = stroke;
  setActiveStroke(stroke);
};

const finishHandwritingStroke = (
  activeStrokeRef: React.MutableRefObject<
    KoreanFieldworkHandwritingStroke | undefined
  >,
  setActiveStroke: React.Dispatch<
    React.SetStateAction<KoreanFieldworkHandwritingStroke | undefined>
  >,
  strokes: KoreanFieldworkHandwritingStroke[],
  onStrokesChange: (strokes: KoreanFieldworkHandwritingStroke[]) => void
) => {
  const stroke = activeStrokeRef.current;
  activeStrokeRef.current = undefined;
  setActiveStroke(undefined);

  if (!stroke || stroke.points.length === 0) return;

  onStrokesChange(strokes.concat(stroke));
};

const getPointDistance = (
  pointA: KoreanFieldworkHandwritingPoint,
  pointB: KoreanFieldworkHandwritingPoint
): number => Math.sqrt(
  ((pointB.x - pointA.x) ** 2) + ((pointB.y - pointA.y) ** 2)
);

const toHandwritingSegments = (
  stroke: KoreanFieldworkHandwritingStroke,
  strokeIndex: number,
  isStylusInputMode: boolean
) => {
  const strokeWidth = isStylusInputMode ? 3 : 2;

  if (stroke.points.length === 1) {
    const [point] = stroke.points;

    return (
      <View
        key={`${strokeIndex}-dot`}
        style={[
          styles.handwritingDot,
          {
            height: strokeWidth + 2,
            left: point.x - ((strokeWidth + 2) / 2),
            top: point.y - ((strokeWidth + 2) / 2),
            width: strokeWidth + 2,
          },
        ]}
      />
    );
  }

  return stroke.points.slice(1).map((point, pointIndex) => {
    const previousPoint = stroke.points[pointIndex];
    const distance = getPointDistance(previousPoint, point);
    const angle = Math.atan2(
      point.y - previousPoint.y,
      point.x - previousPoint.x
    );

    return (
      <View
        key={`${strokeIndex}-${pointIndex}`}
        style={[
          styles.handwritingSegment,
          {
            height: strokeWidth,
            left: ((previousPoint.x + point.x) / 2) - (distance / 2),
            top: ((previousPoint.y + point.y) / 2) - (strokeWidth / 2),
            transform: [{ rotateZ: `${angle}rad` }],
            width: distance,
          },
        ]}
      />
    );
  });
};

const getFieldNoteWorkflowChecklistValues = (
  document: Document
): string[] => {
  const value = (document.resource as any)[FIELDWORK_QUICK_FIELDS.checklist];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
};

const toggleFieldNoteWorkflowChecklistValue = (
  currentValues: string[],
  value: string
): string[] => currentValues.includes(value)
  ? currentValues.filter((item) => item !== value)
  : currentValues.concat(value);

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
    case 'layerColorMemo':
    case 'soilProfilePhoto':
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
    marginLeft: 7,
    textAlign: 'right',
  },
  headerActions: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 8,
    minWidth: 0,
  },
  stylusModeButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 31,
    paddingHorizontal: 8,
  },
  stylusModeButtonActive: {
    backgroundColor: '#eff8ff',
    borderColor: '#84caff',
  },
  stylusModeText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 3,
  },
  stylusModeTextActive: {
    color: '#175cd3',
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
  recordApplyStatusRow: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  recordApplyStatusLabel: {
    color: '#027a48',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },
  recordApplyStatusRowError: {
    backgroundColor: '#fef3f2',
    borderColor: '#fecdca',
  },
  recordApplyStatusLabelError: {
    color: '#b42318',
  },
  recordSeedStatusRow: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  recordSeedStatusLabel: {
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },
  issuePromptStatusRow: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fedf89',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  issuePromptStatusLabel: {
    color: '#b54708',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },
  workflowChecklistStatusRow: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  workflowChecklistStatusRowError: {
    backgroundColor: '#fef3f2',
    borderColor: '#fecdca',
  },
  workflowChecklistStatusLabel: {
    color: '#027a48',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },
  workflowChecklistStatusLabelError: {
    color: '#b42318',
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
  workflowChecklistPanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  workflowChecklistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  workflowChecklistTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  workflowChecklistCount: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 'auto',
  },
  workflowChecklistRow: {
    paddingTop: 8,
  },
  workflowChecklistChip: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 38,
    paddingHorizontal: 9,
  },
  workflowChecklistChipActive: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  workflowChecklistChipDisabled: {
    opacity: 0.72,
  },
  workflowChecklistChipText: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  workflowChecklistChipTextActive: {
    color: '#027a48',
  },
  recordSeedButton: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 7,
    minHeight: 44,
    paddingHorizontal: 9,
  },
  recordSeedText: {
    flex: 1,
    marginLeft: 7,
    minWidth: 0,
  },
  recordSeedLabel: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
  },
  recordSeedDetail: {
    color: '#475467',
    fontSize: 11,
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
  issuePromptPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#fedf89',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  issuePromptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  issuePromptTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  issuePromptRow: {
    paddingTop: 8,
  },
  issuePromptButton: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fedf89',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 50,
    paddingHorizontal: 9,
    width: 154,
  },
  issuePromptButtonCritical: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  issuePromptText: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0,
  },
  issuePromptLabel: {
    color: '#b54708',
    fontSize: 12,
    fontWeight: '900',
  },
  issuePromptDetail: {
    color: '#475467',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
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
  inputBlockStylus: {
    marginTop: 12,
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
  inputStylus: {
    borderColor: '#84caff',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  handwritingPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  handwritingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  handwritingTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  handwritingTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  handwritingCount: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },
  handwritingActions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  handwritingActionButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    marginLeft: 5,
    width: 34,
  },
  handwritingActionButtonDisabled: {
    backgroundColor: '#f2f4f7',
  },
  handwritingCanvas: {
    backgroundColor: '#fffdf7',
    borderColor: '#e4d9bf',
    borderRadius: 6,
    borderWidth: 1,
    height: 168,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  handwritingCanvasStylus: {
    height: 212,
  },
  handwritingGuideLine: {
    backgroundColor: '#efe3c7',
    height: 1,
    left: 0,
    opacity: 0.85,
    position: 'absolute',
    right: 0,
  },
  handwritingSegment: {
    backgroundColor: '#101828',
    borderRadius: 2,
    position: 'absolute',
  },
  handwritingDot: {
    backgroundColor: '#101828',
    borderRadius: 4,
    position: 'absolute',
  },
  handwritingSerialized: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  footerRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  applyRecordButton: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  applyRecordButtonDisabled: {
    backgroundColor: '#f2f4f7',
    borderColor: '#d0d5dd',
  },
  applyRecordButtonText: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  applyRecordButtonTextDisabled: {
    color: '#98a2b3',
  },
  saveAndApplyButton: {
    alignItems: 'center',
    backgroundColor: '#2f5f4a',
    borderRadius: 6,
    flexDirection: 'row',
    marginRight: 8,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  saveAndApplyButtonDisabled: {
    backgroundColor: '#eaecf0',
  },
  saveAndApplyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  saveAndApplyButtonTextDisabled: {
    color: '#98a2b3',
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
