import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { store } from './store';
import { App } from './App';
import { theme } from './theme/theme';
import './theme/globalStyles.css';

import { StepEditorModal } from '@/pages/ScenarioEditor/modals/StepEditorModal';
import { AtomicSelectorModal } from '@/pages/ScenarioEditor/modals/AtomicSelectorModal';
import { YAMLImportModal } from '@/pages/ScenarioEditor/modals/YAMLImportModal';
import { SessionSelectorModal } from '@/pages/ExecutionViewer/SessionSelectorModal';

// Mantine ModalsProvider requires Record<string, MantineModal> — cast is unavoidable
// due to contravariance of innerProps. See src/types/modals.ts for typed inner props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contextModals = {
  stepEditor: StepEditorModal,
  atomicSelector: AtomicSelectorModal,
  yamlImport: YAMLImportModal,
  sessionSelector: SessionSelectorModal,
} as Record<string, React.FC<any>>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <MantineProvider theme={theme} forceColorScheme="dark">
        <ModalsProvider modals={contextModals}>
          <Notifications position="top-right" limit={5} />
          <App />
        </ModalsProvider>
      </MantineProvider>
    </Provider>
  </React.StrictMode>,
);
