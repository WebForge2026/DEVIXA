export type CursorMode = 'default' | 'lens' | 'core' | 'drag';

const EVENT = 'devixa:cursor';

/** Lets non-DOM code (e.g. the WebGL scene) change the custom cursor. */
export const setCursorMode = (mode: CursorMode) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<CursorMode>(EVENT, { detail: mode }));
};

export const onCursorMode = (handler: (mode: CursorMode) => void) => {
  const listener = (event: Event) => handler((event as CustomEvent<CursorMode>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
