import { Controller, Get, Post } from "@nestjs/common";

@Controller("data-packages")
export class DataPackagesController {
  @Get("latest")
  async getLatest(): Promise<string> {
    return "Should return the latest data packages for the given data feed id";
  }

  @Post("bulk")
  async addBulk(): Promise<string> {
    return "TODO: implement. Will add many data packages";
  }

  @Post()
  async addOne(): Promise<string> {
    return "TODO: implement. Will add one";
  }
}
