export const MODEL_NAMES: Record<string, string> = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
};

export const modelName = (id: string) => MODEL_NAMES[id] ?? id;
