import PriorityWorkerQueue from "../../core/PriorityWorkerQueue.js";
import { TelegramTask } from "./TelegramTask.js";
import TelegramWorker from "./TelegramWorker.js";
export default class TelegramQueue extends PriorityWorkerQueue<void, TelegramTask, TelegramWorker> {
    protected processTask(task: TelegramTask, layer: number, worker: TelegramWorker): Promise<void>;
}
