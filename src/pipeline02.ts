/* ============================================================================================
   DOT-PATH UTILITIES  (Your original exact version)
============================================================================================ */

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
  S extends `${infer A}${D}${infer B}` ? [A, ...Split<B, D>] : [S];

type ExtractNestedType<T, P extends string> =
  Split<P, '.'> extends [infer K, ...infer R]
    ? K extends keyof T
      ? R extends []
        ? T[K]
        : R extends [infer Next, ...any]
          ? ExtractNestedType<T[K], Extract<Next, string>>
          : never
      : never
    : never;

type ArrayElement<T> = T extends Array<infer U> ? U : never;


/* ============================================================================================
   EXPRESSIONS  (decoupled from T to avoid deep recursion)
============================================================================================ */

type ComparisonOp = '$eq' | '$ne' | '$gt' | '$lt' | '$gte' | '$lte';

type ComparisonExpr =
  | { $eq:  [string, any] }
  | { $ne:  [string, any] }
  | { $gt:  [string, any] }
  | { $lt:  [string, any] }
  | { $gte: [string, any] }
  | { $lte: [string, any] };

type LogicalExpr =
  | { $and: Expression[] }
  | { $or:  Expression[] }
  | { $not: Expression };

type Expression = ComparisonExpr | LogicalExpr;


/* ============================================================================================
   STAGE TYPES
============================================================================================ */

/** $addFields: expressions over current document (runtime only, Expression is not generic) */
type AddFieldsSpec<T> = Record<string, Expression>;

/**
 * $project string syntax:
 *
 *  - "field"
 *  - "path.to.field"
 *  - "path.to.field as alias"
 *  - "alias from $addedField"
 *
 * For typing:
 *  - We keep DotNestedKeys<T> so real paths are autocompleted & checked.
 *  - We also allow the template variants, which TS can handle with your DotNestedKeys.
 */
type ProjectFieldString<T> =
    | DotNestedKeys<T>
    | `${DotNestedKeys<T>} as ${string}`
    | `${string} from $${string}`;

type ProjectSpec<T> = ProjectFieldString<T>[];

/**
 * $map:
 *   {
 *     $map: {
 *       accounts: [ ... Pipeline<AccountElement> ... ],
 *       user:     [ ... Pipeline<User> ... ],
 *     }
 *   }
 */
type MapSpec<T> = {
  [K in keyof T]?: T[K] extends Array<any>
    ? Pipeline<ArrayElement<T[K]>>
    : Pipeline<T[K]>;
};

/**
 * $filter:
 *   - Applies to array fields only (at runtime).
 *   - Uses DotNestedKeys<T> for input path.
 */
type FilterSpec<T> = {
  input: DotNestedKeys<T>;
  cond: Expression;
};

/** $sort on array fields */
type SortDirection = 1 | -1;

type SortSpec<T> = {
  input: DotNestedKeys<T>;
  sortBy: Record<string, SortDirection>;  // element-level paths as strings
};

/** $group accumulators */
type GroupAcc = {
  $sum?: string;
  $min?: string;
  $max?: string;
  $count?: true;
};

type GroupSpec<T> = {
  input: DotNestedKeys<T>;               // array path
  by: string;                            // element path
  accumulators: Record<string, GroupAcc>;
};

/** Stage over document type T */
type Stage<T> =
    | { $addFields: AddFieldsSpec<T> }
    | { $project: ProjectSpec<T> }
    | { $map: MapSpec<T> }
    | { $filter: FilterSpec<T> }
    | { $sort: SortSpec<T> }
    | { $group: GroupSpec<T> };

type Pipeline<T> = Stage<T>[];


/* ============================================================================================
   RUNTIME HELPERS
============================================================================================ */

function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) =>
    acc == null ? undefined : acc[key],
    obj
  );
}

function setValueByPath(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let target = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (target[k] == null || typeof target[k] !== 'object') {
      target[k] = {};
    }
    target = target[k];
  }
  target[parts[parts.length - 1]] = value;
}

const comparisonFns: Record<ComparisonOp, (a: any, b: any) => boolean> = {
  $eq:  (a, b) => a === b,
  $ne:  (a, b) => a !== b,
  $gt:  (a, b) => a > b,
  $lt:  (a, b) => a < b,
  $gte: (a, b) => a >= b,
  $lte: (a, b) => a <= b,
};

function isComparison(expr: any): expr is ComparisonExpr {
  return typeof expr === 'object' && expr !== null &&
    ['$eq', '$ne', '$gt', '$lt', '$gte', '$lte'].some(op => op in expr);
}

function isLogical(expr: any): expr is LogicalExpr {
  return typeof expr === 'object' && expr !== null &&
    ('$and' in expr || '$or' in expr || '$not' in expr);
}

function evalExpression(doc: any, expr: Expression): boolean {
  if (isLogical(expr)) {
    if ('$and' in expr) return expr.$and.every(e => evalExpression(doc, e));
    if ('$or'  in expr) return expr.$or.some(e => evalExpression(doc, e));
    if ('$not' in expr) return !evalExpression(doc, expr.$not);
  }

  if (isComparison(expr)) {
    const op = Object.keys(expr)[0] as ComparisonOp;
    const [path, value] = (expr as any)[op] as [string, any];
    const left = getValueByPath(doc, path);
    return comparisonFns[op](left, value);
  }

  throw new Error(`Unsupported expression: ${JSON.stringify(expr)}`);
}

/**
 * $project field parser:
 *
 *   "a.b"                      → src = "a.b",        dst = "a.b"
 *   "a.b as totalAmount"       → src = "a.b",        dst = "totalAmount"
 *   "isPositive from $isPositive" → dst = "isPositive", read doc["isPositive"]
 */
function parseProjectField<T>(doc: T, field: ProjectFieldString<T>): [string, any] {
  if (!field.includes(" as ") && !field.includes(" from $")) {
    return [field, getValueByPath(doc, field)];
  }

  if (field.includes(" as ")) {
    const [src, dst] = field.split(" as ");
    return [dst, getValueByPath(doc, src)];
  }

  if (field.includes(" from $")) {
    const [dst, src] = field.split(" from $");
    // here `src` is e.g. "isPositive" (because we split by " from $")
    return [dst, (doc as any)[src]];
  }

  throw new Error(`Invalid $project field: ${field}`);
}


/* ============================================================================================
   CORE PIPELINE EXECUTION
   NOTE: runtime uses `any[]` for pipelines to avoid generic assignability issues.
============================================================================================ */

function runPipeline(doc: any, pipeline: any[]): any {
  let current: any = doc;

  for (const stage of pipeline) {

    /* ----- $addFields ----- */
    if ('$addFields' in stage) {
      const spec = stage.$addFields as AddFieldsSpec<any>;
      for (const key of Object.keys(spec)) {
        current[key] = evalExpression(current, spec[key]);
      }
    }

    /* ----- $project ----- */
    else if ('$project' in stage) {
      const out: any = {};
      const spec = stage.$project as ProjectSpec<any>;
      for (const field of spec) {
        const [dst, value] = parseProjectField(current, field);
        out[dst] = value;
      }
      current = out;
    }

    /* ----- $map ----- */
    else if ('$map' in stage) {
      const spec = stage.$map as MapSpec<any>;
      const out: any = {};

      for (const key of Object.keys(spec)) {
        const sub = (spec as any)[key] as any[];       // runtime pipeline
        const value = current[key];

        if (Array.isArray(value)) {
          out[key] = value.map(v => runPipeline(v, sub));
        } else if (value && typeof value === 'object') {
          out[key] = runPipeline(value, sub);
        } else {
          out[key] = value;
        }
      }

      current = { ...current, ...out };
    }

    /* ----- $filter (arrays only) ----- */
    else if ('$filter' in stage) {
      const spec = stage.$filter as FilterSpec<any>;
      const arr = getValueByPath(current, spec.input);

      if (!Array.isArray(arr)) {
        continue;
      }

      // optional: runtime homogeneous check
      if (arr.length > 1) {
        const t0 = typeof arr[0];
        if (!arr.every(x => typeof x === t0)) {
          throw new Error(`$filter requires homogeneous array at path "${spec.input}".`);
        }
      }

      const filtered = arr.filter((x: any) => evalExpression(x, spec.cond));
      setValueByPath(current, spec.input as string, filtered);
    }

    /* ----- $sort (arrays only) ----- */
    else if ('$sort' in stage) {
      const spec = stage.$sort as SortSpec<any>;
      const arr = getValueByPath(current, spec.input);

      if (!Array.isArray(arr)) continue;

      const entries = Object.entries(spec.sortBy);
      if (!entries.length) continue;

      const [field, dirRaw] = entries[0];
      const dir = dirRaw as SortDirection;

      const sorted = [...arr].sort((a, b) => {
        const av = getValueByPath(a, field);
        const bv = getValueByPath(b, field);
        if (av < bv) return -1 * dir;
        if (av > bv) return  1 * dir;
        return 0;
      });

      setValueByPath(current, spec.input as string, sorted);
    }

    /* ----- $group (arrays only) ----- */
    else if ('$group' in stage) {
      const spec = stage.$group as GroupSpec<any>;
      const arr = getValueByPath(current, spec.input);

      if (!Array.isArray(arr)) continue;

      const groups: Record<string, any[]> = {};

      for (const item of arr) {
        const key = getValueByPath(item, spec.by);
        const gKey = String(key);
        if (!groups[gKey]) groups[gKey] = [];
        groups[gKey].push(item);
      }

      const result: any[] = [];

      for (const [gKey, items] of Object.entries(groups)) {
        const out: any = { [spec.by]: gKey };

        for (const accKey of Object.keys(spec.accumulators)) {
          const acc = spec.accumulators[accKey];

          if (acc.$count) {
            out[accKey] = items.length;
          } else if (acc.$sum) {
            out[accKey] = items.reduce(
              (a, i) => a + getValueByPath(i, acc.$sum as string),
              0
            );
          } else if (acc.$min) {
            out[accKey] = Math.min(
              ...items.map(i => getValueByPath(i, acc.$min as string))
            );
          } else if (acc.$max) {
            out[accKey] = Math.max(
              ...items.map(i => getValueByPath(i, acc.$max as string))
            );
          }
        }

        result.push(out);
      }

      setValueByPath(current, spec.input as string, result);
    }

    else {
      throw new Error(`Unknown stage: ${JSON.stringify(stage)}`);
    }
  }

  return current;
}


/* ============================================================================================
   PUBLIC API
============================================================================================ */

export function evaluatePipeline<T>(response: T, pipeline: Pipeline<T>): any {
  // At runtime we treat the pipeline as `any[]` to avoid generic assignment issues.
  return runPipeline(response, pipeline as any[]);
}


/* ============================================================================================
   EXAMPLE USAGE
============================================================================================ */

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
    $filter: {
      input: 'accounts',
      cond: { $gte: ['balance.amount', 1000] }
    }
  },
  {
    $map: {
      accounts: [
        {
          $addFields: {
            // DotNestedKeys<Account> → autocomplete & validation
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
    },
  ],
  user: {
    name: "John Doe",
    age: 30
  }
};

const result = evaluatePipeline(response, pipeline);
console.log('RESULT:', JSON.stringify(result, null, 2));
/*
Expected shape:

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
