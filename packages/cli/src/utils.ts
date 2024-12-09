import chalk from "chalk";

export const displayRedStoneLogo = () => {
  const redstoneColor = chalk.hex("#FD627A");
  console.log(
    redstoneColor(`
    ██████╗ ███████╗██████╗ ███████╗████████╗ ██████╗ ███╗   ██╗███████╗
    ██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
    ██████╔╝█████╗  ██║  ██║███████╗   ██║   ██║   ██║██╔██╗ ██║█████╗  
    ██╔══██╗██╔══╝  ██║  ██║╚════██║   ██║   ██║   ██║██║╚██╗██║██╔══╝  
    ██║  ██║███████╗██████╔╝███████║   ██║   ╚██████╔╝██║ ╚████║███████╗
    ╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
  `)
  );
};

export const onCancel = () => {
  console.log("Canceled....");
  process.exit(1);
};

export const checkIfInit = () => {
  const INIT_COMMAND = "init";
  const argumentsPassed = process.argv.slice(2);
  return argumentsPassed[0] === INIT_COMMAND;
};
