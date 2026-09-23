import type { EventStatus, ReservaStatus } from "../../models/types";
import { statusColor } from "../../utils/format";

export function Badge({ status }: { status: EventStatus | ReservaStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(status)}`}>
      {status}
    </span>
  );
}

