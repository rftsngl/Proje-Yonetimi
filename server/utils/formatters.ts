import crypto from 'node:crypto';

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
});

const relativeFormatter = new Intl.RelativeTimeFormat('tr-TR', {
  numeric: 'auto',
});

export const formatDisplayDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  return dateFormatter.format(date);
};

export const formatRelativeTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeFormatter.format(diffDays, 'day');
};

export const calculateDaysLeft = (endDate: string | Date | null) => {
  if (!endDate) {
    return 0;
  }

  const target = endDate instanceof Date ? endDate : new Date(endDate);
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const createEntityId = (prefix: string) => {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${prefix}-${parts}${randomSuffix}`;
};
