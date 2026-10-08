/** A mailto link to the project email with the subject filled in, e.g. "Correction: Main hall, ...". */
export function mailto(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
