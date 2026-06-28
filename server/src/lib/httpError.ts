// Lightweight typed HTTP error for the service layer to throw; the central
// error handler maps it to a JSON response.
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}
