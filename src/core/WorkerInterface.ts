import TaskInterface from "./TaskInterface"

/**
 * Defines a worker capable of executing tasks of a specific type.
 * Workers are grouped by priority and can process tasks asynchronously.
 *
 * @template TBody - Type of the task's input data.
 * @template TResult - Type of the result returned on success.
 *
 * @property {number} priority - Determines worker order; lower numbers are tried first.
 * @property {boolean} busy - True if the worker is currently processing a task.
 * @method run - Executes a task and returns a promise that resolves with the result.
 *                Should reject or throw on failure to allow task escalation.
 *
 * @param task - The task instance to be executed.
 * @returns {Promise<TResult>} Promise resolving with the task result on success.
 */
export default interface WorkerInterface<TBody, TResult> {
    priority: number
    busy: boolean
    run: (task: TaskInterface<TBody, TResult>) => Promise<TResult>
}