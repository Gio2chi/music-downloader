import TaskInterface from "./TaskInterface"

/**
 * Defines a worker capable of executing tasks of a specific type.
 * Workers are grouped by priority and can process tasks asynchronously.
 *
 * @template TResult - Type of the result returned on success.
 *
 * @property {number} priority - Determines worker order; lower numbers are tried first.
 * @property {boolean} busy - True if the worker is currently processing a task.
 * @method run - Executes a task and returns a promise that resolves with the result.
 *                Should reject or throw on failure to allow task escalation.
 */
export default interface WorkerInterface<TResult, TTask extends TaskInterface<TResult>> {
    priority: number
    busy: boolean

    /*
     * @param task - The task instance to be executed.
     * @returns {Promise<TResult>} Promise resolving with the task result on success.
     */
    run: (task: TTask) => Promise<TResult>
}