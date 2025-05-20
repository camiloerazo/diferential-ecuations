declare module 'wolfram-alpha-api' {
  interface Pod {
    title: string;
    subpods: Array<{
      plaintext?: string;
      img?: {
        src: string;
      };
    }>;
  }

  interface QueryResult {
    pods: Pod[];
    success: boolean;
    error?: {
      msg: string;
    };
  }

  interface QueryOptions {
    input: string;
    output?: 'json' | 'xml' | 'html';
    format?: 'plaintext' | 'image';
  }

  interface WolframClient {
    getFull(options: QueryOptions): Promise<QueryResult>;
  }

  export function createClient(appId: string): WolframClient;
} 