import * as fs from "node:fs";
import * as readline from "readline";

const OUTPUT_FILE = "web3-function_redstone.deployed";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line: string) => {
  const cleanLine = line.replace(/\[[0-9;]*m/g, "");
  const match = cleanLine.match(/CID: (\S+)/);
  if (match) {
    const cid = match[1];
    fs.writeFileSync(OUTPUT_FILE, cid);
  }
});

process.on("exit", () => {
  fs.appendFileSync(OUTPUT_FILE, "\n");
});
