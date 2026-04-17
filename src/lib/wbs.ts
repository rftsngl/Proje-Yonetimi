import { Task, TaskTreeItem } from '../types';

const parseWbsSegments = (value?: string | null): Array<number | string> => {
  if (!value) {
    return [];
  }

  return value
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment.toLowerCase()));
};

export const compareWbsCodes = (left?: string | null, right?: string | null) => {
  const leftParts = parseWbsSegments(left);
  const rightParts = parseWbsSegments(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index];
    const rightPart = rightParts[index];

    if (leftPart === undefined) {
      return -1;
    }
    if (rightPart === undefined) {
      return 1;
    }

    if (typeof leftPart === 'number' && typeof rightPart === 'number') {
      if (leftPart !== rightPart) {
        return leftPart - rightPart;
      }
      continue;
    }

    const leftText = String(leftPart);
    const rightText = String(rightPart);
    const textCompare = leftText.localeCompare(rightText, 'tr');
    if (textCompare !== 0) {
      return textCompare;
    }
  }

  return 0;
};

export const compareTasksByWbs = <T extends Pick<Task, 'wbsCode' | 'id'>>(left: T, right: T) => {
  const byWbs = compareWbsCodes(left.wbsCode, right.wbsCode);
  if (byWbs !== 0) {
    return byWbs;
  }
  return left.id.localeCompare(right.id, 'tr');
};

export const sortTaskTreeByWbs = (nodes: TaskTreeItem[]): TaskTreeItem[] =>
  [...nodes]
    .sort(compareTasksByWbs)
    .map((node) => ({
      ...node,
      children: sortTaskTreeByWbs(node.children || []),
    }));
