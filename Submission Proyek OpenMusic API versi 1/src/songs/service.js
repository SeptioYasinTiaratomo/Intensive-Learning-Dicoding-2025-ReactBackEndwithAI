const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../exceptions/NotFoundError');
const InvariantError = require('../exceptions/InvariantError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, performer, genre, duration, albumId
  }) {
    const id = `song-${nanoid(16)}`;

    const query = {
      text: `
        INSERT INTO songs (id, title, year, performer, genre, duration, album_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      values: [
        id,
        title ?? 'Untitled',
        year ?? new Date().getFullYear(),
        performer ?? 'Unknown Artist',
        genre ?? 'Unknown',
        duration ?? null,
        albumId ?? null,
      ],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0]?.id) {
      throw new InvariantError('Gagal menambahkan lagu');
    }

    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    let query = {
      text: 'SELECT id, title, performer FROM songs',
    };

    if (title || performer) {
      const conditions = [];
      const values = [];

      if (title) {
        values.push(`%${title.toLowerCase()}%`);
        conditions.push(`LOWER(title) LIKE $${values.length}`);
      }

      if (performer) {
        values.push(`%${performer.toLowerCase()}%`);
        conditions.push(`LOWER(performer) LIKE $${values.length}`);
      }

      query = {
        text: `SELECT id, title, performer FROM songs WHERE ${conditions.join(' AND ')}`,
        values,
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: `
        SELECT id, title, year, performer, genre, duration, album_id AS "albumId"
        FROM songs WHERE id = $1
      `,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows[0];
  }

  async editSongById(id, {
    title, year, performer, genre, duration, albumId
  }) {
    const query = {
      text: `
        UPDATE songs
        SET title = $1,
            year = $2,
            performer = $3,
            genre = $4,
            duration = $5,
            album_id = $6
        WHERE id = $7
        RETURNING id
      `,
      values: [
        title ?? 'Untitled',
        year ?? new Date().getFullYear(),
        performer ?? 'Unknown Artist',
        genre ?? 'Unknown',
        duration ?? null,
        albumId ?? null,
        id,
      ],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongsService;
