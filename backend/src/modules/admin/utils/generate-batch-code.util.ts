interface BatchCodeParent {
  slug?: string;
  title?: string;
}

const buildParentPrefix = (parent: BatchCodeParent): string => {
  const source = parent.slug || parent.title || 'batch';
  const words = source
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  const prefix = words
    .map((word) => word[0])
    .join('')
    .slice(0, 8);

  return (prefix || source.slice(0, 8)).toUpperCase();
};

export const generateBatchCode = (parent: BatchCodeParent, startDate: Date): string => {
  const prefix = buildParentPrefix(parent);
  const year = startDate.getUTCFullYear();
  const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(startDate.getUTCDate()).padStart(2, '0');

  return `${prefix}-${year}${month}${day}`;
};
