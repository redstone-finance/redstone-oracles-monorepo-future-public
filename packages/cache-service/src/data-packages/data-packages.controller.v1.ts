import { Controller } from "@nestjs/common";
import { BaseDataPackagesController } from "./base-data-packages.controller";

@Controller("data-packages")
export class DataPackagesControllerV1 extends BaseDataPackagesController {
  protected readonly allowExternalSigners = false;
}
