'use client';
import { useLayoutEffect, type RefObject } from 'react';

// Animate meaningful reading units, keeping complete sentences in the DOM.
const targets = [
  '.about-heading h1', '.about-heading .role', '.cv-summary', '.about-meta > span', '.about-bottom > button', '.about-illustration',
  '.projects-header .search-box', '.projects-header .filters', '.project-card', '.app-status', '.empty-state',
  '.project-detail > :not(ul)', '.project-detail > ul > li',
  '.experience-heading', '.experience-period', '.experience-job-heading', '.experience-project-heading', '.experience-bullets > li', '.experience-tech',
  '.skills-heading', '.skills-card > header', '.skill-items > li',
  '.contact-logo', '.contact-person h1', '.contact-role', '.contact-details > span', '.contact-channel',
].join(',');

export function useScrollReveal(rootRef: RefObject<HTMLDivElement | null>, enabled: boolean, replayKey: string) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') return;
    // Replay on activation; each unit still reveals only once while scrolling this section.
    const seen = new WeakSet<Element>();
    const registered = new Set<HTMLElement>();
    root.setAttribute('data-reveal-active', 'true');

    const show = (element: HTMLElement, delay = 0) => {
      element.style.setProperty('--reveal-delay', `${delay}ms`);
      element.dataset.scrollReveal = 'shown';
      seen.add(element);
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting && !seen.has(entry.target))
        .map(entry => entry.target as HTMLElement)
        .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      visible.forEach((element, index) => show(element, Math.min(index, 4) * 65));
    }, { root, rootMargin: '0px 0px -12px 0px', threshold: 0 });

    const register = () => {
      root.querySelectorAll<HTMLElement>(targets).forEach(element => {
        if (registered.has(element)) return;
        registered.add(element);
        if (seen.has(element)) element.dataset.scrollReveal = 'shown';
        else {
          element.dataset.scrollReveal = 'pending';
          observer.observe(element);
        }
      });
      // Filtered project cards can be removed while this app stays mounted.
      registered.forEach(element => {
        if (!root.contains(element)) { observer.unobserve(element); registered.delete(element); }
      });
    };
    register();
    // Commit the hidden reset before revealing already-mounted text again.
    void root.offsetHeight;
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true });
    const revealFocused = (event: FocusEvent) => {
      const element = (event.target as Element).closest<HTMLElement>('[data-scroll-reveal="pending"]');
      if (element && root.contains(element)) show(element);
    };
    root.addEventListener('focusin', revealFocused);

    return () => {
      observer.disconnect(); mutations.disconnect();
      root.removeEventListener('focusin', revealFocused);
      root.removeAttribute('data-reveal-active');
      registered.forEach(element => {
        element.removeAttribute('data-scroll-reveal');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, [rootRef, enabled, replayKey]);
}
