import type { PropsWithChildren } from 'react';
import Page from '@components/Page';
import Ribbon from './Ribbon';
import type { ShellTabKey } from './constants';

type ShellLayoutProps = PropsWithChildren<{
  activeTab: ShellTabKey;
  title: string;
  description?: string;
  showHeader?: boolean;
}>;

const ShellLayout = ({ activeTab, title, description, showHeader = true, children }: ShellLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Ribbon activeTab={activeTab} />
      <Page title={title} description={description} showHeader={showHeader}>
        {children}
      </Page>
    </div>
  );
};

export default ShellLayout;
