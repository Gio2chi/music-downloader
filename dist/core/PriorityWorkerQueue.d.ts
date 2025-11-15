import TaskInterface from "./TaskInterface";
import WorkerInterface from "./WorkerInterface";
/**
 * Class that aims to make task processing as efficient as it can.
 * Each task is first attempted by an available worker in the lowest layer; if it fails, it escalates to the next layer.
 * Workers within the same layer process tasks in parallel, while escalation between layers happens sequentially.
 *
 * @template TResult the result type after processing the task
 * @template TTask task aka the entity to be processed
 * @template TWorker worker aka the entity that proceesses the task
 */
export default class PriorityWorkerQueue<TResult, TTask extends TaskInterface<TResult>, TWorker extends WorkerInterface<TResult, TTask>> {
    protected workers: TWorker[][];
    protected queues: TTask[][];
    constructor(workers: TWorker[]);
    protected groupByPriority(arr: TWorker[]): TWorker[][];
    /** Add a new task → starts in layer 0 */
    addTask(task: TTask): void;
    /** Try to assign tasks for a specific layer */
    protected dispatch(layer: number): void;
    protected processTask(task: TTask, layer: number, worker: TWorker): Promise<void>;
}
