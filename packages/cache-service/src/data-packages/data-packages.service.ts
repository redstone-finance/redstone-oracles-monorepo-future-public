import { Injectable } from "@nestjs/common";

@Injectable()
export class DataPackagesService {
  getHello(): string {
    return "Hello World! I was updated :)";
  }
}
