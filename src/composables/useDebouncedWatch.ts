import { onScopeDispose, watch } from 'vue';
import type { WatchSource } from 'vue';

export type DebouncedWatchDelay = number | (() => number);

/**
 * Debounced multi-source watch. `delay: 0` runs synchronously; a getter delay
 * is re-read on each source change (so `inputDelay` can change after mount).
 */
export function useDebouncedWatch(
    sources: WatchSource[],
    callback: () => void,
    options: { delay?: DebouncedWatchDelay; immediate?: boolean } = {},
): void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let first = true;

    const cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };

    const resolveDelay = (): number => {
        const delay = options.delay ?? 0;
        return typeof delay === 'function' ? delay() : delay;
    };

    watch(
        sources,
        () => {
            const delay = resolveDelay();

            // First immediate run is never debounced (vue-diff parity).
            const isFirstImmediateRun = first && (options.immediate ?? false);
            first = false;

            if (isFirstImmediateRun || !delay || delay <= 0) {
                cancel();
                callback();
                return;
            }

            cancel();
            timer = setTimeout(() => {
                timer = undefined;
                callback();
            }, delay);
        },
        { immediate: options.immediate ?? false },
    );

    onScopeDispose(cancel);
}
