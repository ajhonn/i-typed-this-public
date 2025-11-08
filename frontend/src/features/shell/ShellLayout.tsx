import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import Page from '@components/Page';
import Ribbon from './Ribbon';
import type { ShellTabKey } from './constants';

type ShellLayoutProps = PropsWithChildren<{
  activeTab: ShellTabKey;
  title: string;
  description?: string;
}>;

const ShellLayout = ({ activeTab, title, description, children }: ShellLayoutProps) => {
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Ribbon activeTab={activeTab} focusModeEnabled={focusMode} onToggleFocusMode={() => setFocusMode((prev) => !prev)} />
      <Page title={title} description={description} width={focusMode ? 'narrow' : 'default'} hideDescription={focusMode}>
        {children}
      </Page>
    </div>
  );
};

export default ShellLayout;
