let staffToken: string | null = null;

export function setStaffToken(token: string | null) {
  staffToken = token;
}

export function getStaffToken(): string | null {
  return staffToken;
}
