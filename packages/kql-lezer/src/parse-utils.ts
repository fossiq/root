export type TreeCursorLike = {
  firstChild(): boolean;
  nextSibling(): boolean;
  parent(): void;
};

export function walkTree(cursor: TreeCursorLike, visit: () => void): void {
  const hasChild = cursor.firstChild();
  if (hasChild) {
    do {
      walkTree(cursor, visit);
    } while (cursor.nextSibling());
    cursor.parent();
    return;
  }
  visit();
}
