// Weave — a tiny toy programming language whose keywords map onto web-dev concepts:
// state (variable), hook (loop-persistent variable), component (function),
// mount (print/render), route/else (if/else), for each..in (loop), fetch(ms) (fake async delay).

type Token = { type: 'NUM' | 'STR' | 'TEMPLATE' | 'IDENT' | 'OP'; value: string };

type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'template'; raw: string }
  | { kind: 'array'; items: Expr[] }
  | { kind: 'ident'; name: string }
  | { kind: 'call'; name: string; args: Expr[] }
  | { kind: 'unary'; op: string; expr: Expr }
  | { kind: 'binary'; op: string; left: Expr; right: Expr };

type Stmt =
  | { kind: 'state' | 'hook'; name: string; expr: Expr }
  | { kind: 'component'; name: string; params: string[]; body: Stmt[] }
  | { kind: 'mount' | 'fetch' | 'return' | 'exprStmt'; expr: Expr }
  | { kind: 'route'; cond: Expr; thenBody: Stmt[]; elseBody?: Stmt[] }
  | { kind: 'forEach'; varName: string; listExpr: Expr; body: Stmt[] }
  | { kind: 'assign'; name: string; expr: Expr };
function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < n && /[0-9.]/.test(src[j])) j++;
      tokens.push({ type: 'NUM', value: src.slice(i, j) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ type: 'IDENT', value: src.slice(i, j) });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1, s = '';
      while (j < n && src[j] !== quote) { s += src[j]; j++; }
      tokens.push({ type: 'STR', value: s });
      i = j + 1; continue;
    }
    if (c === '`') {
      let j = i + 1, s = '', depth = 0;
      while (j < n) {
        if (depth === 0 && src[j] === '`') break;
        if (depth === 0 && src[j] === '$' && src[j + 1] === '{') { s += '${'; depth = 1; j += 2; continue; }
        if (depth > 0 && src[j] === '{') { depth++; s += '{'; j++; continue; }
        if (depth > 0 && src[j] === '}') { depth--; s += '}'; j++; continue; }
        s += src[j]; j++;
      }
      tokens.push({ type: 'TEMPLATE', value: s });
      i = j + 1; continue;
    }
    const two = src.slice(i, i + 2);
    if (['==', '!=', '>=', '<='].includes(two)) { tokens.push({ type: 'OP', value: two }); i += 2; continue; }
    if ('(){}[],=+-*/><'.includes(c)) { tokens.push({ type: 'OP', value: c }); i++; continue; }
    throw new Error(`Unexpected character "${c}"`);
  }
  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos: number;
  constructor(tokens: Token[], pos = 0) { this.tokens = tokens; this.pos = pos; }
  private peek(offset = 0) { return this.tokens[this.pos + offset]; }
  private next() { return this.tokens[this.pos++]; }
  private atEnd() { return this.pos >= this.tokens.length; }
  private expectOp(op: string) {
    const t = this.next();
    if (!t || t.value !== op) throw new Error(`Expected "${op}" but got "${t ? t.value : 'end of input'}"`);
    return t;
  }

  parseProgram(): Stmt[] {
    const stmts: Stmt[] = [];
    while (!this.atEnd()) stmts.push(this.parseStatement());
    return stmts;
  }

  private parseBlock(): Stmt[] {
    this.expectOp('{');
    const stmts: Stmt[] = [];
    while (!this.atEnd() && this.peek().value !== '}') stmts.push(this.parseStatement());
    this.expectOp('}');
    return stmts;
  }

  private parseStatement(): Stmt {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of input');
    if (t.type === 'IDENT') {
      switch (t.value) {
        case 'state':
        case 'hook': {
          this.next();
          const name = this.next().value;
          this.expectOp('=');
          const expr = this.parseExpression();
          return { kind: t.value as 'state' | 'hook', name, expr };
        }
        case 'component': {
          this.next();
          const name = this.next().value;
          this.expectOp('(');
          const params: string[] = [];
          while (this.peek().value !== ')') {
            params.push(this.next().value);
            if (this.peek().value === ',') this.next();
          }
          this.expectOp(')');
          const body = this.parseBlock();
          return { kind: 'component', name, params, body };
        }
        case 'mount':
        case 'fetch':
        case 'return': {
          this.next();
          if (t.value === 'return') return { kind: 'return', expr: this.parseExpression() };
          this.expectOp('(');
          const expr = this.parseExpression();
          this.expectOp(')');
          return { kind: t.value as 'mount' | 'fetch', expr };
        }
        case 'route': {
          this.next();
          this.expectOp('(');
          const cond = this.parseExpression();
          this.expectOp(')');
          const thenBody = this.parseBlock();
          let elseBody: Stmt[] | undefined;
          if (this.peek() && this.peek().value === 'else') { this.next(); elseBody = this.parseBlock(); }
          return { kind: 'route', cond, thenBody, elseBody };
        }
        case 'for': {
          this.next();
          if (this.peek().value !== 'each') throw new Error('Expected "each" after "for"');
          this.next();
          const varName = this.next().value;
          if (this.peek().value !== 'in') throw new Error('Expected "in" in for-each loop');
          this.next();
          const listExpr = this.parseExpression();
          const body = this.parseBlock();
          return { kind: 'forEach', varName, listExpr, body };
        }
        default: {
          if (this.peek(1) && this.peek(1).value === '=') {
            const name = this.next().value;
            this.next();
            const expr = this.parseExpression();
            return { kind: 'assign', name, expr };
          }
          return { kind: 'exprStmt', expr: this.parseExpression() };
        }
      }
    }
    throw new Error(`Unexpected token "${t.value}"`);
  }

  parseExpression(): Expr { return this.parseComparison(); }

  private parseComparison(): Expr {
    let left = this.parseAdditive();
    while (this.peek() && ['==', '!=', '>', '<', '>=', '<='].includes(this.peek().value)) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.peek() && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.peek() && this.peek().value === '-') { this.next(); return { kind: 'unary', op: '-', expr: this.parseUnary() }; }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const t = this.next();
    if (!t) throw new Error('Unexpected end of input');
    if (t.type === 'NUM') return { kind: 'num', value: parseFloat(t.value) };
    if (t.type === 'STR') return { kind: 'str', value: t.value };
    if (t.type === 'TEMPLATE') return { kind: 'template', raw: t.value };
    if (t.value === '(') { const e = this.parseExpression(); this.expectOp(')'); return e; }
    if (t.value === '[') {
      const items: Expr[] = [];
      while (this.peek() && this.peek().value !== ']') {
        items.push(this.parseExpression());
        if (this.peek() && this.peek().value === ',') this.next();
      }
      this.expectOp(']');
      return { kind: 'array', items };
    }
    if (t.type === 'IDENT') {
      if (this.peek() && this.peek().value === '(') {
        this.next();
        const args: Expr[] = [];
        while (this.peek() && this.peek().value !== ')') {
          args.push(this.parseExpression());
          if (this.peek() && this.peek().value === ',') this.next();
        }
        this.expectOp(')');
        return { kind: 'call', name: t.value, args };
      }
      return { kind: 'ident', name: t.value };
    }
    throw new Error(`Unexpected token "${t.value}"`);
  }
}

class ReturnSignal {
  value: unknown;
  constructor(value: unknown) { this.value = value; }
}

type Env = Map<string, unknown>;

class Interpreter {
  output: string[] = [];
  private components = new Map<string, { params: string[]; body: Stmt[] }>();
  private globalEnv: Env = new Map();

  run(statements: Stmt[]): string[] {
    for (const s of statements) if (s.kind === 'component') this.components.set(s.name, s);
    for (const s of statements) if (s.kind !== 'component') this.execStatement(s, this.globalEnv);
    return this.output;
  }

  private execBlock(statements: Stmt[], env: Env) {
    for (const s of statements) this.execStatement(s, env);
  }

  private execStatement(s: Stmt, env: Env) {
    switch (s.kind) {
      case 'state':
      case 'hook':
        env.set(s.name, this.evalExpr(s.expr, env));
        return;
      case 'assign':
        if (!env.has(s.name)) throw new Error(`Unknown variable "${s.name}"`);
        env.set(s.name, this.evalExpr(s.expr, env));
        return;
      case 'mount':
        this.output.push(this.stringify(this.evalExpr(s.expr, env)));
        return;
      case 'fetch': {
        const ms = this.evalExpr(s.expr, env);
        this.output.push(`[fetching for ${ms}ms...]`);
        return;
      }
      case 'route': {
        if (this.evalExpr(s.cond, env)) this.execBlock(s.thenBody, env);
        else if (s.elseBody) this.execBlock(s.elseBody, env);
        return;
      }
      case 'forEach': {
        const list = this.evalExpr(s.listExpr, env);
        if (!Array.isArray(list)) throw new Error(`for each: value is not a list`);
        for (const item of list) {
          env.set(s.varName, item);
          this.execBlock(s.body, env);
        }
        return;
      }
      case 'return':
        throw new ReturnSignal(this.evalExpr(s.expr, env));
      case 'exprStmt':
        this.evalExpr(s.expr, env);
        return;
      case 'component':
        return;
    }
  }

  private evalExpr(e: Expr, env: Env): any {
    switch (e.kind) {
      case 'num': return e.value;
      case 'str': return e.value;
      case 'template': return this.evalTemplate(e.raw, env);
      case 'array': return e.items.map(it => this.evalExpr(it, env));
      case 'ident':
        if (!env.has(e.name)) throw new Error(`Unknown variable "${e.name}"`);
        return env.get(e.name);
      case 'call': return this.callFunction(e.name, e.args.map(a => this.evalExpr(a, env)));
      case 'unary': {
        const v = this.evalExpr(e.expr, env);
        return e.op === '-' ? -v : !v;
      }
      case 'binary': {
        const l = this.evalExpr(e.left, env);
        const r = this.evalExpr(e.right, env);
        switch (e.op) {
          case '+': return (typeof l === 'string' || typeof r === 'string') ? String(l) + String(r) : l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': return l / r;
          case '==': return l === r;
          case '!=': return l !== r;
          case '>': return l > r;
          case '<': return l < r;
          case '>=': return l >= r;
          case '<=': return l <= r;
        }
      }
    }
  }

  private callFunction(name: string, args: unknown[]): unknown {
    const comp = this.components.get(name);
    if (!comp) throw new Error(`Unknown function "${name}"`);
    const localEnv: Env = new Map();
    comp.params.forEach((p, i) => localEnv.set(p, args[i]));
    try {
      this.execBlock(comp.body, localEnv);
    } catch (sig) {
      if (sig instanceof ReturnSignal) return sig.value;
      throw sig;
    }
    return undefined;
  }

  private evalTemplate(raw: string, env: Env): string {
    let result = '';
    let i = 0;
    while (i < raw.length) {
      if (raw[i] === '$' && raw[i + 1] === '{') {
        let depth = 1, j = i + 2;
        while (j < raw.length && depth > 0) {
          if (raw[j] === '{') depth++;
          else if (raw[j] === '}') depth--;
          if (depth > 0) j++;
        }
        const exprSrc = raw.slice(i + 2, j);
        const expr = new Parser(tokenize(exprSrc)).parseExpression();
        result += this.stringify(this.evalExpr(expr, env));
        i = j + 1;
      } else {
        result += raw[i]; i++;
      }
    }
    return result;
  }

  private stringify(v: unknown): string {
    if (Array.isArray(v)) return '[' + v.map(x => this.stringify(x)).join(', ') + ']';
    return String(v);
  }
}

export function runWeave(source: string): { output: string[]; error?: string } {
  try {
    const tokens = tokenize(source);
    const statements = new Parser(tokens).parseProgram();
    const output = new Interpreter().run(statements);
    return { output };
  } catch (err) {
    return { output: [], error: err instanceof Error ? err.message : String(err) };
  }
}
