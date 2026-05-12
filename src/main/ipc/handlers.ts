import { registerFileHandlers } from './file-handlers.js'
import { registerLLMHandlers } from './llm-handlers.js'
import { registerStoreHandlers } from './store-handlers.js'
import { registerCalendarHandlers } from './calendar-handlers.js'
import { registerNotificationHandlers } from './notification-handlers.js'

export function registerAllHandlers() {
  registerFileHandlers()
  registerLLMHandlers()
  registerStoreHandlers()
  registerCalendarHandlers()
  registerNotificationHandlers()
}
