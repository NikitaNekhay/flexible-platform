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
  /** IP:port of the victim machine as reported by Sliver (e.g. "192.168.1.5:49821") */
  remote_address?: string;
}

export type ImplantPlatform = 'linux' | 'windows';

export interface ImplantParams {
  platform: ImplantPlatform;
  c2: string;
  name?: string;           // implant/beacon name shown in Sliver (hostname is typical)
  arch?: 'amd64' | 'arm64'; // linux only — amd64 default
  port?: number;           // linux only — Sliver HTTP listener port
}
