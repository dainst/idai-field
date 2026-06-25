import { I18N } from 'idai-field-core';
import React, { useContext } from 'react';
import { Text, TextProps } from 'react-native';
import LabelsContext from '@/contexts/labels/labels-context';

interface I18NLabelProps extends TextProps {
  label: I18N.LabeledValue;
}

const KOREAN_FIELDWORK_GROUP_LABELS: Record<string, string> = {
  koreanFieldwork: '현장 기록',
  stem: '핵심 정보',
  hierarchy: '포함 위치',
  workflow: '작업 기록',
  identification: '식별 정보',
  inventory: '자료 관리',
  properties: '관찰 내용',
  position: '위치',
  time: '시기',
};

export const getKoreanFieldworkDisplayLabel = (
  label: I18N.LabeledValue,
  displayLabel: string
): string => (
  displayLabel === label.name && KOREAN_FIELDWORK_GROUP_LABELS[label.name]
    ? KOREAN_FIELDWORK_GROUP_LABELS[label.name]
    : displayLabel
);

const I18NLabel: React.FC<I18NLabelProps> = ({ label, ...textProps }) => {
  const { labels } = useContext(LabelsContext);

  if (!labels) return null;

  const displayLabel = labels.get(label);

  return (
    <Text {...textProps}>
      {getKoreanFieldworkDisplayLabel(label, displayLabel)}
    </Text>
  );
};

export default I18NLabel;
