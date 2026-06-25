import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import SyncSettingsModal from './SyncSettingsModal';

describe('SyncSettingsModal', () => {
  it('opens safely with missing project settings', () => {
    const onSettingsSet = jest.fn();
    const { getByTestId } = render(
      <SyncSettingsModal
        onSettingsSet={onSettingsSet}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId('sync-url-input').props.value).toBe('');
    expect(getByTestId('sync-password-input').props.value).toBe('');
    fireEvent.press(getByTestId('sync-connect-submit'));
    expect(onSettingsSet).not.toHaveBeenCalled();
  });

  it('disconnects without losing existing project settings', () => {
    const onSettingsSet = jest.fn();
    const mapSettings = { pointRadius: 8 };
    const { getByTestId } = render(
      <SyncSettingsModal
        settings={{
          url: 'https://field.example/db',
          password: 'secret',
          connected: true,
          languages: ['ko'],
          mapSettings,
        }}
        onSettingsSet={onSettingsSet}
        onClose={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('sync-disconnect-submit'));

    expect(onSettingsSet).toHaveBeenCalledWith({
      url: 'https://field.example/db',
      password: 'secret',
      connected: false,
      languages: ['ko'],
      mapSettings,
    });
  });
});
