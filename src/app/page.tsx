'use client';

import { useEffect } from 'react';
import OverviewPage from './overview/page';
import CostsPage from './costs/page';
import ValuePage from './value/page';
import ProjectsPage from './projects/page';
import SessionsPage from './sessions/page';

// One-page home: the main views stacked; each `.slide` inside them is one screen.
// Scrolling and arrow keys move exactly one slide.
const SECTIONS = [
  { id: 'overview', Component: OverviewPage },
  { id: 'costs', Component: CostsPage },
  { id: 'value', Component: ValuePage },
  { id: 'projects', Component: ProjectsPage },
  { id: 'sessions', Component: SessionsPage },
] as const;

const slides = () => Array.from(document.querySelectorAll<HTMLElement>('#onepage .slide'));

function currentIndex(list: HTMLElement[]) {
  const mid = window.innerHeight / 2;
  const i = list.findIndex(el => {
    const r = el.getBoundingClientRect();
    return r.top <= mid && r.bottom > mid;
  });
  return Math.max(i, 0);
}

/** Shrinks a slide's content (CSS zoom) when it is taller than the screen. */
function fit(slide: HTMLElement) {
  const kids = Array.from(slide.children) as HTMLElement[];
  kids.forEach(k => { k.style.zoom = ''; });
  const style = getComputedStyle(slide);
  const available = slide.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  if (!kids.length) return;
  const needed = kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
  if (needed > available) {
    const z = String(Math.max(available / needed, 0.5));
    kids.forEach(k => { k.style.zoom = z; });
  }
}

export default function HomePage() {
  useEffect(() => {
    // Always open on the first slide, not wherever the browser restores the scroll.
    history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });

    let locked = false;
    let touched = false; // until the user moves, stay pinned on the first slide while content loads
    const go = (dir: 1 | -1) => {
      const list = slides();
      const next = list[Math.min(Math.max(currentIndex(list) + dir, 0), list.length - 1)];
      if (!next || locked) return;
      touched = true;
      locked = true;
      next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { locked = false; }, 700);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 4) go(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
    };

    // Refit whenever a slide's content changes size (data arriving, charts drawing, resize).
    const refitAll = () => {
      slides().forEach(fit);
      if (!touched && !location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(refitAll));
    const observe = () => slides().forEach(s => ro.observe(s));
    const mo = new MutationObserver(() => { observe(); requestAnimationFrame(refitAll); });
    const root = document.getElementById('onepage');
    if (root) mo.observe(root, { childList: true, subtree: true });
    observe();
    window.addEventListener('resize', refitAll);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', refitAll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div id="onepage">
      {SECTIONS.map(({ id, Component }) => (
        <section key={id} id={id}>
          <Component />
        </section>
      ))}
    </div>
  );
}
