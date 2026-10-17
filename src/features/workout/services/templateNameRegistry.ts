export class TemplateNameAlreadyExistsError extends Error {
  constructor() {
    super('A workout template with this name already exists.');
    this.name = 'TemplateNameAlreadyExistsError';
  }
}

type TemplateNameEntry = {
  id: string;
  data: () => Record<string, unknown>;
};

export const assertTemplateNameAvailable = (
  templates: readonly TemplateNameEntry[],
  templateName: string,
  currentTemplateId?: string,
): void => {
  const normalizedName = templateName.trim().toLowerCase();
  const duplicate = templates.some(template => {
    if (template.id === currentTemplateId) return false;
    const existingName = template.data()['templateName'];
    return typeof existingName === 'string' &&
      existingName.trim().toLowerCase() === normalizedName;
  });

  if (duplicate) throw new TemplateNameAlreadyExistsError();
};

export const getTemplateNameKey = (templateName: string): string =>
  encodeURIComponent(templateName.trim().toLowerCase());

export const getTemplateNameRegistry = (userData: Record<string, unknown> | undefined): Record<string, string> => {
  const registry = userData?.['workoutTemplateNames'];
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) return {};
  return Object.fromEntries(
    Object.entries(registry).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
};
