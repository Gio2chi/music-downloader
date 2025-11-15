import TaskInterface from "./TaskInterface"
import WorkerInterface from "./WorkerInterface"

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
    protected workers: TWorker[][]
    protected queues: TTask[][]

    constructor(workers: TWorker[]) {
        this.workers = this.groupByPriority(workers)
        this.queues = this.workers.map(() => [])
    }

    protected groupByPriority(arr: TWorker[]): TWorker[][] {
        const groups = new Map<number, TWorker[]>()
        for (const item of arr) {
            if (!groups.has(item.priority)) groups.set(item.priority, [])
            groups.get(item.priority)!.push(item)
        }
        return [...groups.entries()]
            .sort(([a], [b]) => a - b)
            .map(([_, w]) => w)
    }

    /** Add a new task → starts in layer 0 */
    public addTask(task: TTask) {
        this.queues[0].push(task)
        this.dispatch(0)
    }

    /** Try to assign tasks for a specific layer */
    protected dispatch(layer: number) {
        const queue = this.queues[layer]
        if (queue.length === 0) return

        for (const worker of this.workers[layer]) {
            if (worker.busy) continue
            const task = queue.shift()
            if (!task) break
            this.processTask(task, layer, worker)
        }
    }

    protected async processTask(task: TTask, layer: number, worker: TWorker) {
        worker.busy = true
        try {
            let result = await worker.run(task)
            task.onSuccess(result)
            if(task.afterSuccess)
                task.afterSuccess() 
        } catch {
            // escalate to next layer
            if (layer + 1 < this.queues.length) {
                this.queues[layer + 1].push(task)
                this.dispatch(layer + 1)
            } else {
                task.onFailure()
                if(task.afterFailure) 
                    task.afterFailure()
            }
        } finally {
            worker.busy = false
            this.dispatch(layer) // free worker → check for new tasks
        }
    }
}
