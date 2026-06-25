import { parse, type BaseSchema, type InferInput, type InferOutput } from '@atcute/lexicons/validations';

export type RecordCreateInput<T> = Omit<T, '$type' | 'createdAt' | 'updatedAt'>;
export type RecordUpdateInput<T> = Omit<T, '$type' | 'updatedAt'>;
export type RecordBuildInput<T> = Omit<T, '$type'>;

function cleanStringFields(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      .filter(([, v]) => v !== undefined && v !== ''),
  );
}

export function makeRecordBuilder<TSchema extends BaseSchema>(schema: TSchema, $type: string) {
  type TInput = InferInput<TSchema>;
  type TOutput = InferOutput<TSchema>;

  return {
    /** Creates a new record with `$type` and a generated `createdAt` timestamp. */
    create(input: RecordCreateInput<TInput>): TOutput {
      return parse(schema, {
        ...cleanStringFields(input as Record<string, unknown>),
        $type,
        createdAt: new Date().toISOString(),
      });
    },

    /** Updates an existing record along with a new generated `updatedAt` timestamp. */
    update(input: RecordUpdateInput<TInput>): TOutput {
      return parse(schema, {
        ...cleanStringFields(input as Record<string, unknown>),
        $type,
        updatedAt: new Date().toISOString(),
      });
    },

    /** Builds a record with $type and without automatic timestamps (no `createdAt`/`updatedAt` handling). */
    build(input: RecordBuildInput<TInput>): TOutput {
      return parse(schema, {
        ...cleanStringFields(input as Record<string, unknown>),
        $type,
      });
    },
  };
}
