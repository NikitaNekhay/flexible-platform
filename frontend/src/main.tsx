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

const contextModals = {
  stepEditor: StepEditorModal,
  atomicSelector: AtomicSelectorModal,
  yamlImport: YAMLImportModal,
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
