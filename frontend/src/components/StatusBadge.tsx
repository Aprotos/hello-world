const STATUS_STYLES: Record<string, string> = {
  // Route / Stop statuses
  'Planned': 'bg-gray-100 text-gray-700',
  'Loaded': 'bg-purple-100 text-purple-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-700',
  'Delivered': 'bg-emerald-100 text-emerald-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'Skipped': 'bg-red-100 text-red-700',
  'No Access': 'bg-red-100 text-red-700',
  // Order statuses
  'Paid': 'bg-emerald-100 text-emerald-700',
  'Invoiced': 'bg-blue-100 text-blue-700',
  'Confirmed': 'bg-teal-100 text-teal-700',
  // Customer statuses
  'Active': 'bg-emerald-100 text-emerald-700',
  'Inactive': 'bg-gray-100 text-gray-600',
  'Hold': 'bg-red-100 text-red-700',
  // Driver statuses
  'On Leave': 'bg-amber-100 text-amber-700',
  'Maintenance': 'bg-amber-100 text-amber-700',
  'Out of Service': 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${style}`}>{status}</span>
  );
}
