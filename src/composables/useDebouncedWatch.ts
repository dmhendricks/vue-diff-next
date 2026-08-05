import { onScopeDispose, watch } from 'vue';
import type { WatchSource } from 'vue';

/**
 * Watch sources, running the callback at most once per `delay` ms of quiet.
 *
 * Replaces `@vueuse/core`'s `debouncedWatch`, which was the original's only use
 * of that dependency worth keeping. A delay of 0 runs synchronously with the
 * watcher rather than deferring by a timer, so `inputDelay: 0` (the default)
 * behaves exactly like a plain watch.
 *
 * The timer is cleared when the owning scope is disposed, so a component
 * unmounted mid-debounce never fires into a dead instance.
 */
export function useDebouncedWatch(
    sources: WatchSource[],
    callback: () => void,
    options: { delay: number; immediate?: boolean } = { delay: 0 },
): void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let first = true;

    const cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };

    watch(
        sources,
        () => {
            const delay = options.delay;

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
