'use client';

import { Component, type ReactNode } from 'react';

type State = { failed: boolean };

/**
 * Isolates WebGL/physics failures (lost context, WASM init errors, driver bugs).
 * The page keeps working on its CSS atmosphere if the 3D layer throws.
 */
export class CanvasBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[devixa] 3D layer disabled:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
