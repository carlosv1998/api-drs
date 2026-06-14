import { FilterDto, PaginationDto } from '../dtos/filter.dto';
import {
  IPaginatedResponse,
  IPaginationMeta,
} from '../interfaces/paginated-response.interface';

/**
 * Converts a raw query-string value to the most appropriate JS type.
 * "true"/"false" → boolean, numeric strings → number, everything else → string.
 */
function coerceValue(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)))
    return Number(value);
  return value;
}

export class PrismaHelper {
  /**
   * Builds a Prisma `where` clause from a FilterDto.
   *
   * - `filterDto.search` → OR across every listed searchable field (case-insensitive contains).
   *   All keys in the search object share the same search term; the first non-empty value is used.
   * - `filterDto.filter` → AND exact-match conditions; string/number arrays become `{ in: [...] }`,
   *   boolean arrays use direct equality (Prisma MongoDB doesn't support `in` on booleans).
   * - `filterDto.startDate` / `filterDto.endDate` → date range conditions.
   *
   * @param filterDto   - Parsed filter object from the query string.
   * @param searchFields - Which model fields to search across (e.g. ['firstName', 'email']).
   */
  static buildWhere(
    filterDto: FilterDto | undefined,
    searchFields: string[] = [],
  ): Record<string, any> {
    if (!filterDto) return {};

    const andConditions: Record<string, any>[] = [];

    // ── Search (OR across multiple fields) ──────────────────────────────────
    if (filterDto.search && searchFields.length > 0) {
      const searchTerm = Object.values(filterDto.search).find(
        (v) => v && v.trim() !== '',
      );

      if (searchTerm) {
        andConditions.push({
          OR: searchFields.map((field) => ({
            [field]: { contains: searchTerm, mode: 'insensitive' },
          })),
        });
      }
    }

    // ── Exact / $in filters ──────────────────────────────────────────────────
    if (filterDto.filter) {
      for (const [field, raw] of Object.entries(filterDto.filter)) {
        if (raw === undefined || raw === null) continue;

        if (Array.isArray(raw)) {
          const coerced = raw.map(coerceValue);

          // Prisma MongoDB does not support `in` for boolean fields.
          // Use direct equality for single value, OR conditions for multiple.
          if (coerced.every((v) => typeof v === 'boolean')) {
            if (coerced.length === 1) {
              andConditions.push({ [field]: coerced[0] });
            } else {
              // both true + false → effectively no filter, skip
              const unique = [...new Set(coerced)];
              if (unique.length === 1) {
                andConditions.push({ [field]: unique[0] });
              }
            }
          } else {
            andConditions.push({ [field]: { in: coerced } });
          }
        } else {
          andConditions.push({ [field]: coerceValue(raw) });
        }
      }
    }

    // ── Date ranges ──────────────────────────────────────────────────────────
    const dateCondition: Record<string, any> = {};

    if (filterDto.startDate) {
      for (const [field, value] of Object.entries(filterDto.startDate)) {
        if (value) {
          dateCondition[field] = {
            ...dateCondition[field],
            gte: new Date(value),
          };
        }
      }
    }

    if (filterDto.endDate) {
      for (const [field, value] of Object.entries(filterDto.endDate)) {
        if (value) {
          dateCondition[field] = {
            ...dateCondition[field],
            lte: new Date(value),
          };
        }
      }
    }

    if (Object.keys(dateCondition).length > 0) {
      andConditions.push(dateCondition);
    }

    return andConditions.length > 0 ? { AND: andConditions } : {};
  }

  /**
   * Builds a Prisma `orderBy` array from a FilterDto.
   * Falls back to `defaultSort` when no sort is provided.
   */
  static buildOrderBy(
    filterDto: FilterDto | undefined,
    defaultSort: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' },
  ): Record<string, 'asc' | 'desc'>[] {
    if (!filterDto?.sort) return [defaultSort];

    return Object.entries(filterDto.sort).map(([field, order]) => ({
      [field]:
        order === 'asc' || order === '1' ? ('asc' as const) : ('desc' as const),
    }));
  }

  /**
   * Executes a paginated Prisma query and returns `{ edges, pagination }`.
   *
   * @param findMany - Callback that calls `prisma.<model>.findMany(args)`.
   * @param count    - Callback that calls `prisma.<model>.count(args)`.
   * @param pagination - Page / pageSize params.
   * @param where    - Prisma where clause (from `buildWhere`).
   * @param orderBy  - Prisma orderBy array (from `buildOrderBy`).
   *
   * @example
   * return PrismaHelper.paginate(
   *   (args) => this.prisma.user.findMany(args),
   *   (args) => this.prisma.user.count(args),
   *   paginationDto,
   *   PrismaHelper.buildWhere(filterDto, ['firstName', 'lastName', 'email', 'rut']),
   *   PrismaHelper.buildOrderBy(filterDto),
   * );
   */
  static async paginate<T>(
    findMany: (args: {
      where: Record<string, any>;
      orderBy: Record<string, any>[];
      skip: number;
      take: number;
    }) => Promise<T[]>,
    count: (args: { where: Record<string, any> }) => Promise<number>,
    pagination: PaginationDto,
    where: Record<string, any> = {},
    orderBy: Record<string, 'asc' | 'desc'>[] = [{ createdAt: 'desc' }],
  ): Promise<IPaginatedResponse<T>> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [edges, total] = await Promise.all([
      findMany({ where, orderBy, skip, take: pageSize }),
      count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const meta: IPaginationMeta = {
      total,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      totalPages,
    };

    return { edges, pagination: meta };
  }
}
