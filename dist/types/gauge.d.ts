import { Hook } from "./types";
export declare abstract class AbstractGauge<Options = {}> {
    protected options: Options;
    protected hooks: Hook[];
    protected initial: boolean;
    constructor(options: Options, defaultOptions: Partial<Options>);
    protected addHook(callback: Function, keys: string[]): void;
    protected abstract updateData(combinedOptions: Options): any;
    protected update(options?: Partial<Options>): void;
}
