import crypto from 'node:crypto';

const PASSWORD_KEY_LENGTH = 64;

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const createSessionToken = () => crypto.randomBytes(32).toString('hex');

export const hashSessionToken = (token: string) => hashValue(token);

export const hashPassword = (password: string) =>
  new Promise<string>((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`${salt}:${Buffer.from(derivedKey).toString('hex')}`);
    });
  });

export const verifyPassword = (password: string, storedHash: string) =>
  new Promise<boolean>((resolve, reject) => {
    const [salt, originalHash] = storedHash.split(':');

    if (!salt || !originalHash) {
      resolve(false);
      return;
    }

    crypto.scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const originalBuffer = Buffer.from(originalHash, 'hex');
      const derivedBuffer = Buffer.from(derivedKey);

      if (originalBuffer.length !== derivedBuffer.length) {
        resolve(false);
        return;
      }

      resolve(crypto.timingSafeEqual(originalBuffer, derivedBuffer));
    });
  });
