import * as fs from 'fs';
import * as path from 'path';

export function loadTemplate(
  templateName: string,
  variables: Record<string, string> = {},
): string {
  const templatePath = path.join(
    __dirname,
    'templates',
    `${templateName}.html`,
  );
  let html = fs.readFileSync(templatePath, 'utf-8');

  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html;
}
