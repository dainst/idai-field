import { Ionicons } from '@expo/vector-icons';
import {
  KOREAN_FIELDWORK_PROJECT_LABEL,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
} from '@/constants/korean-fieldwork-project';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import {
  KOREAN_FIELDWORK_INVESTIGATION_MODES,
  KoreanFieldworkInvestigationModeId,
  saveKoreanFieldworkBoundarySummary,
  saveKoreanFieldworkInvestigationModeId,
} from '@/components/Project/korean-fieldwork-investigation-mode';
import { colors } from '@/utils/colors';
import {
  getProjectNameInvalidText,
  validateProjectName,
} from './project-name-validation';

interface CreateProjectModalProps {
  existingProjects?: string[];
  onProjectCreated: (project: string, languages?: string[]) => void;
  onClose: () => void;
}

const KOREAN_FIELDWORK_START_STEPS = [
  '프로젝트 기본 조사 방식을 정합니다.',
  '조사 경계 기준을 문장으로 남깁니다.',
  '프로젝트 생성 후 지도에서 경계를 그리거나 가져옵니다.',
];

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  existingProjects = [],
  onProjectCreated,
  onClose,
}) => {
  const [project, setProject] = useState<string>('');
  const [projectTouched, setProjectTouched] = useState<boolean>(false);
  const [investigationModeId, setInvestigationModeId] =
    useState<KoreanFieldworkInvestigationModeId>();
  const [boundarySummary, setBoundarySummary] = useState<string>('');
  const [boundarySummaryTouched, setBoundarySummaryTouched] =
    useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const projectNameValidation = validateProjectName(project, existingProjects);
  const { projectId } = projectNameValidation;
  const isBoundarySummaryValid = boundarySummary.trim().length > 0;
  const canCreateProject =
    projectNameValidation.isAvailable && !!investigationModeId && isBoundarySummaryValid;
  const showProjectNameError = projectTouched && !projectNameValidation.isAvailable;
  const showInvestigationModeError =
    boundarySummaryTouched && !investigationModeId;
  const showBoundarySummaryError =
    boundarySummaryTouched && !isBoundarySummaryValid;
  const setupStatusText = getCreateProjectSetupStatusText(
    projectNameValidation,
    investigationModeId,
    isBoundarySummaryValid
  );
  const isSetupReady =
    projectNameValidation.isAvailable && !!investigationModeId && isBoundarySummaryValid;

  const onCreate = async () => {
    if (!canCreateProject) return;

    await saveKoreanFieldworkInvestigationModeId(
      projectId,
      investigationModeId as KoreanFieldworkInvestigationModeId
    );
    await saveKoreanFieldworkBoundarySummary(projectId, boundarySummary);

    onProjectCreated(
      projectId,
      KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice()
    );
    setProject('');
    setProjectTouched(false);
    setInvestigationModeId(undefined);
    setBoundarySummary('');
    setBoundarySummaryTouched(false);
    onClose();
  };

  const onCancel = () => {
    setProject('');
    setProjectTouched(false);
    setInvestigationModeId(undefined);
    setBoundarySummary('');
    setBoundarySummaryTouched(false);
    onClose();
  };

  return (
    <Modal
      onRequestClose={onCancel}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        ]}
      >
        <View style={styles.content}>
          <TitleBar
            title={<Heading>새 프로젝트 만들기</Heading>}
            left={
              <Button
                title="닫기"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onCancel}
              />
            }
            right={
              <Button
                title="만들기"
                variant="success"
                onPress={onCreate}
                isDisabled={!canCreateProject}
                testID="create-project-submit"
              />
            }
          />
          
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Input
              testID="project-input"
              label={`${KOREAN_FIELDWORK_PROJECT_LABEL} 프로젝트 이름`}
              value={project}
              onChangeText={(value) => {
                setProjectTouched(true);
                setProject(value);
              }}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              helpText="한국어 현장 기록 설정을 사용합니다. 다른 기기와 동기화하려면 같은 이름을 정확히 사용하세요."
              invalidText={getProjectNameInvalidText(projectNameValidation)}
              isValid={showProjectNameError ? false : undefined}
              style={styles.input}
            />

            <View style={styles.setupSection}>
              <Text style={styles.sectionTitle}>프로젝트 기본 설정</Text>
              <Text style={styles.sectionText}>
                조사 방식은 하루 작업이 아니라 프로젝트를 만들 때 정하는 기준입니다.
              </Text>
              <View style={styles.startSteps}>
                {KOREAN_FIELDWORK_START_STEPS.map((step, index) => (
                  <View key={step} style={styles.startStep}>
                    <Text style={styles.startStepNumber}>{index + 1}</Text>
                    <Text style={styles.startStepText}>{step}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.modeGrid}>
                {KOREAN_FIELDWORK_INVESTIGATION_MODES.map((mode) => {
                  const isSelected = mode.id === investigationModeId;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={mode.id}
                      onPress={() => setInvestigationModeId(mode.id)}
                      style={[
                        styles.modeButton,
                        isSelected && styles.modeButtonSelected,
                      ]}
                      testID={`project-investigation-mode_${mode.id}`}
                    >
                      <Text
                        style={[
                          styles.modeLabel,
                          isSelected && styles.modeLabelSelected,
                        ]}
                      >
                        {mode.label}
                      </Text>
                      <Text
                        style={[
                          styles.modeDetail,
                          isSelected && styles.modeDetailSelected,
                        ]}
                      >
                        {mode.detail}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showInvestigationModeError && (
                <Text style={styles.invalidText}>조사 방식을 선택해야 합니다.</Text>
              )}

              <Input
                testID="project-boundary-summary-input"
                label="조사 경계"
                value={boundarySummary}
                onChangeText={(value) => {
                  setBoundarySummaryTouched(true);
                  setBoundarySummary(value);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="예: 1구역 북쪽 능선부터 남쪽 농로까지"
                helpText="처음 정한 경계 기준입니다. 지도에서 도형을 그리거나 지원되는 파일 가져오기로 확정합니다."
                invalidText="조사 경계 기준을 입력해야 합니다."
                isValid={showBoundarySummaryError ? false : undefined}
                style={styles.boundaryInput}
              />

              <View style={styles.boundaryNotice}>
                <Ionicons
                  name={isSetupReady ? 'checkmark-circle-outline' : 'information-circle-outline'}
                  size={18}
                  color={isSetupReady ? '#027a48' : '#175cd3'}
                />
                <Text style={styles.boundaryText}>
                  {setupStatusText}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.containerBackground,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  formContainer: {
    padding: 24,
    paddingTop: 32,
  },
  input: {
    width: '100%',
  },
  boundaryInput: {
    marginTop: 12,
    width: '100%',
  },
  setupSection: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#27343b',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  sectionText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 12,
  },
  startSteps: {
    marginBottom: 14,
  },
  startStep: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  startStepNumber: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
    height: 22,
    lineHeight: 22,
    marginRight: 8,
    textAlign: 'center',
    width: 22,
  },
  startStepText: {
    color: '#344054',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modeButton: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    margin: 4,
    minHeight: 92,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: '47%',
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
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 5,
  },
  modeDetailSelected: {
    color: '#2f6f4e',
  },
  invalidText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
    margin: 5,
  },
  boundaryNotice: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 16,
    padding: 10,
  },
  boundaryText: {
    color: '#175cd3',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginLeft: 8,
  },
});

const getCreateProjectSetupStatusText = (
  projectNameValidation: ReturnType<typeof validateProjectName>,
  investigationModeId: KoreanFieldworkInvestigationModeId | undefined,
  isBoundarySummaryValid: boolean
): string => {
  if (!projectNameValidation.isAvailable) {
    return projectNameValidation.isPresent
      ? getProjectNameInvalidText(projectNameValidation)
      : '프로젝트 이름, 조사 방식, 조사 경계를 채우면 만들 수 있습니다.';
  }

  if (!investigationModeId && !isBoundarySummaryValid) {
    return '조사 방식과 조사 경계를 정하면 만들 수 있습니다.';
  }

  if (!investigationModeId) {
    return '조사 방식을 선택하면 만들 수 있습니다.';
  }

  if (!isBoundarySummaryValid) {
    return '조사 경계를 적으면 만들 수 있습니다.';
  }

  return '준비 완료. 생성 뒤 지도에서 이 경계를 그리거나 가져와 확정하세요.';
};

export default CreateProjectModal;
