import { CompilerConfig } from "@ton-community/blueprint";

export const compile: CompilerConfig = {
  lang: "func",
  targets: ["contracts/tests/process_payload_tests.fc"],
};
