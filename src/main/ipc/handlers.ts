import { registerFileHandlers } from './file-handlers.js'
import { registerLLMHandlers } from './llm-handlers.js'

export function registerAllHandlers() {
  registerFileHandlers()
  registerLLMHandlers()
  // Future handlers:
  // registerStoreHandlers()
  // registerCalendarHandlers()
  // registerNotificationHandlers()
}
