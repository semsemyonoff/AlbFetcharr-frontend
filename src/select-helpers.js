// Sorting, filtering, and pagination helpers for the select step

export function sortAlbums(albums, key, direction = 'asc') {
  const list = [...albums];
  const dir = direction === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    let av, bv;

    switch (key) {
      case 'artist':
        av = a.artist;
        bv = b.artist;
        break;
      case 'album':
        av = a.album;
        bv = b.album;
        break;
      case 'year':
        av = a.year;
        bv = b.year;
        break;
      case 'added':
        av = -a.addedDaysAgo;
        bv = -b.addedDaysAgo;
        break;
      default:
        av = 0;
        bv = 0;
    }

    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  return list;
}

export function filterAlbums(albums, query, statusFilter = null) {
  if (!query && !statusFilter) {
    return albums;
  }

  return albums.filter((album) => {
    // Status filter
    if (statusFilter && album.status !== statusFilter) {
      return false;
    }

    // Query filter
    if (query) {
      const q = query.toLowerCase().trim();
      const matches =
        album.artist.toLowerCase().includes(q) ||
        album.album.toLowerCase().includes(q) ||
        String(album.year).includes(q);

      if (!matches) {
        return false;
      }
    }

    return true;
  });
}

export function paginate(rows, page, perPage) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * perPage;
  const visible = rows.slice(start, start + perPage);

  return {
    visible,
    safePage,
    pages,
    total,
    start,
  };
}
