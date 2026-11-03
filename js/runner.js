// The auto-run clock. Knows nothing about the CPU: it just calls `onTick`.

export function createRunner(onTick, onRunningChange) {
    let timer = null;
    let delayMs = 400;

    const isRunning = () => timer !== null;

    function start() {
        if (isRunning()) return;
        timer = setInterval(onTick, delayMs);
        onRunningChange(true);
    }

    function stop() {
        if (!isRunning()) return;
        clearInterval(timer);
        timer = null;
        onRunningChange(false);
    }

    function toggle() {
        isRunning() ? stop() : start();
    }

    function setDelay(ms) {
        delayMs = ms;
        if (isRunning()) {          // restart with the new speed
            clearInterval(timer);
            timer = setInterval(onTick, delayMs);
        }
    }

    return { start, stop, toggle, setDelay, isRunning };
}
