/**
 * Poki SDK wrapper.
 * Provides a clean interface that works whether Poki SDK is loaded or not.
 * On Poki, their script tag injects PokiSDK globally.
 * Outside Poki, all calls are no-ops so the game runs standalone.
 */

let initialized = false;
let pokiAvailable = false;

export async function pokiInit() {
  if (initialized) return;
  initialized = true;

  if (typeof window.PokiSDK !== 'undefined') {
    try {
      await window.PokiSDK.init();
      pokiAvailable = true;
      console.log('[Poki] SDK initialized');
    } catch (e) {
      console.warn('[Poki] SDK init failed:', e);
      pokiAvailable = false;
    }
  } else {
    console.log('[Poki] SDK not available — running standalone');
  }
}

export function pokiGameplayStart() {
  if (pokiAvailable) {
    window.PokiSDK.gameplayStart();
  }
}

export function pokiGameplayStop() {
  if (pokiAvailable) {
    window.PokiSDK.gameplayStop();
  }
}

export async function pokiCommercialBreak() {
  if (pokiAvailable) {
    try {
      await window.PokiSDK.commercialBreak();
    } catch (e) {
      // Ad blocked or failed — continue
    }
  }
}

export async function pokiRewardedBreak() {
  if (pokiAvailable) {
    try {
      const success = await window.PokiSDK.rewardedBreak();
      return success;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function isPokiAvailable() {
  return pokiAvailable;
}
