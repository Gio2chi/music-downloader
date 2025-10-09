/**
 * Represents a unit of work (task) that can be executed by a worker. 
 * Encapsulates both the data required to perform the task and the callbacks to handle success or failure.
 * 
 * @param TBody The input data type required to execute the task.
 * @param TResult The type of result produced upon successful completion.
 * 
 * @method onSuccess function called when the task resolves successfully
 * @method onFailure function called when the task resolves with an error
 */
export default interface TaskInterface<TBody, TResult> {
    body: TBody
    onSuccess: (result: TResult) => Promise<void>
    onFailure: () => Promise<void>
}
