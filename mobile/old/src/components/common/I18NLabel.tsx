import { I18N } from 'idai-field-core';
import React, { useContext } from 'react';
import { Text, TextProps } from 'react-native';
import LabelsContext from '../../contexts/labels/labels-context';

interface I18NLabelProps extends TextProps {
  label: I18N.LabeledValue;
}

const I18NLabel: React.FC<I18NLabelProps> = ({ label, ...textProps }) => {
  const { labels } = useContext(LabelsContext);

  if (!labels) return null;

  return (
    <Text {...textProps} {...textProps}>
      {labels.get(label)}
    </Text>
  );
};

export default I18NLabel;
