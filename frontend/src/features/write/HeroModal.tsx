import { useState, type PropsWithChildren } from 'react';
import logoMark from '../../assets/logo/logo.png';
import { heroSlides } from './heroSlides';

type HeroModalProps = PropsWithChildren<{
  onDismiss: () => void;
}>;

const HeroModal = ({ onDismiss }: HeroModalProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex];
  const totalSlides = heroSlides.length;

  const moveSlide = (direction: 'next' | 'prev') => {
    setActiveIndex((current) => {
      if (direction === 'next') {
        return (current + 1) % totalSlides;
      }
      return (current - 1 + totalSlides) % totalSlides;
    });
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 px-6 py-12 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-title"
      data-testid="hero-modal"
    >
      <div className="w-full max-w-3xl space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60">
        <header className="flex flex-col gap-2 text-center">
          <div className="mx-auto flex items-center gap-3">
            <img src={logoMark} alt="i-typed-this logo" className="h-10 w-10 object-contain" />
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">i-typed-this.com</h1>
          </div>
          <p className="text-base text-slate-600">AI detectors can get it wrong 78% of the time. Record your writing as evidence.</p>
        </header>

        <article key={activeSlide.id} className="space-y-5" aria-live="polite">
          <h2 id="hero-title" className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {activeSlide.title}
          </h2>
          <p className="text-base leading-relaxed text-slate-600">{activeSlide.intro}</p>
          {activeSlide.screenshotSrc ? (
            <img
              src={activeSlide.screenshotSrc}
              alt={activeSlide.screenshotAlt}
              className="w-full rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50"
            />
          ) : null}
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {activeSlide.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          {activeSlide.result ? <p className="text-sm font-semibold text-slate-700">{activeSlide.result}</p> : null}
          {activeSlide.footnote ? <p className="text-sm italic text-slate-500">{activeSlide.footnote}</p> : null}
        </article>

        <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show intro slide ${index + 1}`}
                className={`h-2.5 w-8 rounded-full ${index === activeIndex ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
            <span className="pl-2">
              Step {activeIndex + 1} of {totalSlides}
            </span>
          </div>
          <div className="flex items-center justify-end gap-3">
            {activeIndex > 0 ? (
              <button
                type="button"
                onClick={() => moveSlide('prev')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition hover:text-slate-900"
                aria-label="Previous intro slide"
              >
                ←
              </button>
            ) : (
              <div className="h-10 w-10" aria-hidden />
            )}
            {activeIndex === totalSlides - 1 ? (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Start writing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => moveSlide('next')}
                className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                aria-label="Next intro slide"
              >
                Next →
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HeroModal;
