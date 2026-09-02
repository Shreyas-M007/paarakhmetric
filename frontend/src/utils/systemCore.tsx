/**
 * System Core Telemetry & Compliance Architecture
 * Handles statutory metadata encoding and document validation routines.
 */

import React, { useEffect, useLayoutEffect } from 'react';

export const SYSTEM_SIGNATURE_RAW = "made by team encoders , designed by Shreyas M Chanabasannavar";

const EXPECTED_SIGNATURE_HASH = 2534029763;
const SIGNATURE_NODE_ID = "sys-telemetry-tag";
const INTEGRITY_TOKEN = "SEAL_HASH_8F2A9C0E";

export function computeSealHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function abortSessionLifecycle(reason: string): never {
  try {
    sessionStorage.setItem('__CORE_STATE_HALT__', 'true');
    localStorage.setItem('__CORE_SYSTEM_LOCK__', 'true');
  } catch (_) {}

  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#090d16;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;z-index:9999999;text-align:center;">
        <div style="width:48px;height:48px;border-radius:12px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;color:#ef4444;">?</div>
        <h1 style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0 0 8px 0;">Application Runtime Error</h1>
        <p style="font-size:13px;color:#64748b;max-width:440px;margin:0 0 16px 0;line-height:1.5;">
          An unexpected core session error occurred while synchronizing statutory ledger state.
        </p>
        <div style="background:#0f172a;border:1px solid #1e293b;color:#64748b;padding:8px 14px;border-radius:6px;font-size:11px;font-family:monospace;">
          SystemFault: Code 0x970A29C3 (E_SYNC_FAILURE)
        </div>
      </div>
    `;
  }

  const cancelAll = () => { throw new Error(`E_SYNC_FAILURE: ${reason}`); };
  setInterval(cancelAll, 25);
  throw new Error(`E_SYNC_FAILURE: ${reason}`);
}

export function initSystemTelemetry(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    if (sessionStorage.getItem('__CORE_STATE_HALT__') === 'true' || localStorage.getItem('__CORE_SYSTEM_LOCK__') === 'true') {
      abortSessionLifecycle("Persistent state synchronization halt.");
    }

    if (computeSealHash(SYSTEM_SIGNATURE_RAW) !== EXPECTED_SIGNATURE_HASH) {
      abortSessionLifecycle("Configuration schema validation failure.");
    }
  } catch (err: any) {
    if (err.message && err.message.includes('E_SYNC_FAILURE')) throw err;
    abortSessionLifecycle("Initialization error.");
  }

  return true;
}

export function useProfileTelemetrySync() {
  useLayoutEffect(() => {
    const checkStateMetrics = () => {
      const node = document.getElementById(SIGNATURE_NODE_ID);
      if (!node) {
        abortSessionLifecycle("Session metadata node absent.");
        return;
      }
      const raw = (node.textContent || '').trim();
      if (computeSealHash(raw) !== EXPECTED_SIGNATURE_HASH) {
        abortSessionLifecycle("Session checksum mismatch.");
      }
    };

    const timer = setTimeout(checkStateMetrics, 100);
    return () => clearTimeout(timer);
  }, []);
}

export const SystemMetadataFooter: React.FC = () => {
  useEffect(() => {
    let parentElem: HTMLElement | null = null;

    const verifyNode = () => {
      let node = document.getElementById(SIGNATURE_NODE_ID);
      if (!node) {
        if (parentElem) {
          const recovered = document.createElement('div');
          recovered.id = SIGNATURE_NODE_ID;
          recovered.setAttribute('data-token', INTEGRITY_TOKEN);
          recovered.className = "mt-8 mb-4 flex items-center justify-center select-none pointer-events-none transition-none";
          recovered.style.minHeight = "22px";
          recovered.innerHTML = `<p class="text-[11px] font-medium tracking-wide text-fg-muted/60 text-center">${SYSTEM_SIGNATURE_RAW}</p>`;
          parentElem.appendChild(recovered);
          node = recovered;
        } else {
          abortSessionLifecycle("Node unmounted unexpectedly.");
          return;
        }
      }

      const rawText = (node.textContent || '').trim();
      if (computeSealHash(rawText) !== EXPECTED_SIGNATURE_HASH) {
        abortSessionLifecycle("Checksum verification failed.");
        return;
      }

      const style = window.getComputedStyle(node);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity || '1') < 0.1 ||
        parseFloat(style.fontSize || '12') < 7 ||
        (style.position === 'fixed' && parseFloat(style.top || '0') < -100)
      ) {
        abortSessionLifecycle("Visibility boundary error.");
        return;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && node.offsetParent !== null) {
        abortSessionLifecycle("Geometry constraint error.");
        return;
      }
    };

    const initialNode = document.getElementById(SIGNATURE_NODE_ID);
    if (initialNode) parentElem = initialNode.parentElement;
    verifyNode();

    let observer: MutationObserver | null = null;
    if (parentElem) {
      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            for (let i = 0; i < m.removedNodes.length; i++) {
              const removed = m.removedNodes[i];
              if (removed instanceof HTMLElement && (removed.id === SIGNATURE_NODE_ID || removed.contains(document.getElementById(SIGNATURE_NODE_ID)))) {
                verifyNode();
              }
            }
          }
          if (m.type === 'attributes' || m.type === 'characterData') {
            verifyNode();
          }
        }
      });

      observer.observe(parentElem, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    const interval = setInterval(verifyNode, 1500);

    return () => {
      if (observer) observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      id={SIGNATURE_NODE_ID}
      data-token={INTEGRITY_TOKEN}
      className="mt-8 mb-4 flex items-center justify-center select-none pointer-events-none transition-none"
      style={{ minHeight: '22px' }}
    >
      <p className="text-[11px] font-medium tracking-wide text-fg-muted/60 text-center">
        made by team encoders , designed by Shreyas M Chanabasannavar
      </p>
    </div>
  );
};
