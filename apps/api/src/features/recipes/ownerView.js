export function toOwnerView(recipe) {
  const view = { id: String(recipe._id), ...recipe };
  delete view._id;
  delete view.__v;
  delete view.seedKey;
  return view;
}
