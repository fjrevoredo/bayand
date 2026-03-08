import { resetRecordsState } from './records';
import { resetUiState } from './ui';

export function resetSessionState(): void {
  resetRecordsState();
  resetUiState();
}
