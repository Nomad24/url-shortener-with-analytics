import { nanoid } from 'nanoid';
import { prisma } from '../config/prisma.js';

export async function generateCode() {
  let code;
  let exists;

  do {
    code = nanoid(6);
    const link = await prisma.link.findUnique({
      where: { shortCode: code },
      select: { id: true },
    });
    exists = !!link;
  } while (exists);

  return code;
}
