export type RunResult = {
  passed: boolean;
  tests: { name: string; passed: boolean; error?: string }[];
  output: string;
  elapsed: number;
  error?: string;
};
export interface Runner {
  run(
    code: string,
    tests: string[],
    limits?: { milliseconds: number; output: number },
  ): Promise<RunResult>;
  terminate(): void;
}
export class PyodideRunner implements Runner {
  private worker?: Worker;
  private cancel?: () => void;
  terminate() {
    this.cancel?.();
    this.worker?.terminate();
    this.worker = undefined;
  }
  run(
    code: string,
    tests: string[],
    limits = { milliseconds: 10000, output: 12000 },
  ): Promise<RunResult> {
    this.terminate();
    return new Promise((resolve) => {
      const start = performance.now();
      const worker = new Worker("/ascent/python-worker.js");
      this.worker = worker;
      let done = false;
      let executionTimer: ReturnType<typeof setTimeout> | undefined;
      const finish = (result: Omit<RunResult, "elapsed">) => {
        if (done) return;
        done = true;
        clearTimeout(bootTimer);
        clearTimeout(executionTimer);
        worker.terminate();
        this.worker = undefined;
        this.cancel = undefined;
        resolve({ ...result, elapsed: performance.now() - start });
      };
      this.cancel = () =>
        finish({
          passed: false,
          tests: [],
          output: "",
          error: "Execution terminated.",
        });
      const bootTimer = setTimeout(
        () =>
          finish({
            passed: false,
            tests: [],
            output: "",
            error:
              "Python download timed out. Check your connection and retry.",
          }),
        90000,
      );
      worker.onmessage = ({ data }) => {
        if (data.ready) {
          clearTimeout(bootTimer);
          executionTimer = setTimeout(
            () =>
              finish({
                passed: false,
                tests: [],
                output: "",
                error: `Time limit exceeded (${limits.milliseconds / 1000}s). Worker terminated.`,
              }),
            limits.milliseconds,
          );
          worker.postMessage({ code, tests, cap: limits.output });
        } else finish(data);
      };
      worker.onerror = (e) =>
        finish({
          passed: false,
          tests: [],
          output: "",
          error: e.message || "Python worker failed to load.",
        });
    });
  }
}
