export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: Record<string, unknown>;
  /** Set when the action succeeded and the client should navigate (see redirectOrReturn). */
  redirectTo?: string;
};

export const initialActionState: ActionState = {};
