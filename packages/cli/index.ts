#!/usr/bin/env node

import prompts, { PromptObject } from "prompts";
import { deployMultiFeedAdapter } from "./prompts/deploy-adapter-prompt";
import { deployPriceFeeds } from "./prompts/deploy-price-feeds-prompt";
import { displayRedStoneLogo } from "./src/utils";

void (async () => {
  displayRedStoneLogo();

  const questions = [
    {
      type: "select",
      name: "whatToDo",
      message: "What do you want to do?",
      choices: [
        {
          title: "Deploy multi-feed adapter",
          value: "multi-feed-adapter",
        },
        { title: "Deploy price feeds", value: "price-feeds" },
      ],
    },
  ] as PromptObject[];

  const { whatToDo } = await prompts(questions);

  if (whatToDo === "multi-feed-adapter") {
    await deployMultiFeedAdapter();
  } else if (whatToDo === "price-feeds") {
    await deployPriceFeeds();
  } else {
    throw new Error("Error happened, exiting...");
  }
})();
