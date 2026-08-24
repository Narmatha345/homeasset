import { IAsset } from "../models/Asset";
import { calculateNextServiceDate } from "../utils/maintenanceDate";

/**
 * Shared by ServiceRecord creation and ServiceOrder completion: records when an asset was
 * last serviced and refreshes its next-service date from frequency + last-service, unless an
 * explicit next-service date was supplied.
 */
export async function applyServiceToAsset(asset: IAsset, serviceDate: Date, explicitNextServiceDate?: Date | null) {
  asset.lastServiceDate = serviceDate;
  const computed = explicitNextServiceDate || calculateNextServiceDate(serviceDate, asset.maintenanceFrequency, asset.customFrequencyDays);
  if (computed) asset.nextServiceDate = computed;
  await asset.save();
}
