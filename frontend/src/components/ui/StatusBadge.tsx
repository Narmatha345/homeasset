import { Badge } from "./Badge";
import {
  assetStatusStyles,
  maintenanceStatusStyles,
  priorityStyles,
  serviceTypeStyles,
  serviceOrderStatusStyles,
  serviceOrderPriorityStyles,
  requestTypeStyles,
} from "../../utils/status";
import type {
  AssetStatus,
  MaintenanceStatus,
  MaintenancePriority,
  ServiceType,
  ServiceOrderStatus,
  ServiceOrderPriority,
  RequestType,
} from "../../types";

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

export function ServiceOrderStatusBadge({ status }: { status: ServiceOrderStatus }) {
  return <Badge styleClass={serviceOrderStatusStyles[status]}>{status}</Badge>;
}

export function ServiceOrderPriorityBadge({ priority }: { priority: ServiceOrderPriority }) {
  return <Badge styleClass={serviceOrderPriorityStyles[priority]}>{priority}</Badge>;
}

export function RequestTypeBadge({ type }: { type: RequestType }) {
  return <Badge styleClass={requestTypeStyles[type]}>{type}</Badge>;
}
