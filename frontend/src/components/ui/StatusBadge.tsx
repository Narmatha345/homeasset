import { Badge } from "./Badge";
import { assetStatusStyles, maintenanceStatusStyles, priorityStyles, serviceTypeStyles } from "../../utils/status";
import type { AssetStatus, MaintenanceStatus, MaintenancePriority, ServiceType } from "../../types";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Badge styleClass={assetStatusStyles[status]}>{status}</Badge>;
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return <Badge styleClass={maintenanceStatusStyles[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  return <Badge styleClass={priorityStyles[priority]}>{priority}</Badge>;
}

export function ServiceTypeBadge({ type }: { type: ServiceType }) {
  return <Badge styleClass={serviceTypeStyles[type]}>{type}</Badge>;
}
