import fs from "fs-extra";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { open as openFile } from "node:fs/promises";

export function getTempPath(filePath: string, stateFileName: string): string {
  const dir = path.dirname(filePath);
  const id = crypto.randomUUID();
  return path.join(dir, `${stateFileName}.tmp-${id}`);
}

export async function acquireLock(
  lockPath: string,
): Promise<() => Promise<void>> {
  const handle = await openFile(lockPath, "wx");
  try {
    await handle.writeFile(
      JSON.stringify({
        pid: process.pid,
        createdAt: new Date().toISOString(),
      }),
    );
  } finally {
    await handle.close();
  }

  return async (): Promise<void> => {
    try {
      await fs.remove(lockPath);
    } catch {
      // best-effort cleanup
    }
  };
}

export async function backupInvalidStateFile(
  filePath: string,
  stateFileName: string,
): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(dir, `${stateFileName}.corrupt-${timestamp}`);
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return;
    }
    await fs.move(filePath, backupPath, { overwrite: false });
  } catch {
    // best-effort; do not block recovery
  }
}
