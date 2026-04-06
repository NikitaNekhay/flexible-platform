export interface Session {
  id: string;
  name: string;
  hostname: string;
  os: string;
  username: string;
  arch: string;
  pid: number;
  connected_at: string;
  last_seen: string;
}
