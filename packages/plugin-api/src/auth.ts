export interface AuthUserInfo {
  nickname: string;
  avatar?: string;
  signature?: string;
  [extra: string]: any;
}

export type SourceAuth<M extends keyof AuthMethodMap> = AuthBase & UnionToIntersection<AuthMethodMap[M]> & {
  methods: {
    type: M;
    label?: string;
  }[]
}

/** 由于 TypeScript 的限制，需要使用此函数来正确推断类型，否则也可以手动指定 SourceAuth 的 M 泛型 */
export function defineAuth<const M extends readonly {type: keyof AuthMethodMap, label?: string}[]>(
  config: AuthBase & {methods: M} & UnionToIntersection<AuthMethodMap[M[number]['type']]>
): SourceAuthAny {return config}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export interface AuthBase {
  getUserInfo: () => Promise<AuthUserInfo | null>;
  logout: () => Promise<void>;
}

export interface AuthMethodMap {
  'qrcode': {
    getQRCode: () => Promise<{url: string; key: string}>;
    checkQRStatus: (key: string) => Promise<{status: 'waiting' | 'scanned' | 'confirmed' | 'expired'; cookie?: string | string[]}>;
  };
  'cookie': {
    loginWithCookie: (cookie: string) => Promise<boolean>;
  };
}

export type SourceAuthAny = AuthBase & Partial<UnionToIntersection<AuthMethodMap[keyof AuthMethodMap]>> & {
  methods: readonly {type: keyof AuthMethodMap; label?: string}[];
}