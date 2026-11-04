export { MockApiClient } from "./mock-api";

export class CreateClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateClientException";
  }
}
