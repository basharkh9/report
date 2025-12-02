/* ============================================================
   Dot-path helpers (deep, but used in a controlled way)
============================================================ */

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

type DotNestedKeys<T> =
  T extends (Date | Array<any>) ? '' :
  (T extends object
    ? {
        [K in Exclude<keyof T, symbol>]:
          `${K}${DotPrefix<DotNestedKeys<T[K]>>}`
      }[Exclude<keyof T, symbol>]
    : '') extends infer D
      ? Extract<D, string>
      : never;

type Split<S extends string, D extends string> =
  S extends `${infer T}${D}${infer Rest}` ? [T, ...Split<Rest, D>] : [S];

type ExtractNestedType<T, P extends DotNestedKeys<T>> =
  Split<P, '.'> extends [infer K, ...infer R]
    ? K extends keyof T
      ? R extends []
        ? T[K]
        : R extends [infer Next, ...any]
          ? Next extends DotNestedKeys<T[K]>
            ? ExtractNestedType<T[K], Next>
            : never
          : never
      : never
    : never;

type ArrayElement<T> = T extends Array<infer U> ? U : never;

/* ============================================================
   Expression typing (lightweight – avoids deep instantiation)
============================================================ */

type ComparisonOp = '$eq' | '$ne' | '$gt' | '$lt' | '$gte' | '$lte';

/**
 * We constrain:
 *   - left operand to DotNestedKeys<T>
 *   - right operand to `any`
 *
 * This gives:
 *   - strong path checking
 *   - autocomplete on paths
 *   - avoids TS2589 recursion
 */
type EqExpr<T>  = { $eq:  [DotNestedKeys<T>, any] };
type NeExpr<T>  = { $ne:  [DotNestedKeys<T>, any] };
type GtExpr<T>  = { $gt:  [DotNestedKeys<T>, any] };
type LtExpr<T>  = { $lt:  [DotNestedKeys<T>, any] };
type GteExpr<T> = { $gte: [DotNestedKeys<T>, any] };
type LteExpr<T> = { $lte: [DotNestedKeys<T>, any] };

type ComparisonExpression<T> =
  | EqExpr<T>
  | NeExpr<T>
  | GtExpr<T>
  | LtExpr<T>
  | GteExpr<T>
  | LteExpr<T>;

type LogicalExpression<T> =
  | { $and: Expression<T>[] }
  | { $or: Expression<T>[] }
  | { $not: Expression<T> };

type Expression<T> = ComparisonExpression<T> | LogicalExpression<T>;

/* ============================================================
   Stage types
============================================================ */

/** $addFields: expressions over current document type T */
type AddFieldsSpec<T> = Record<string, Expression<T>>;

/**
 * Project field strings:
 *
 *  - "balance.amount"
 *  - "balance.amount as totalAmount"
 *  - "isPositive from $isPositive"
 *
 * NOTE:
 *  - We syntactically validate `$` form.
 *  - We cannot (without builders) prove that `$isPositive` came
 *    from a previous $addFields, because Pipeline<T> is not
 *    stage-sequence-aware at the type level.
 */
type ProjectFieldString<T> =
  | DotNestedKeys<T>
  | `${DotNestedKeys<T>} as ${string}`
  | `${string} from $${string}`;

/** $project now is: array of ProjectFieldString<T> */
type ProjectSpec<T> = ProjectFieldString<T>[];

/**
 * NEW $map shape:
 *
 * {
 *   $map: {
 *     accounts: [ ... Pipeline<AccountElement> ... ],
 *     user:     [ ... Pipeline<User> ... ],
 *   }
 * }
 *
 * For key K:
 *  - if T[K] is array  → pipeline doc type is ArrayElement<T[K]>
 *  - else             → pipeline doc type is T[K]
 *
 * We restrict keys to `keyof T` (top-level) to avoid recursion blow-up.
 */
type MapSpec<T> = {
  [K in keyof T]?: T[K] extends Array<any>
    ? Pipeline<ArrayElement<T[K]>>
    : Pipeline<T[K]>;
};

/** Single stage over document type T */
type Stage<T> =
  | { $addFields: AddFieldsSpec<T> }
  | { $project: ProjectSpec<T> }
  | { $map: MapSpec<T> };

/** Pipeline over document type T */
type Pipeline<T> = Stage<T>[];

/* ============================================================
   Runtime implementation
============================================================ */

function getValueByPath(obj: any, path: string | undefined): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

const comparisonFns: Record<ComparisonOp, (a: any, b: any) => boolean> = {
  $eq:  (a, b) => a === b,
  $ne:  (a, b) => a !== b,
  $gt:  (a, b) => a > b,
  $lt:  (a, b) => a < b,
  $gte: (a, b) => a >= b,
  $lte: (a, b) => a <= b,
};

function isLogicalExpression<T>(expr: Expression<T>): expr is LogicalExpression<T> {
  return typeof expr === 'object' && expr !== null &&
    ('$and' in expr || '$or' in expr || '$not' in expr);
}

function isComparisonExpression<T>(expr: Expression<T>): expr is ComparisonExpression<T> {
  if (!expr || typeof expr !== 'object') return false;
  return ('$eq' in expr || '$ne' in expr || '$gt' in expr || '$lt' in expr || '$gte' in expr || '$lte' in expr);
}

function evalExpression<T>(doc: T, expr: Expression<T>): boolean {
  if (isLogicalExpression(expr)) {
    if ('$and' in expr) return expr.$and.every((e: Expression<T>) => evalExpression(doc, e));
    if ('$or'  in expr) return expr.$or.some((e: Expression<T>) => evalExpression(doc, e));
    if ('$not' in expr) return !evalExpression(doc, expr.$not);
  }

  if (isComparisonExpression(expr)) {
    const op = Object.keys(expr)[0] as ComparisonOp;
    const [path, value] = (expr as any)[op] as [string, any];
    const left = getValueByPath(doc as any, path);
    return comparisonFns[op](left, value);
  }

  throw new Error(`Unsupported expression: ${JSON.stringify(expr)}`);
}

/* ---------------- $project parser ---------------- */

function parseProjectField(field: string): { src: string; dest: string } {
  if (field.includes(" as ")) {
    const [src, dest] = field.split(" as ").map(s => s.trim());
    return { src, dest };
  }

  if (field.includes(" from $")) {
    const [dest, srcRaw] = field.split(" from $").map(s => s.trim());
    // "isPositive from $isPositive" => src = "isPositive", dest = "isPositive"
    return { src: srcRaw.replace(/^\$/, ""), dest };
  }

  return { src: field.trim(), dest: field.trim() };
}

/* ============================================================
   Pipeline executor
============================================================ */

function runPipeline<T>(doc: T, pipeline: Pipeline<T>): any {
  let current: any = doc;

  for (const stage of pipeline) {
    if ('$addFields' in stage) {
      const spec = stage.$addFields as AddFieldsSpec<any>;
      for (const key of Object.keys(spec)) {
        const expr = spec[key] as Expression<any>;
        current[key] = evalExpression(current, expr);
      }
    } else if ('$project' in stage) {
      const spec = stage.$project as ProjectSpec<any>;
      const out: any = {};

      for (const entry of spec) {
        const { src, dest } = parseProjectField(entry as string);
        out[dest] = getValueByPath(current, src);
      }

      current = out;
    } else if ('$map' in stage) {
      const spec = stage.$map as MapSpec<any>;
      const out: any = {};

      for (const key of Object.keys(spec) as (Extract<keyof T, string>)[]) {
        const subPipeline = spec[key] as Pipeline<any>;

        const value = (current as any)[key];

        if (Array.isArray(value)) {
          out[key] = value.map((item: any) =>
            runPipeline(item, subPipeline as Pipeline<any>)
          );
        } else if (value && typeof value === 'object') {
          out[key] = runPipeline(value, subPipeline as Pipeline<any>);
        } else {
          // Not an object / array — just copy as-is
          out[key] = value;
        }
      }

      // merge mapped fields into current (or replace; your choice)
      current = { ...current, ...out };
    } else {
      throw new Error(`Unsupported stage: ${JSON.stringify(stage)}`);
    }
  }

  return current;
}

export function evaluatePipeline<T>(response: T, pipeline: Pipeline<T>): any {
  return runPipeline(response, pipeline);
}

/* ============================================================
   Example usage (with your desired shape)
============================================================ */

type TResponse = {
  accounts: Array<{
    id: number;
    name: string;
    status?: string;
    balance: {
      amount: number;
      currency: string;
    };
  }>;
  user: {
    name: string;
    age: number;
  };
};

const pipeline: Pipeline<TResponse> = [
  {
    $map: {
      accounts: [
        {
          $addFields: {
            // 'balance.amount' checked via DotNestedKeys<Account>
            isPositive: { $gt: ['balance.amount', 0] },
            isValidAccount: {
              $and: [
                { $ne: ['status', 'closed'] },
                { $ne: ['status', 'suspended'] }
              ]
            }
          }
        },
        {
          $project: [
            'id',
            'name as accountName',
            'balance.amount as totalAmount',
            'balance.currency as currencyType',
            'status',
            'isPositive from $isPositive',
            'isValidAccount from $isValidAccount'
          ]
        }
      ],
      user: [
        {
          $project: [
            'age as userAge'
          ]
        }
      ]
    }
  }
];

const response: TResponse = {
  accounts: [
    {
      id: 1,
      name: "Savings Account",
      status: "active",
      balance: { amount: 1500, currency: "USD" }
    },
    {
      id: 2,
      name: "Checking Account",
      status: "suspended",
      balance: { amount: -100, currency: "AED" }
    }
  ],
  user: {
    name: "John Doe",
    age: 30
  }
};

const result = evaluatePipeline(response, pipeline);
console.log('RESULT:', JSON.stringify(result, null, 2));
/*
RESULT (shape):
{
  "accounts": [
    {
      "id": 1,
      "accountName": "Savings Account",
      "totalAmount": 1500,
      "currencyType": "USD",
      "status": "active",
      "isPositive": true,
      "isValidAccount": true
    },
    {
      "id": 2,
      "accountName": "Checking Account",
      "totalAmount": -100,
      "currencyType": "AED",
      "status": "suspended",
      "isPositive": false,
      "isValidAccount": false
    }
  ],
  "user": {
    "userAge": 30
  }
}
*/
