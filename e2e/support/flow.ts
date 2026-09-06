export type FlowPhase = "given" | "when" | "then";

export interface FlowStep<S extends string = string> {
  readonly phase: FlowPhase;
  readonly statement: S;
}

export interface UserFlow<Steps extends readonly FlowStep[] = readonly FlowStep[]> {
  readonly id: string;
  readonly title: string;
  readonly steps: Steps;
}

export function given<S extends string>(statement: S): FlowStep<S> {
  return { phase: "given", statement };
}

export function when<S extends string>(statement: S): FlowStep<S> {
  return { phase: "when", statement };
}

export function then<S extends string>(statement: S): FlowStep<S> {
  return { phase: "then", statement };
}
