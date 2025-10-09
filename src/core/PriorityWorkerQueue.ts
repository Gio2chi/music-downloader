import TaskInterface from "./TaskInterface"
import WorkerInterface from "./WorkerInterface"

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
    private workers: TWorker[][]
    private queues: TaskInterface<TBody, TResult>[][]

    constructor(workers: TWorker[]) {
        this.workers = this.groupByPriority(workers)
        this.queues = this.workers.map(() => [])
    }

    private groupByPriority(arr: TWorker[]): TWorker[][] {
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
    public addTask(task: TaskInterface<TBody, TResult>) {
        this.queues[0].push(task)
        this.dispatch(0)
    }

    /** Try to assign tasks for a specific layer */
    private dispatch(layer: number) {
        const queue = this.queues[layer]
        if (queue.length === 0) return

        for (const worker of this.workers[layer]) {
            if (worker.busy) continue
            const task = queue.shift()
            if (!task) break
            this.processTask(task, layer, worker)
        }
    }

    private async processTask(task: TaskInterface<TBody, TResult>, layer: number, worker: TWorker) {
        worker.busy = true
        try {
            let result = await worker.run(task)
            task.onSuccess(result)
        } catch {
            // escalate to next layer
            if (layer + 1 < this.queues.length) {
                this.queues[layer + 1].push(task)
                this.dispatch(layer + 1)
            } else {
                task.onFailure()
            }
        } finally {
            worker.busy = false
            this.dispatch(layer) // free worker → check for new tasks
        }
    }
}
