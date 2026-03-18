import { registerFileHandlers } from './file-handlers.js'
import { registerLLMHandlers } from './llm-handlers.js'
import { registerStoreHandlers } from './store-handlers.js'

export function registerAllHandlers() {
  registerFileHandlers()
  registerLLMHandlers()
  registerStoreHandlers()
  // Future handlers:
  // registerCalendarHandlers()
  // registerNotificationHandlers()
}
