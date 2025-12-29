export function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
}
