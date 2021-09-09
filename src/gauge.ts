import { uuidv4 } from "./helpers";
import { Hook } from "./types";

export abstract class AbstractGauge<Options = {}> {
    protected options: Options;
    protected hooks: Hook[] = [];
    protected initial: boolean = true;

    constructor(options: Options, defaultOptions: Partial<Options>) {
        this.options = {
            id: uuidv4(),
            ...defaultOptions,
            ...options
        };
    }

    protected addHook(callback: Function, keys: string[]) {
        this.hooks.push({
            callback,
            keys
        });
    }

    protected abstract updateData(combinedOptions: Options) : any

    protected update(options: Partial<Options> = {}) {
        const combinedOptions = { ...this.options, ...options };

        //get the keys of changed option values
        const changed = Object.keys(options).filter(k => options[k] !== this.options[k])

        //if this is the first update or if there are changes
        if (this.initial || changed.length) {

            const data = this.updateData(combinedOptions);

            this.hooks.forEach(h => {
                if(this.initial || h.keys.some(k => changed.includes(k))) {
                    h.callback(data);
                }
            });
            this.initial = false;        
        }

        this.options = combinedOptions;
    }

}