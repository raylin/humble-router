// @flow

const STATUS = {
  // Don't change the order, later on the number
  // can be used to weight the matching accuracy.
  PAT_EMPTY: 1 << 0,
  PAT_TRAILING_WILDCARD: 1 << 1,
  PAT_WILDCARD: 1 << 2,
  PAT_REGEX: 1 << 3,
  PAT_STR: 1 << 4,

  SLUG_PATH: 1 << 6,
  SLUG_QS: 1 << 7,
};

type Options = {
  status: number,
  pattern: string,
};

type Match<T> = ?T;

class Trie<T> {
  static qsMatch(slug: string, pattern: string) {
    const [slugPairs, patternParis] = [slug, pattern].map(str =>
      str
        .replace(/^\?/, '')
        .split('&')
        .reduce((acc, pair) => {
          const [key, value] = pair.split('=');
          acc[key] = value;

          return acc;
        }, {})
    );

    return !Object.keys(patternParis).some(key => {
      if (
        !slugPairs[key] ||
        (patternParis[key] !== '*' && patternParis[key] !== slugPairs[key])
      ) {
        return true;
      }

      return false;
    });
  }

  static parse(slug: string): Options {
    let status = 0;
    let pattern = slug;

    if (slug === '?*') {
      status |= STATUS.PAT_TRAILING_WILDCARD;
    } else if (slug.indexOf('?') === 0) {
      status |= STATUS.SLUG_QS;
    } else if (slug === '') {
      status |= STATUS.SLUG_PATH | STATUS.PAT_EMPTY;
    } else if (/^[\w.-]+$/.test(slug)) {
      status |= STATUS.SLUG_PATH | STATUS.PAT_STR;
    } else if (/^\(.+\)$/.test(slug)) {
      pattern = slug.slice(1, -1);
      status |= STATUS.SLUG_PATH | STATUS.PAT_REGEX;
    } else if (slug === '*') {
      status |= STATUS.SLUG_PATH | STATUS.PAT_WILDCARD;
    }

    return {
      pattern,
      status,
    };
  }

  static slugify(route: string): Array<string> {
    const [pathname, qs] = route.split('?');

    return [
      ...pathname.replace(/^\//, '').split('/'),
      qs ? '?' + qs : qs,
    ].filter(slug => typeof slug === 'string');
  }

  static matchSlug(slug: string, node: Trie<T>): boolean {
    const { status } = node;

    switch (status) {
      case STATUS.SLUG_PATH | STATUS.PAT_EMPTY: {
        if (slug === '') {
          return true;
        }
        break;
      }
      case STATUS.SLUG_PATH | STATUS.PAT_STR: {
        if (slug === node.pattern) {
          return true;
        }
        break;
      }
      case STATUS.SLUG_PATH | STATUS.PAT_WILDCARD: {
        return true;
      }
      case STATUS.SLUG_PATH | STATUS.PAT_REGEX: {
        if (new RegExp(node.pattern).test(slug)) {
          return true;
        }
        break;
      }
      case STATUS.SLUG_QS: {
        if (Trie.qsMatch(slug, node.pattern)) {
          return true;
        }
        break;
      }
      case STATUS.PAT_TRAILING_WILDCARD: {
        if (slug.indexOf('?') === 0) {
          return true;
        }
        break;
      }
    }

    return false;
  }

  // weight: number;
  status: number;
  pattern: string;
  prefixes: number;
  path: ?string;
  edges: {
    [string]: Trie<T>,
  };

  constructor({ status, pattern, qs }: Options = {}) {
    this.status = status;
    this.pattern = pattern;
    this.prefixes = 0;
    this.edges = {};
  }

  // TODO: Should define weight at the same time, as for any multiple
  // matched to have the reference of best match. The weight gains by
  // the depth of path and the score of each pattern.
  define(route: string): Trie<T> {
    const def = this._define(Trie.slugify(route));
    def.path = route;

    return def;
  }

  match(path: string): ?Trie<T> {
    return this._match(Trie.slugify(path));
  }

  debug() {
    console.debug(JSON.stringify(this, null, 2));
  }

  _define(slugs: Array<string>): Trie<T> {
    if (slugs.length === 0) {
      return this;
    }

    const firstSlug = slugs.shift();

    if (!this.edges[firstSlug]) {
      const options = Trie.parse(firstSlug);

      this.prefixes += 1;
      this.edges[firstSlug] = new Trie(options);
    }

    return this.edges[firstSlug]._define(slugs);
  }

  _match(slugs: Array<string>, match: Match<Trie<T>> = null): Match<Trie<T>> {
    if (slugs.length === 0) {
      return null;
    }

    const slug = slugs.shift();
    const matchedNode = Object.keys(this.edges)
      .map(pat => this.edges[pat])
      .find(node => Trie.matchSlug(slug, node));

    if (!matchedNode) {
      return null;
    }

    match = matchedNode;

    if (slugs.length) {
      return matchedNode._match(slugs, match);
    }

    // If next matched node contains any trailing wildcard, then return matched.
    const trailingWildcardNode = Object.keys(matchedNode.edges)
      .map(k => matchedNode.edges[k])
      .find(n => n.status & STATUS.PAT_TRAILING_WILDCARD);

    if (trailingWildcardNode) {
      return trailingWildcardNode;
    }

    if (matchedNode.path) {
      return match;
    }

    return null;
  }
}

export default Trie;
