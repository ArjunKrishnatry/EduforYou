import { registerFileHandlers } from './file-handlers.js'

export function registerAllHandlers() {
  registerFileHandlers()
  // Future handlers will be registered here:
  // registerLLMHandlers()
  // registerStoreHandlers()
  // registerCalendarHandlers()
  // registerNotificationHandlers()
}
