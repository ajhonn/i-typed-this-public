import type { PropsWithChildren } from 'react';

type PageProps = PropsWithChildren<{
  title: string;
  description?: string;
  showHeader?: boolean;
}>;

const Page = ({
  title,
  description,
  showHeader = true,
  children,
}: PageProps) => {
  const paddingY = showHeader ? 'py-12' : 'py-6';

  return (
    <div className={`mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 ${paddingY}`}>
      {showHeader ? (
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">i-typed-this</p>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">{title}</h1>
          {description ? <p className="max-w-3xl text-base leading-relaxed text-slate-600">{description}</p> : null}
        </header>
      ) : null}
      <main className="flex flex-1 flex-col gap-8">{children}</main>
    </div>
  );
};

export default Page;
