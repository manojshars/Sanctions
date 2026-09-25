export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: Record<string, unknown>;
};

export const initialActionState: ActionState = {};
