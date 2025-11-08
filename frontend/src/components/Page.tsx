import type { PropsWithChildren } from 'react';

type PageProps = PropsWithChildren<{
  title: string;
  description?: string;
  width?: 'default' | 'narrow';
  hideDescription?: boolean;
}>;

const Page = ({ title, description, width = 'default', hideDescription = false, children }: PageProps) => {
  const widthClass = width === 'narrow' ? 'max-w-3xl py-12' : 'max-w-5xl py-16';
  return (
    <div className={`mx-auto flex min-h-screen w-full flex-col gap-10 px-6 ${widthClass}`}>
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-300">i-typed-this</p>
        <h1 className="text-4xl font-semibold text-brand-50 sm:text-5xl">{title}</h1>
        {description && !hideDescription ? (
          <p className="max-w-2xl text-base leading-relaxed text-slate-300">{description}</p>
        ) : null}
      </header>
      <main className="flex flex-1 flex-col gap-6">{children}</main>
    </div>
  );
};

export default Page;
