export const DEPARTMENTS = [
  'Yazılım',
  'Tasarım',
  'Ürün Yönetimi',
  'Yönetim',
  'QA / Test',
  'DevOps',
  'Pazarlama',
  'HR',
  'Genel',
] as const;

export type Department = (typeof DEPARTMENTS)[number];
