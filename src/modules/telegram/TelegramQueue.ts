import { LoggerConfigs, Modules } from "../../app/config/configs.js";
import getLogger from "../../core/logSystem.js";
import PriorityWorkerQueue from "../../core/PriorityWorkerQueue.js";
import { DownloadTask } from "../download/DownloadTask.js";
import { TelegramTask } from "./TelegramTask.js";
import TelegramWorker from "./TelegramWorker.js";

export default class TelegramQueue extends PriorityWorkerQueue<void, TelegramTask, TelegramWorker> {
    protected async processTask(task: TelegramTask, layer: number, worker: TelegramWorker) {
        worker.busy = true
        try {
            let result = await worker.run(task)
        } catch {
            // escalate to next layer
            if (layer + 1 < this.queues.length) {
                this.queues[layer + 1].push(task)
                this.dispatch(layer + 1)
            } else {
                if (task.retries > 0) {
                    task.retries--;
                    getLogger(LoggerConfigs[Modules.TELEGRAM_QUEUE]).debug('Retrying song task...', { meta: { songId: task.track.id } })
                    this.addTask(task)
                }
                else {
                    (new DownloadTask({ ...task, client: worker.client }, {
                        onSuccess: undefined,
                        onFailure: task.handlers.onFailure,
                        afterSuccess: undefined,
                        afterFailure: undefined
                    })).onFailure()
                    task.onFailure()
                }
            }
        } finally {
            worker.busy = false
            this.dispatch(layer) // free worker → check for new tasks
        }
    }
}