import { createPersistedStore } from "./persist";

type Role = "user" | "admin";
type Selection = { objectId: string | null; multiIds: string[] | null };
type State = Record<Role, Selection>;
export const analysisSelectionStore = createPersistedStore<State>("analysisSelection", {
  user: { objectId: null, multiIds: null },
  admin: { objectId: null, multiIds: null },
});

export function resolveAnalysisSelection(selection: Selection, availableIds: string[]) {
  const objectId = selection.objectId === null ? availableIds[0] : availableIds.find(id => id === selection.objectId);
  const multiIds = selection.multiIds === null ? (objectId ? [objectId] : []) : selection.multiIds.filter(id => availableIds.includes(id));
  return { objectId, multiIds };
}

export function selectAnalysisObject(role: Role, objectId: string) {
  analysisSelectionStore.set(state => ({ ...state, [role]: { objectId, multiIds: null } }));
}

export function selectAnalysisObjects(role: Role, multiIds: string[]) {
  analysisSelectionStore.set(state => ({ ...state, [role]: {
    objectId: multiIds.includes(state[role].objectId ?? "") ? state[role].objectId : multiIds[0] ?? state[role].objectId,
    multiIds,
  } }));
}