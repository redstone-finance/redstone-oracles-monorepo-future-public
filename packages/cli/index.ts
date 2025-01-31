import prompts, { PromptObject } from "prompts";
import { init } from "./init";
import { deployAdapterAndFeedsPrompt } from "./prompts/deploy-adapter-and-feeds";
import { runRelayerPrompt } from "./prompts/run-relayer-prompt";
import { checkIfNewestVersionIsUsed } from "./src/checks";
import { checkIfInit, displayRedStoneLogo, onCancel } from "./src/utils";

interface PromptResponse {
  whatToDo: "deploy-contracts" | "run-relayer";
}

void (async () => {
  if (checkIfInit()) {
    init();
  }

  displayRedStoneLogo();
  await checkIfNewestVersionIsUsed();

  const questions: PromptObject[] = [
    {
      type: "select",
      name: "whatToDo",
      message: "What do you want to do?",
      choices: [
        {
          title: "Deploy contracts",
          value: "deploy-contracts",
        },
        { title: "Run relayer", value: "run-relayer" },
      ],
    },
  ];

  const { whatToDo } = (await prompts(questions, {
    onCancel,
  })) as PromptResponse;

  if (whatToDo === "deploy-contracts") {
    await deployAdapterAndFeedsPrompt();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (whatToDo === "run-relayer") {
    await runRelayerPrompt();
  } else {
    throw new Error("Error happened, exiting...");
  }
})();
