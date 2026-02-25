export function getStatusName(statusId, statuses) {
  const list = Array.isArray(statuses) ? statuses : [];
  const found = list.find(
    (s) => String(s.id) === String(statusId)
  );
  return found ? found.name : "";
}
