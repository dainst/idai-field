import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getKoreanFieldworkInvestigationMode,
  KOREAN_FIELDWORK_INVESTIGATION_MODES,
  KoreanFieldworkInvestigationModeId,
} from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkInvestigationModePanelProps {
  modeId?: KoreanFieldworkInvestigationModeId;
  onSelectMode: (modeId: KoreanFieldworkInvestigationModeId) => void;
  operationCount?: number;
  totalDocumentCount?: number;
  legacyRootDocumentCount?: number;
  surveyBoundaryCount?: number;
  boundarySummary?: string;
  onOpenMap?: () => void;
}

type SetupStepState = 'done'|'attention'|'todo';

const KoreanFieldworkInvestigationModePanel: React.FC<
  KoreanFieldworkInvestigationModePanelProps
> = ({
  modeId,
  onSelectMode,
  operationCount = 0,
  totalDocumentCount = 0,
  legacyRootDocumentCount = 0,
  surveyBoundaryCount = 0,
  boundarySummary,
  onOpenMap,
}) => {
  const selectedMode = getKoreanFieldworkInvestigationMode(modeId);
  const [isModeChoiceOpen, setIsModeChoiceOpen] = React.useState(!selectedMode);
  const [areRequirementsOpen, setAreRequirementsOpen] = React.useState(false);
  const hasOperation = operationCount > 0;
  const hasLegacyRootsWithoutOperation =
    !hasOperation && legacyRootDocumentCount > 0;
  const hasSurveyBoundary = surveyBoundaryCount > 0;
  const normalizedBoundarySummary = boundarySummary?.trim();
  const hasBoundarySummary = !!normalizedBoundarySummary;
  const hasBoundarySetup = hasSurveyBoundary || hasBoundarySummary;
  const boundaryStepState: SetupStepState = hasSurveyBoundary
    ? 'done'
    : hasBoundarySummary
      ? 'attention'
      : 'todo';
  const setupSteps: Array<{
    id: string;
    label: string;
    detail: string;
    state: SetupStepState;
    attentionText?: string;
  }> = [
    {
      id: 'mode',
      label: '조사 방식',
      detail: selectedMode ? selectedMode.label : '선택 필요',
      state: selectedMode ? 'done' : 'todo',
    },
    {
      id: 'boundary',
      label: '조사 경계',
      detail: hasSurveyBoundary
        ? `${surveyBoundaryCount}건 기록됨`
        : normalizedBoundarySummary ?? '구역선·기준지도 기록',
      state: boundaryStepState,
      attentionText: '지도 기록 필요',
    },
    {
      id: 'operation',
      label: '기록 시작',
      detail: hasOperation
        ? `${operationCount}건 시작됨`
        : hasLegacyRootsWithoutOperation
          ? `기존 기록 ${legacyRootDocumentCount}건 유지`
          : '경계 생성 후 가능',
      state: hasOperation ? 'done' : 'todo',
    },
  ];
  const nextSetupActionLabel = hasOperation
    ? '지도에 경계 기록 남기기'
    : '지도에서 조사 경계 생성';
  const nextSetupStepText = getNextSetupStepText(
    !!selectedMode,
    hasOperation,
    hasLegacyRootsWithoutOperation,
    hasBoundarySummary,
    hasSurveyBoundary
  );
  const shouldShowModeChoices = !selectedMode || isModeChoiceOpen;

  React.useEffect(() => {
    setIsModeChoiceOpen(!selectedMode);
    setAreRequirementsOpen(false);
  }, [modeId, selectedMode]);

  return (
    <View style={styles.container} testID="investigationModePanel">
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>프로젝트 조사 방식</Text>
          <Text style={styles.title}>
            {selectedMode ? selectedMode.label : '프로젝트 조사 방식을 정하세요'}
          </Text>
          <Text style={styles.subtitle}>
            조사 방식과 조사 경계는 프로젝트 초기에 정하는 기본값입니다.
          </Text>
        </View>
        {selectedMode && (
          <View style={styles.headerActions}>
            <View style={styles.primaryActionPill}>
              <MaterialIcons name="flag" size={14} color="#175cd3" />
              <Text style={styles.primaryActionText} numberOfLines={1}>
                {selectedMode.primaryAction}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={() => setIsModeChoiceOpen((current) => !current)}
              style={styles.modeChoiceToggle}
              testID="investigationModeToggleChoices"
            >
              <MaterialIcons
                name={isModeChoiceOpen ? 'expand-less' : 'edit'}
                size={14}
                color="#344054"
              />
              <Text style={styles.modeChoiceToggleText}>
                {isModeChoiceOpen ? '접기' : '변경'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {shouldShowModeChoices && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeRow}
          testID="investigationModeChoices"
        >
          {KOREAN_FIELDWORK_INVESTIGATION_MODES.map((mode) => {
            const isSelected = mode.id === modeId;

            return (
              <TouchableOpacity
                activeOpacity={0.86}
                key={mode.id}
                onPress={() => {
                  onSelectMode(mode.id);
                  setIsModeChoiceOpen(false);
                }}
                style={[
                  styles.modeButton,
                  isSelected && styles.modeButtonSelected,
                ]}
                testID={`investigationMode_${mode.id}`}
              >
                <Text
                  style={[
                    styles.modeLabel,
                    isSelected && styles.modeLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {mode.label}
                </Text>
                <Text
                  style={[
                    styles.modeDetail,
                    isSelected && styles.modeDetailSelected,
                  ]}
                  numberOfLines={2}
                >
                  {mode.detail}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selectedMode && (
        <View style={styles.requirementPanel}>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => setAreRequirementsOpen((current) => !current)}
            style={styles.requirementHeader}
            testID="investigationModeToggleRequirements"
          >
            <View style={styles.requirementHeaderText}>
              <Text style={styles.requirementTitle}>기본 확인 항목</Text>
              <Text style={styles.requirementSummary} numberOfLines={1}>
                {selectedMode.requirements.length}개 항목 · 필요할 때만 펼쳐 확인
              </Text>
            </View>
            <MaterialIcons
              name={areRequirementsOpen ? 'expand-less' : 'expand-more'}
              size={20}
              color="#344054"
            />
          </TouchableOpacity>
          {areRequirementsOpen && (
            <View style={styles.requirementGrid}>
              {selectedMode.requirements.map((requirement) => (
                <View key={requirement} style={styles.requirementChip}>
                  <MaterialIcons name="check" size={13} color="#2f6f4e" />
                  <Text style={styles.requirementText} numberOfLines={1}>
                    {requirement}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.setupPanel}>
        <View style={styles.setupHeader}>
          <View style={styles.setupHeaderText}>
            <Text style={styles.setupTitle}>프로젝트 시작 체크</Text>
            <Text style={styles.setupSubtitle}>
              {hasLegacyRootsWithoutOperation
                ? `기존 기록 ${totalDocumentCount}건은 유지하고 조사 경계 기준만 새로 잡습니다.`
                : '조사 방식과 조사 경계를 먼저 정하면 기록을 시작할 수 있습니다.'}
            </Text>
          </View>
          {onOpenMap && !hasSurveyBoundary && (
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={onOpenMap}
              style={styles.setupAction}
              testID="investigationModeOpenMap"
            >
              <MaterialIcons name="map" size={15} color="#175cd3" />
              <Text style={styles.setupActionText} numberOfLines={1}>
                {nextSetupActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.setupStepRow}>
          {setupSteps.map((step) => {
            const isDone = step.state === 'done';
            const needsAttention = step.state === 'attention';

            return (
              <View
                key={step.id}
                testID={`setupStep_${step.id}`}
                style={[
                  styles.setupStep,
                  isDone && styles.setupStepDone,
                  needsAttention && styles.setupStepAttention,
                ]}
              >
                <MaterialIcons
                  name={isDone
                    ? 'check-circle'
                    : needsAttention
                      ? 'error-outline'
                      : 'radio-button-unchecked'}
                  size={15}
                  color={isDone
                    ? '#027a48'
                    : needsAttention
                      ? '#b54708'
                      : '#98a2b3'}
                />
                <View style={styles.setupStepText}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.setupStepLabel,
                      isDone && styles.setupStepLabelDone,
                      needsAttention && styles.setupStepLabelAttention,
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text numberOfLines={1} style={styles.setupStepDetail}>
                    {step.detail}
                  </Text>
                  {needsAttention && step.attentionText && (
                    <Text
                      numberOfLines={1}
                      style={styles.setupStepAttentionText}
                    >
                      {step.attentionText}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <View
          style={[
            styles.nextStepBox,
            hasOperation && hasBoundarySetup && styles.nextStepBoxDone,
          ]}
        >
          <MaterialIcons
            name={hasOperation && hasBoundarySetup ? 'task-alt' : 'near-me'}
            size={16}
            color={hasOperation && hasBoundarySetup ? '#027a48' : '#175cd3'}
          />
          <Text
            style={[
              styles.nextStepText,
              hasOperation && hasBoundarySetup && styles.nextStepTextDone,
            ]}
          >
            {nextSetupStepText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const getNextSetupStepText = (
  hasMode: boolean,
  hasOperation: boolean,
  hasRecordsWithoutOperation: boolean,
  hasBoundarySummary: boolean,
  hasSurveyBoundary: boolean
): string => {
  if (!hasMode) return '다음: 프로젝트 조사 방식을 먼저 고르세요.';
  if (hasRecordsWithoutOperation) {
    return '다음: 지도에서 조사 경계를 생성하세요. 기존 기록은 유지됩니다.';
  }
  if (!hasOperation) return '다음: 지도에서 조사 경계를 생성하세요.';
  if (!hasBoundarySummary && !hasSurveyBoundary) {
    return '다음: 조사 경계 기준을 정하거나 지도에 경계를 남기세요.';
  }
  if (hasBoundarySummary && !hasSurveyBoundary) {
    return '시작 가능. 지도에 조사 경계 도형을 남기면 경계 확인까지 끝납니다.';
  }

  return '시작 준비 완료. 이제 현장 기록을 추가하면 됩니다.';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    color: '#27343b',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  subtitle: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 3,
  },
  primaryActionPill: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginLeft: 8,
    maxWidth: 160,
    minHeight: 30,
    paddingHorizontal: 8,
  },
  headerActions: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  primaryActionText: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  modeRow: {
    paddingTop: 10,
  },
  modeButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 74,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: 154,
  },
  modeButtonSelected: {
    backgroundColor: '#ecfdf3',
    borderColor: '#7fbc8c',
  },
  modeLabel: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '900',
  },
  modeLabelSelected: {
    color: '#1f5f43',
  },
  modeDetail: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  modeDetailSelected: {
    color: '#2f6f4e',
  },
  requirementPanel: {
    marginTop: 10,
  },
  requirementHeader: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  requirementHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  requirementTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
  },
  requirementSummary: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 1,
  },
  requirementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  requirementChip: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 6,
    marginRight: 6,
    maxWidth: '48%',
    minHeight: 28,
    paddingHorizontal: 7,
  },
  requirementText: {
    color: '#344054',
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  modeChoiceToggle: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 6,
    minHeight: 28,
    paddingHorizontal: 8,
  },
  modeChoiceToggleText: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  setupPanel: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
  setupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  setupHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  setupTitle: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '900',
  },
  setupSubtitle: {
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 3,
  },
  setupAction: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#84caff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginLeft: 8,
    maxWidth: 170,
    minHeight: 32,
    paddingHorizontal: 8,
  },
  setupActionText: {
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  setupStepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  setupStep: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 6,
    marginTop: 6,
    minHeight: 38,
    paddingHorizontal: 8,
    width: '31%',
  },
  setupStepDone: {
    backgroundColor: '#ecfdf3',
    borderColor: '#7fbc8c',
  },
  setupStepAttention: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
  },
  setupStepText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 5,
  },
  setupStepLabel: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '900',
  },
  setupStepLabelDone: {
    color: '#027a48',
  },
  setupStepLabelAttention: {
    color: '#b54708',
  },
  setupStepDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
  },
  setupStepAttentionText: {
    color: '#b54708',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 14,
  },
  nextStepBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#84caff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 34,
    paddingHorizontal: 9,
  },
  nextStepBoxDone: {
    backgroundColor: '#ecfdf3',
    borderColor: '#7fbc8c',
  },
  nextStepText: {
    color: '#175cd3',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 6,
  },
  nextStepTextDone: {
    color: '#027a48',
  },
});

export default KoreanFieldworkInvestigationModePanel;
