export interface LogEntry {
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private addLog(level: LogEntry["level"], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }

    this.logs.unshift(entry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Also log to console for development
    console[level](message, data)

    // Simulate writing to file (in real app, this would be an API call)
    this.writeToFile(entry)
  }

  private async writeToFile(entry: LogEntry) {
    try {
      // Simulate API call to write log to file
      const logText = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message} ${JSON.stringify(entry.data || {})}\n`

      // In a real application, you would send this to your backend
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ log: logText })
      // })

      console.log("Log written to file:", logText)
    } catch (error) {
      console.error("Failed to write log to file:", error)
    }
  }

  info(message: string, data?: any) {
    this.addLog("info", message, data)
  }

  warn(message: string, data?: any) {
    this.addLog("warn", message, data)
  }

  error(message: string, data?: any) {
    this.addLog("error", message, data)
  }

  debug(message: string, data?: any) {
    this.addLog("debug", message, data)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }
}

export const logger = new Logger()
