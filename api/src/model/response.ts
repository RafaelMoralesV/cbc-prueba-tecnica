export type PaginateResponseShape<T> = {
  items: Array<T>;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export const createPaginateResponse = <T>(
  items: Array<T>,
  page: number,
  page_size: number,
): PaginateResponseShape<T> => {
  if (!page || page < 1) {
    page = 1;
  }

  if (!page_size || page_size < 1) {
    page_size = 100;
  }

  const total_items = items.length;
  const total_pages = Math.floor(total_items / page_size) + 1;

  const first_item_index = (page - 1) * page_size;
  const last_item_index = page * page_size;

  const new_items = items.slice(first_item_index, last_item_index);
  return { items: new_items, page, page_size, total_items, total_pages };
};
