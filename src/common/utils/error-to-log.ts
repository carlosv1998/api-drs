export function errorToLog(defaultMessage: string, error: any): string {
  return `${defaultMessage}: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}
