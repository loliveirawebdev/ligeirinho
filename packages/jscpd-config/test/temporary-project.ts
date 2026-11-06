import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** A function long enough (well over 50 tokens) to count as a clone when it appears twice. */
export function registrationTotal(functionName: string): string {
  return `
export function ${functionName}(seats: readonly { price: number; discount: number; taxRate: number }[]): number {
  let total = 0;
  for (const seat of seats) {
    const discountedPrice = seat.price - seat.price * seat.discount;
    const taxedPrice = discountedPrice + discountedPrice * seat.taxRate;
    if (taxedPrice > 1000) {
      total += taxedPrice * 0.95;
    } else {
      total += taxedPrice;
    }
  }
  return Math.round(total * 100) / 100;
}
`;
}

/** Creates a project folder in the OS temp dir with the given files (relative path → content). */
export async function createTemporaryProject(files: Record<string, string>): Promise<string> {
  const projectDir = await mkdtemp(path.join(tmpdir(), 'ligeirinho-jscpd-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(projectDir, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }
  return projectDir;
}
