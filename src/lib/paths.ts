export function attemptPath(kind: string, id: string, results = false): string {
  const base = ["MOCK_EXAM", "READINESS", "FINAL"].includes(kind) ? `/mock-exams/exam/${id}` : `/question-bank/session/${id}`;
  return results ? `${base}/results` : base;
}
