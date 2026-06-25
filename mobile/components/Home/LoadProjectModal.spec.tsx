import {
  fireEvent,
  render,
} from '@testing-library/react-native';
import React from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import LoadProjectModal from './LoadProjectModal';

const safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

describe('LoadProjectModal', () => {
  it('imports a server project with trimmed connection settings', () => {
    const handleProjectLoad = jest.fn();
    const handleClose = jest.fn();
    const { getByTestId, queryByText } = renderLoadProjectModal({
      onProjectLoad: handleProjectLoad,
      onClose: handleClose,
    });

    expect(queryByText('프로젝트 이름을 입력해야 합니다.')).toBeNull();

    fireEvent.changeText(getByTestId('load-input'), '  fieldwork-server  ');
    fireEvent.changeText(getByTestId('load-url-input'), '  https://field.example/db  ');
    fireEvent.changeText(getByTestId('load-password-input'), '  secret  ');
    fireEvent.press(getByTestId('load-project-submit'));

    expect(handleProjectLoad).toHaveBeenCalledWith(
      'fieldwork-server',
      'https://field.example/db',
      'secret'
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('requires an http or https server URL before importing', () => {
    const handleProjectLoad = jest.fn();
    const handleClose = jest.fn();
    const { getByTestId, getByText } = renderLoadProjectModal({
      onProjectLoad: handleProjectLoad,
      onClose: handleClose,
    });

    fireEvent.changeText(getByTestId('load-input'), 'fieldwork-server');
    fireEvent.changeText(getByTestId('load-url-input'), 'field.example/db');
    fireEvent.changeText(getByTestId('load-password-input'), 'secret');
    fireEvent.press(getByTestId('load-project-submit'));

    expect(getByText('http:// 또는 https://로 시작하는 서버 URL을 입력하세요.'))
      .toBeTruthy();
    expect(handleProjectLoad).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('prevents importing over an existing normalized project name', () => {
    const handleProjectLoad = jest.fn();
    const handleClose = jest.fn();
    const { getByTestId, getByText } = renderLoadProjectModal({
      existingProjects: ['fieldwork-1'],
      onProjectLoad: handleProjectLoad,
      onClose: handleClose,
    });

    fireEvent.changeText(getByTestId('load-input'), '  fieldwork-1  ');
    fireEvent.changeText(getByTestId('load-url-input'), 'https://field.example/db');
    fireEvent.changeText(getByTestId('load-password-input'), 'secret');
    fireEvent.press(getByTestId('load-project-submit'));

    expect(getByText('이미 있는 프로젝트 이름입니다.')).toBeTruthy();
    expect(handleProjectLoad).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('prevents importing a server project with an unsafe local database name', () => {
    const handleProjectLoad = jest.fn();
    const handleClose = jest.fn();
    const { getByTestId, getByText } = renderLoadProjectModal({
      onProjectLoad: handleProjectLoad,
      onClose: handleClose,
    });

    fireEvent.changeText(getByTestId('load-input'), 'field/work:1');
    fireEvent.changeText(getByTestId('load-url-input'), 'https://field.example/db');
    fireEvent.changeText(getByTestId('load-password-input'), 'secret');
    fireEvent.press(getByTestId('load-project-submit'));

    expect(getByText('프로젝트 이름에 / \\ : * ? " < > | 같은 문자는 쓸 수 없습니다.'))
      .toBeTruthy();
    expect(handleProjectLoad).not.toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });
});

const renderLoadProjectModal = ({
  existingProjects,
  onProjectLoad,
  onClose,
}: {
  existingProjects?: string[];
  onProjectLoad: (project: string, url: string, password: string) => void;
  onClose: () => void;
}) =>
  render(
    <SafeAreaInsetsContext.Provider value={safeAreaInsets}>
      <LoadProjectModal
        existingProjects={existingProjects}
        onProjectLoad={onProjectLoad}
        onClose={onClose}
      />
    </SafeAreaInsetsContext.Provider>
  );
