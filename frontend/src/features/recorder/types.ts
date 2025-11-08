export type RecorderEventSource = 'dom' | 'transaction';

export type RecorderEventType = 'text-input' | 'delete' | 'selection-change' | 'transaction' | 'paste';

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
  };
};
