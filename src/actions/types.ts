export type WigActionState = {
  error: string | null;
  success: boolean;
};

export const initialWigState: WigActionState = { error: null, success: false };
