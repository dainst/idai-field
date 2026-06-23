import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  Document,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import Button from '@/components/common/Button';
import DocumentButton from '@/components/common/DocumentButton';
import Row from '@/components/common/Row';
import { colors } from '@/utils/colors';
import { KoreanFieldworkInvestigationModeId } from '../korean-fieldwork-investigation-mode';
import {
  getKoreanFieldworkChecklistQuickOptions,
  isKoreanFieldworkChecklistRecord,
} from '../korean-fieldwork-quick-record';

interface MapBottomSheetProps {
  document: Document | undefined;
  addDocument: (parentDoc: Document) => void;
  editDocument: (docId: string, categoryName: string) => void;
  removeDocument: (doc: Document) => void;
  focusHandler: (docId: string) => void;
  canCreateLocationCandidate: boolean;
  canCreatePenMemo: boolean;
  canCreateSoilProfilePhoto: boolean;
  canCreateSurveyBoundary: boolean;
  createFeatureCandidateAtCurrentLocation: () => void;
  createPenMemoDraft: () => void;
  createSoilProfilePhotoDraft: () => void;
  createSurveyBoundaryDraft: () => void;
  markGeometryNeedsAerialAlignment: () => void;
  markGeometryAdjustedToAerialLayer: () => void;
  toggleFeatureWorkflowStep: (stepValue: string) => void;
  readinessIssues: KoreanFieldworkReadinessIssue[];
  investigationModeId?: KoreanFieldworkInvestigationModeId;
}

const GEOMETRY_EDIT_STATUS_LABELS: { [status: string]: string } = {
  roughSketch: '대략 스케치',
  needsAerialAlignment: '보정 필요',
  adjustedToAerialLayer: '드론맞춤',
  adjustedToSurveyLine: '측량선맞춤',
  finalAccepted: '최종',
};

const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  document,
  addDocument,
  editDocument,
  removeDocument,
  focusHandler,
  canCreateLocationCandidate,
  canCreatePenMemo,
  canCreateSoilProfilePhoto,
  canCreateSurveyBoundary,
  createFeatureCandidateAtCurrentLocation,
  createPenMemoDraft,
  createSoilProfilePhotoDraft,
  createSurveyBoundaryDraft,
  markGeometryNeedsAerialAlignment,
  markGeometryAdjustedToAerialLayer,
  toggleFeatureWorkflowStep,
  readinessIssues,
  investigationModeId,
}) => {
  const iconSize = 20;
  const snapPoints = useMemo(() => [0.1, 0.4, 0.8], []);
  const featureWorkflowSteps = useMemo(
    () => getKoreanFieldworkChecklistQuickOptions(investigationModeId),
    [investigationModeId]
  );

  if (!document) return null;

  const docId = document.resource.id;
  const addChildPressHandler = () => addDocument(document);
  const featureChecklistValues = Array.isArray(
    (document.resource as any).featureInvestigationChecklist
  )
    ? (document.resource as any).featureInvestigationChecklist
    : [];
  const checkedFeatureChecklistValues = new Set(featureChecklistValues);
  const isFeatureWorkflowVisible = isKoreanFieldworkChecklistRecord(
    document.resource.category,
    investigationModeId
  );
  const geometryEditStatus =
    (document.resource as any).featureGeometryEditStatus ?? 'roughSketch';

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
          title="보기"
          onPress={() => focusHandler(docId)}
          icon={
            <MaterialIcons
              name="center-focus-strong"
              size={iconSize}
              color="#565350"
            />
          }
        />
        <Button
          style={styles.button}
          variant="success"
          title="하위추가"
          onPress={addChildPressHandler}
          icon={<Ionicons name="add" size={iconSize} />}
        />
        <Button
          style={styles.button}
          variant="success"
          title="현재위치"
          isDisabled={!canCreateLocationCandidate}
          onPress={createFeatureCandidateAtCurrentLocation}
          icon={<MaterialIcons name="add-location-alt" size={iconSize} />}
        />
        <Button
          style={styles.button}
          variant="secondary"
          title="메모"
          isDisabled={!canCreatePenMemo}
          onPress={createPenMemoDraft}
          icon={<MaterialIcons name="edit-note" size={iconSize} />}
        />
        <Button
          style={styles.button}
          variant="secondary"
          title="토층사진"
          isDisabled={!canCreateSoilProfilePhoto}
          onPress={createSoilProfilePhotoDraft}
          icon={<MaterialIcons name="photo-camera" size={iconSize} />}
        />
        <Button
          style={styles.button}
          variant="secondary"
          title="경계"
          isDisabled={!canCreateSurveyBoundary}
          onPress={createSurveyBoundaryDraft}
          icon={<MaterialIcons name="timeline" size={iconSize} />}
        />
        <Button
          style={styles.button}
          variant="primary"
          title="편집"
          onPress={() => editDocument(docId, document.resource.category)}
          icon={<Ionicons name="create-outline" size={iconSize} />}
        />
        <Button
          style={styles.button}
          variant="danger"
          onPress={() => removeDocument(document)}
          icon={<Ionicons name="trash" size={16} />}
        />
      </Row>
      {isFeatureWorkflowVisible && (
        <View style={styles.panel}>
          <Text style={styles.fieldLabel}>조사 과정표</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workflowSteps}
          >
            {featureWorkflowSteps.map((item, index) => {
              const checked = checkedFeatureChecklistValues.has(item.value);
              return (
                <View key={item.value} style={styles.workflowStepWrap}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => toggleFeatureWorkflowStep(item.value)}
                    testID={`mapWorkflowStep_${item.value}`}
                    style={[
                      styles.workflowStep,
                      checked && styles.workflowStepChecked,
                    ]}
                  >
                    <MaterialIcons
                      name={checked ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
                      color={checked ? '#2f6f4e' : '#666'}
                    />
                    <Text style={styles.workflowStepLabel}>{item.label}</Text>
                  </TouchableOpacity>
                  {index < featureWorkflowSteps.length - 1 && (
                    <MaterialIcons name="chevron-right" size={16} color="#999" />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
      {isFeatureWorkflowVisible && (
        <View style={styles.panel}>
          <Text style={styles.fieldLabel}>유구선</Text>
          <View style={styles.geometryActions}>
            <View style={styles.geometryStatus}>
              <MaterialIcons name="polyline" size={16} color="#555" />
              <Text style={styles.geometryStatusLabel}>
                {GEOMETRY_EDIT_STATUS_LABELS[geometryEditStatus] ?? geometryEditStatus}
              </Text>
            </View>
            <Button
              style={styles.geometryButton}
              variant="secondary"
              title="보정필요"
              onPress={markGeometryNeedsAerialAlignment}
              icon={<MaterialIcons name="edit-location-alt" size={16} />}
            />
            <Button
              style={styles.geometryButton}
              variant="success"
              title="드론맞춤"
              onPress={markGeometryAdjustedToAerialLayer}
              icon={<MaterialIcons name="done-outline" size={16} />}
            />
          </View>
        </View>
      )}
      {readinessIssues.length > 0 && (
        <View style={styles.warningPanel}>
          <Text style={styles.warningTitle}>
            현장 종료 전 확인 {readinessIssues.length}
          </Text>
          {readinessIssues.slice(0, 3).map((issue) => (
            <Text key={issue.ruleId} style={styles.warningText}>
              {issue.recommendedAction}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.docOverviewContainer}>
        {document.resource.shortDescription && (
          <View>
            <Text style={styles.fieldLabel}>간단 설명:</Text>
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
  buttonGroup: {
    alignItems: 'center',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  docButton: {
    flex: 1,
  },
  button: {
    marginRight: 10,
  },
  focusBtn: {
    borderColor: 'black',
    borderWidth: 1,
  },
  docOverviewContainer: {
    backgroundColor: 'white',
    flex: 1,
    padding: 5,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingRight: 5,
  },
  panel: {
    backgroundColor: 'white',
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  workflowSteps: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  workflowStepWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  workflowStep: {
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderColor: '#ccc',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 28,
    paddingHorizontal: 6,
  },
  workflowStepChecked: {
    backgroundColor: '#eef7f1',
    borderColor: '#2f6f4e',
  },
  workflowStepLabel: {
    fontSize: 12,
    marginLeft: 3,
  },
  geometryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 4,
  },
  geometryStatus: {
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderColor: '#ccc',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 28,
    paddingHorizontal: 6,
  },
  geometryStatusLabel: {
    color: '#333',
    fontSize: 12,
    marginLeft: 3,
  },
  geometryButton: {
    marginLeft: 6,
  },
  warningPanel: {
    backgroundColor: '#fff6f6',
    borderLeftColor: colors.danger,
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  warningTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#5f2525',
    fontSize: 12,
    marginTop: 2,
  },
});

export default MapBottomSheet;
