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
}

const KoreanFieldworkInvestigationModePanel: React.FC<
  KoreanFieldworkInvestigationModePanelProps
> = ({
  modeId,
  onSelectMode,
}) => {
  const selectedMode = getKoreanFieldworkInvestigationMode(modeId);

  return (
    <View style={styles.container} testID="investigationModePanel">
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>조사 방식</Text>
          <Text style={styles.title}>
            {selectedMode ? selectedMode.label : '오늘 어떤 조사를 하나요?'}
          </Text>
        </View>
        {selectedMode && (
          <View style={styles.primaryActionPill}>
            <MaterialIcons name="flag" size={14} color="#175cd3" />
            <Text style={styles.primaryActionText} numberOfLines={1}>
              {selectedMode.primaryAction}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        {KOREAN_FIELDWORK_INVESTIGATION_MODES.map((mode) => {
          const isSelected = mode.id === modeId;

          return (
            <TouchableOpacity
              activeOpacity={0.86}
              key={mode.id}
              onPress={() => onSelectMode(mode.id)}
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

      {selectedMode && (
        <View style={styles.requirementPanel}>
          <Text style={styles.requirementTitle}>오늘 볼 항목</Text>
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
        </View>
      )}
    </View>
  );
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
  requirementTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  requirementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
});

export default KoreanFieldworkInvestigationModePanel;
