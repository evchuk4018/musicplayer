export async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    return undefined;
  }
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(error: unknown) {
  console.error(error);
  return Response.json({ error: 'Something went wrong' }, { status: 500 });
}
