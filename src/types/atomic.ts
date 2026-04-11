export interface AtomicArgument {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'path';
  default?: string;
  required: boolean;
}

export interface AtomicTest {
  test_index: number;
  name: string;
  description: string;
  platforms: string[];
  executor: string;
  arguments: AtomicArgument[];
}

export interface Atomic {
  technique_id: string;
  technique_name: string;
  tactic: string;
  tests: AtomicTest[];
}
