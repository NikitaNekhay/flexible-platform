import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ScenariosState {
  selectedScenarioId: string | null;
}

const initialState: ScenariosState = {
  selectedScenarioId: null,
};

const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    selectScenario(state, action: PayloadAction<string | null>) {
      state.selectedScenarioId = action.payload;
    },
  },
});

export const { selectScenario } = scenariosSlice.actions;
export default scenariosSlice.reducer;
