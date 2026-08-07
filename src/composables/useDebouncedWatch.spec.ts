import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useDebouncedWatch } from './useDebouncedWatch';

describe('useDebouncedWatch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reads delay from a getter on each source change', async () => {
        const source = ref(0);
        const delay = ref(0);
        const calls: number[] = [];

        const scope = effectScope();
        scope.run(() => {
            useDebouncedWatch(
                [source],
                () => {
                    calls.push(source.value);
                },
                { delay: () => delay.value, immediate: true },
            );
        });

        await nextTick();
        expect(calls).toEqual([0]);

        delay.value = 50;
        source.value = 1;
        await nextTick();
        expect(calls).toEqual([0]);

        vi.advanceTimersByTime(50);
        expect(calls).toEqual([0, 1]);

        delay.value = 0;
        source.value = 2;
        await nextTick();
        expect(calls).toEqual([0, 1, 2]);

        scope.stop();
    });
});
