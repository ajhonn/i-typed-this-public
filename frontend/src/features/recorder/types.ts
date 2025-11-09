export type RecorderEventSource = 'dom' | 'transaction';

export type RecorderEventType = 'text-input' | 'delete' | 'selection-change' | 'transaction' | 'paste' | 'copy' | 'cut';

export type ClipboardMeta = {
  action: 'copy' | 'cut';
  length: number;
  preview: string;
  hash: string;
};

export type RecorderEvent = {
  id: string;
  type: RecorderEventType;
  timestamp: number;
  source: RecorderEventSource;
  meta: {
    docSize: number;
    stepTypes: string[];
    selection: {
      from: number;
      to: number;
    };
    docChanged: boolean;
    html: string;
    durationMs?: number;
    domInput?: {
      inputType: string;
      data?: string | null;
    };
    pastePayload?: {
      text: string;
      length: number;
      preview: string;
      source?: 'ledger' | 'external';
      matchedCopyId?: string;
      ledgerAgeMs?: number;
    };
    clipboard?: ClipboardMeta;
  };
};
