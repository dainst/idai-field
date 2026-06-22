import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import DocumentsMap from '@/components/Project/DocumentsMap';
import { ProjectContext } from '@/contexts/project-context';

const DocumentMapContainer: React.FC = () => {
  const { repository, relationsManager, syncStatus, setQ, onParentSelected } =
    useContext(ProjectContext);

  if (!repository || syncStatus === undefined) {
    return <ProjectMapLoadingState />;
  }

  return (
    <DocumentsMap
      repository={repository}
      issueSearch={setQ}
      syncStatus={syncStatus}
      relationsManager={relationsManager}
      selectParent={onParentSelected}
    />
  );
};

const ProjectMapLoadingState: React.FC = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingTitle}>지도 야장을 준비하고 있습니다</Text>
    <Text style={styles.loadingText}>
      현장 기록 저장소와 동기화 상태를 확인하는 중입니다.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#eef2f4',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    color: '#20313a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    color: '#526272',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

export default DocumentMapContainer;
