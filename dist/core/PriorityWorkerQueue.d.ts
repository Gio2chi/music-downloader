import TaskInterface from "./TaskInterface";
import WorkerInterface from "./WorkerInterface";
/**
 * Class that aims to make task processing as efficient as it can.
 * Each task is first attempted by an available worker in the lowest layer; if it fails, it escalates to the next layer.
 * Workers within the same layer process tasks in parallel, while escalation between layers happens sequentially.
 *
 * @param T body of the task, aka variables needed to solve the task
 * @param R the result type after processing the task
 * @param W worker aka the entity that proceesses the task
 */
export default class PriorityWorkerQueue<TBody, TResult, TWorker extends WorkerInterface<TBody, TResult>> {
    private workers;
    private queues;
    constructor(workers: TWorker[]);
    private groupByPriority;
    /** Add a new task → starts in layer 0 */
    addTask(task: TaskInterface<TBody, TResult>): void;
    /** Try to assign tasks for a specific layer */
    private dispatch;
    private processTask;
}
