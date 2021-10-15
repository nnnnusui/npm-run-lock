#!/usr/bin/env node
import chalk = require("chalk");
import { spawn } from "cross-spawn";
import { existsSync, mkdirSync, unlink, writeFile } from "fs";

const scriptName = process.env.npm_lifecycle_event;
const lockDir = ".lock";
const lockFile = `${lockDir}/${scriptName}.lock`;
const script = chalk.greenBright(scriptName);
const log = (message?: any) =>
  console.log(`${chalk.green(`[lock]`)} ${message}`);

const ProcessLocker = (command: string[], lockFilePath: string) => {
  const locked = () => existsSync(lockFile);
  const unlocked = () => !locked();
  return {
    spawn: () =>
      new Promise<number>((resolve, reject) => {
        const [head, ...tails] = command;
        spawn(head, tails, {
          env: process.env,
          stdio: "inherit",
        }).on("exit", (code) => (code ? resolve(code) : reject(code)));
      }),
    lock: () =>
      new Promise<void>((resolve, reject) => {
        if (locked()) return resolve();
        writeFile(lockFilePath, "", (error) => {
          if (error) return reject(error);
          else return resolve();
        });
      }),
    unlock: () =>
      new Promise<void>((resolve, reject) => {
        if (unlocked()) return resolve();
        unlink(lockFilePath, (error) => {
          if (error) return reject(error);
          else return resolve();
        });
      }),
    locked,
    unlocked,
  };
};

const main = async () => {
  if (!existsSync(lockDir)) mkdirSync(lockDir);

  const [, , ...inputs] = process.argv;
  const locker = ProcessLocker(inputs, lockFile);
  if (locker.locked()) {
    log(`${script} is already locked.`);
    const warn = chalk.rgb(255, 103, 0)("[warn]");
    log(
      `${warn} If you exit the editor before exiting the command (#1), you may end up with a '.lock' file.`
    );
    log(`${warn} In that case, delete the .lock directory manually.`);
    return;
  }

  const unlock = async () => {
    await locker.unlock();
    log(`unlocked ${script}`);
    process.exit();
  };

  process.on("exit", unlock);
  process.on("SIGINT", unlock);
  process.on("SIGQUIT", unlock);
  process.on("SIGTERM", unlock);

  await locker
    .lock()
    .then(() => log(`locked ${script}`))
    .catch((error) => {
      throw error;
    });

  await locker.spawn().finally(unlock);
};
main();
