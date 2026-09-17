type AndroidFlavor = 'shiftos' | 'terminalshift';

declare global {
  interface Window {
    __SHIFTOS_FLAVOR__?: AndroidFlavor;
  }
}

export function preuzmiAndroidFlavor(): AndroidFlavor | null {
  if (typeof window === 'undefined') return null;
  const flavor = window.__SHIFTOS_FLAVOR__;
  return flavor === 'shiftos' || flavor === 'terminalshift' ? flavor : null;
}

export function jeAndroidApp(): boolean {
  return preuzmiAndroidFlavor() !== null;
}

export function jeTerminalShiftFlavor(): boolean {
  return preuzmiAndroidFlavor() === 'terminalshift';
}

interface ShiftOSAndroidMost {
  postaviTerminalId: (terminalId: string) => void;
}

declare global {
  interface Window {
    ShiftOSAndroid?: ShiftOSAndroidMost;
  }
}

export function postaviTerminalIdNaUredjaju(terminalId: string): void {
  window.ShiftOSAndroid?.postaviTerminalId(terminalId);
}
