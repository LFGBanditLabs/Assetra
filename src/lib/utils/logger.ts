type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  info(message: string, data?: any) {
    const log = this.formatLog('info', message, data);
    console.log(`[INFO] ${log.timestamp} - ${message}`, data || '');
  }

  warn(message: string, data?: any) {
    const log = this.formatLog('warn', message, data);
    console.warn(`[WARN] ${log.timestamp} - ${message}`, data || '');
  }

  error(message: string, data?: any) {
    const log = this.formatLog('error', message, data);
    console.error(`[ERROR] ${log.timestamp} - ${message}`, data || '');
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const log = this.formatLog('debug', message, data);
      console.debug(`[DEBUG] ${log.timestamp} - ${message}`, data || '');
    }
  }

  api(method: string, path: string, status: number, duration?: number) {
    this.info(`API ${method} ${path}`, {
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

export const logger = new Logger();
