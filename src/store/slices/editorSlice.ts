import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Step } from '@/types';
import type { DAGValidationResult } from '@/utils/dagUtils';

interface EditorState {
  chainId: string | null;
  chainName: string;
  chainDescription: string;
  chainTags: string[];
  chainMitreTactics: string[];
  steps: Step[];
  isDirty: boolean;
  validationState: DAGValidationResult;
}

const emptyValidation: DAGValidationResult = {
  valid: true,
  cycleNodes: [],
  missingDeps: [],
  duplicateIds: [],
};

const initialState: EditorState = {
  chainId: null,
  chainName: '',
  chainDescription: '',
  chainTags: [],
  chainMitreTactics: [],
  steps: [],
  isDirty: false,
  validationState: emptyValidation,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    initEditor(
      state,
      action: PayloadAction<{
        chainId: string | null;
        name: string;
        description: string;
        tags: string[];
        mitreTactics: string[];
        steps: Step[];
      }>,
    ) {
      state.chainId = action.payload.chainId;
      state.chainName = action.payload.name;
      state.chainDescription = action.payload.description;
      state.chainTags = action.payload.tags;
      state.chainMitreTactics = action.payload.mitreTactics;
      state.steps = action.payload.steps;
      state.isDirty = false;
      state.validationState = emptyValidation;
    },
    resetEditor() {
      return initialState;
    },
    setChainMeta(
      state,
      action: PayloadAction<{
        name?: string;
        description?: string;
        tags?: string[];
        mitreTactics?: string[];
      }>,
    ) {
      if (action.payload.name !== undefined) state.chainName = action.payload.name;
      if (action.payload.description !== undefined)
        state.chainDescription = action.payload.description;
      if (action.payload.tags !== undefined) state.chainTags = action.payload.tags;
      if (action.payload.mitreTactics !== undefined)
        state.chainMitreTactics = action.payload.mitreTactics;
      state.isDirty = true;
    },
    addStep(state, action: PayloadAction<Step>) {
      state.steps.push(action.payload);
      state.isDirty = true;
    },
    updateStep(state, action: PayloadAction<Step>) {
      const idx = state.steps.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) {
        state.steps[idx] = action.payload;
        state.isDirty = true;
      }
    },
    removeStep(state, action: PayloadAction<string>) {
      const removedId = action.payload;
      state.steps = state.steps.filter((s) => s.id !== removedId);
      // Also remove from depends_on of other steps (handles both string and {any/all} entries)
      for (const step of state.steps) {
        step.depends_on = step.depends_on
          .map((d) => {
            if (typeof d === 'string') return d === removedId ? null : d;
            const entry: { any?: string[]; all?: string[] } = {};
            if (d.any) {
              const filtered = d.any.filter((id) => id !== removedId);
              if (filtered.length > 0) entry.any = filtered;
            }
            if (d.all) {
              const filtered = d.all.filter((id) => id !== removedId);
              if (filtered.length > 0) entry.all = filtered;
            }
            return (entry.any || entry.all) ? entry : null;
          })
          .filter((d): d is NonNullable<typeof d> => d !== null);
      }
      state.isDirty = true;
    },
    reorderSteps(state, action: PayloadAction<Step[]>) {
      state.steps = action.payload;
      state.isDirty = true;
    },
    replaceAllSteps(state, action: PayloadAction<Step[]>) {
      state.steps = action.payload;
      state.isDirty = true;
    },
    setValidation(state, action: PayloadAction<DAGValidationResult>) {
      state.validationState = action.payload;
    },
    markClean(state) {
      state.isDirty = false;
    },
  },
});

export const {
  initEditor,
  resetEditor,
  setChainMeta,
  addStep,
  updateStep,
  removeStep,
  reorderSteps,
  replaceAllSteps,
  setValidation,
  markClean,
} = editorSlice.actions;
export default editorSlice.reducer;
