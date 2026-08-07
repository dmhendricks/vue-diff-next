import { onScopeDispose, watch } from 'vue';
import type { WatchSource } from 'vue';

export type DebouncedWatchDelay = number | (() => number);

/**
 * Watch sources, running the callback at most once per `delay` ms of quiet.
 *
 * Replaces `@vueuse/core`'s `debouncedWatch`, which was the original's only use
 * of that dependency worth keeping. A delay of 0 runs synchronously with the
 * watcher rather than deferring by a timer, so `inputDelay: 0` (the default)
 * behaves exactly like a plain watch.
 *
 * `delay` may be a getter so callers can react to prop changes (e.g.
 * `inputDelay`) without recreating the watcher. The value is read on each
 * source change, not once at setup.
 *
 * The timer is cleared when the owning scope is disposed, so a component
 * unmounted mid-debounce never fires into a dead instance.
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

            // The initial run is never debounced, so content paints straight
            // away even with a large inputDelay. Matches @vueuse/core's
            // debouncedWatch({ immediate: true }), which the original relied on.
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
