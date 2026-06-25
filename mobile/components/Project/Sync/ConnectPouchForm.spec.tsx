import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import ConnectPouchForm from './ConnectPouchForm';

describe('ConnectPouchForm', () => {
  it('requires sync URL and password before connecting', () => {
    const onConnect = jest.fn();
    const { getByTestId } = render(
      <ConnectPouchForm
        settings={{
          url: '',
          password: '',
          connected: false,
          mapSettings: { pointRadius: 6 },
        }}
        onConnect={onConnect}
        onClose={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('sync-connect-submit'));
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('trims sync credentials and preserves existing project settings', () => {
    const onConnect = jest.fn();
    const mapSettings = { pointRadius: 11 };
    const { getByTestId } = render(
      <ConnectPouchForm
        settings={{
          url: 'https://old.example/db',
          password: 'old-password',
          connected: false,
          languages: ['ko', 'en'],
          mapSettings,
        }}
        onConnect={onConnect}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId('sync-url-input').props.value).toBe('https://old.example/db');
    expect(getByTestId('sync-password-input').props.value).toBe('old-password');

    fireEvent.changeText(getByTestId('sync-url-input'), '  https://field.example/db  ');
    fireEvent.changeText(getByTestId('sync-password-input'), '  secret  ');
    fireEvent.press(getByTestId('sync-connect-submit'));

    expect(onConnect).toHaveBeenCalledWith({
      url: 'https://field.example/db',
      password: 'secret',
      connected: true,
      languages: ['ko', 'en'],
      mapSettings,
    });
  });

  it('requires an http or https sync URL before connecting', () => {
    const onConnect = jest.fn();
    const { getByTestId, getByText } = render(
      <ConnectPouchForm
        settings={{
          url: '',
          password: '',
          connected: false,
          mapSettings: { pointRadius: 6 },
        }}
        onConnect={onConnect}
        onClose={jest.fn()}
      />
    );

    fireEvent.changeText(getByTestId('sync-url-input'), 'field.example/db');
    fireEvent.changeText(getByTestId('sync-password-input'), 'secret');
    fireEvent.press(getByTestId('sync-connect-submit'));

    expect(getByText('http:// 또는 https://로 시작하는 서버 URL을 입력하세요.'))
      .toBeTruthy();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('shows an existing malformed sync URL immediately', () => {
    const { getByText } = render(
      <ConnectPouchForm
        settings={{
          url: 'field.example/db',
          password: 'secret',
          connected: false,
          mapSettings: { pointRadius: 6 },
        }}
        onConnect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(getByText('http:// 또는 https://로 시작하는 서버 URL을 입력하세요.'))
      .toBeTruthy();
  });
});
