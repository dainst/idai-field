import { MaterialIcons } from '@expo/vector-icons';
import { ProjectConfiguration } from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getKoreanFieldworkDraftContinuationOptions,
  KoreanFieldworkDraftContinuationOption,
  KoreanFieldworkDraftContinuationTarget,
} from './korean-fieldwork-draft-continuation';

interface KoreanFieldworkDraftContinuationPanelProps {
  categoryName: string;
  config: ProjectConfiguration;
  onSaveWithTarget: (target: KoreanFieldworkDraftContinuationTarget) => void;
}

const KoreanFieldworkDraftContinuationPanel: React.FC<KoreanFieldworkDraftContinuationPanelProps> = ({
  categoryName,
  config,
  onSaveWithTarget,
}) => {
  const options = useMemo(
    () => getKoreanFieldworkDraftContinuationOptions(categoryName, config),
    [categoryName, config]
  );

  if (options.length === 0) return null;

  return (
    <View style={styles.container} testID="koreanFieldworkDraftContinuationPanel">
      <View style={styles.headerTitleRow}>
        <MaterialIcons name="move-up" size={18} color="#175cd3" />
        <Text style={styles.title}>저장 후 이어가기</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionRow}
      >
        {options.map((option) => (
          <ContinuationButton
            key={option.id}
            option={option}
            onPress={() => onSaveWithTarget(option.target)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const ContinuationButton: React.FC<{
  option: KoreanFieldworkDraftContinuationOption;
  onPress: () => void;
}> = ({ option, onPress }) => (
  <TouchableOpacity
    accessibilityLabel={option.label}
    activeOpacity={0.86}
    onPress={onPress}
    style={styles.optionButton}
    testID={`draftContinuation_${option.id}`}
  >
    <View style={styles.optionIcon}>
      <MaterialIcons
        name={option.icon as keyof typeof MaterialIcons.glyphMap}
        size={18}
        color="#175cd3"
      />
    </View>
    <View style={styles.optionTextWrap}>
      <Text style={styles.optionLabel} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={styles.optionDetail} numberOfLines={2}>
        {option.detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eef4ff',
    borderColor: '#b2ccff',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#175cd3',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 5,
  },
  optionRow: {
    paddingRight: 8,
    paddingTop: 8,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#b2ccff',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    minHeight: 58,
    paddingHorizontal: 8,
    width: 220,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: '#d1e9ff',
    borderRadius: 5,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  optionLabel: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '900',
  },
  optionDetail: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
});

export default KoreanFieldworkDraftContinuationPanel;
