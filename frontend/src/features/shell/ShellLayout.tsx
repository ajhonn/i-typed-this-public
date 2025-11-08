import type { PropsWithChildren, ReactNode } from 'react';
import Page from '@components/Page';
import Ribbon from './Ribbon';
import type { ShellTabKey } from './constants';
import { useSession } from '@features/session/SessionProvider';

type ShellLayoutProps = PropsWithChildren<{
  activeTab: ShellTabKey;
  title: string;
  description?: string;
  showHeader?: boolean;
  ribbonAction?: ReactNode;
}>;

const ShellLayout = ({ activeTab, title, description, showHeader = true, ribbonAction, children }: ShellLayoutProps) => {
  const { recorderState } = useSession();
  const isRecording = recorderState === 'recording';

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      {isRecording ? <div className="recording-rainbow" /> : null}
      <div className="relative z-10">
        <Ribbon activeTab={activeTab} endSlot={ribbonAction} />
        <Page title={title} description={description} showHeader={showHeader}>
          {children}
        </Page>
      </div>
    </div>
  );
};

export default ShellLayout;
