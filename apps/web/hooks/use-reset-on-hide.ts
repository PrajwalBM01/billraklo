"use client";

import { useEffect, useEffectEvent, useLayoutEffect } from "react";

/**
 * With Cache Components, Next.js doesn't unmount a page when you navigate away: it
 * hides it with React's <Activity> and keeps its state. Pass a function that clears
 * transient state (pending flags, errors, OTP values) so the page comes back fresh.
 *
 * It also runs when the browser restores the page from its back/forward cache,
 * e.g. pressing Back on Google's sign-in page.
 */
export function useResetOnHide(reset: () => void) {
  const onReset = useEffectEvent(reset);

  // Layout effect cleanups run synchronously when Activity hides the page.
  useLayoutEffect(() => () => onReset(), []);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) onReset();
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}

/** Callback ref that clears a form's fields, including typed passwords, when its page is hidden. */
export function resetFormOnHide(form: HTMLFormElement | null) {
  return () => form?.reset();
}
