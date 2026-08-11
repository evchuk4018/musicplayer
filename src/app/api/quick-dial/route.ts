import { DEMO_APP_STATE } from '@/lib/demo-data';
import { databaseConfigured } from '@/server/db/client';
import { getLibrarySnapshot } from '@/server/library/playlist-repository';
import { SpeedDialCapacityError, reorderSpeedDial, toggleSpeedDialPin, type SpeedDialKind } from '@/server/library/speed-dial-repository';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { speedDialOrderSchema, speedDialPinSchema } from '@/server/protocol/schemas';

export async function PATCH(request: Request) {
  const body = await readJson(request);
  const pinMutation = speedDialPinSchema.safeParse(body);
  const orderMutation = speedDialOrderSchema.safeParse(body);
  try {
    if (pinMutation.success) {
      if (!databaseConfigured()) return Response.json({ speedDial: DEMO_APP_STATE.library.speedDial, persisted: false });
      await toggleSpeedDialPin(pinMutation.data.kind as SpeedDialKind, pinMutation.data.itemId, pinMutation.data.enabled);
      const library = await getLibrarySnapshot();
      return Response.json({ speedDial: library.speedDial, persisted: true });
    }
    if (orderMutation.success) {
      if (!databaseConfigured()) return Response.json({ speedDial: DEMO_APP_STATE.library.speedDial, persisted: false });
      await reorderSpeedDial(orderMutation.data.items.map((item) => ({ kind: item.kind as SpeedDialKind, id: item.itemId })));
      const library = await getLibrarySnapshot();
      return Response.json({ speedDial: library.speedDial, persisted: true });
    }
    return badRequest('Invalid Speed Dial update');
  } catch (error) {
    if (error instanceof SpeedDialCapacityError) return badRequest(error.message);
    return serverError(error);
  }
}
