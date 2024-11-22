#!/usr/bin/env node

import prompts, { PromptObject } from "prompts";
import { deployMultiFeedAdapterPrompt } from "./prompts/deploy-adapter-prompt";
import { deployPriceFeedsPrompt } from "./prompts/deploy-price-feeds-prompt";
import { runRelayerPrompt } from "./prompts/run-relayer-prompt";
import { checkIfNewestVersionIsUsed } from "./src/checks";
import { displayRedStoneLogo, onCancel } from "./src/utils";

interface PromptResponse {
  whatToDo: "deploy-multi-feed-adapter" | "deploy-price-feeds" | "run-relayer";
}

void (async () => {
  displayRedStoneLogo();
  await checkIfNewestVersionIsUsed();

  const questions: PromptObject[] = [
    {
      type: "select",
      name: "whatToDo",
      message: "What do you want to do?",
      choices: [
        {
          title: "Deploy multi-feed adapter",
          value: "deploy-multi-feed-adapter",
        },
        { title: "Deploy price feeds", value: "deploy-price-feeds" },
        { title: "Run relayer", value: "run-relayer" },
      ],
    },
  ];

  const { whatToDo } = (await prompts(questions, {
    onCancel,
  })) as PromptResponse;

  if (whatToDo === "deploy-multi-feed-adapter") {
    await deployMultiFeedAdapterPrompt();
  } else if (whatToDo === "deploy-price-feeds") {
    await deployPriceFeedsPrompt();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (whatToDo === "run-relayer") {
    await runRelayerPrompt();
  } else {
    throw new Error("Error happened, exiting...");
  }
})();
