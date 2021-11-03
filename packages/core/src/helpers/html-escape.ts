export function htmlAttributeEscape(value: string): string {
  debugger;
  return value.replace(/"/g, '&quot;').replace(/\n/g, '\\n');
}
