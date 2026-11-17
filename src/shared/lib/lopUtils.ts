import { parseLeaveDate, getMonthKey } from './dateUtils';

/**
 * Loss of Pay (LOP) rules
 * -----------------------
 * - LOP only applies from LOP_START_DATE onwards (long-leave cases from 25 Oct).
 * - Unpaid leave is always LOP.
 * - Paid leave beyond the monthly paid-leave allowance is LOP.
 */
export const LOP_START_DATE = '2026-10-25';
export const MONTHLY_PAID_LEAVE_CAP = 2;

export interface LeaveLike {
  id: string;
  employee_id: string;
  type: string;
  days: number;
  status?: string;
  from?: string;
  to?: string;
  from_date?: string;
  to_date?: string;
}

const leaveStart = (leave: LeaveLike): string => String(leave.from ?? leave.from_date ?? '');

const isUnpaid = (leave: LeaveLike): boolean => /unpaid/i.test(leave.type);

const isLopEligible = (leave: LeaveLike): boolean => {
  const start = parseLeaveDate(leaveStart(leave));
  if (!start) return false;
  const effective = parseLeaveDate(LOP_START_DATE)!;
  return start.getTime() >= effective.getTime();
};

/**
 * LOP days contributed by a single leave request, given the employee's other
 * leaves (used to know how much of the monthly paid allowance is already used).
 */
export const computeLeaveLopDays = (
  allLeaves: LeaveLike[],
  employeeId: string,
  leave: LeaveLike
): number => {
  if ((leave.status ?? 'Pending') !== 'Approved') return 0;
  if (leave.employee_id !== employeeId) return 0;
  if (!isLopEligible(leave)) return 0;

  const days = Number(leave.days) || 0;
  if (isUnpaid(leave)) return days;

  // Paid leave: the portion beyond the monthly allowance becomes LOP.
  const month = getMonthKey(leaveStart(leave));
  const paidUsedBefore = allLeaves
    .filter((l) => l.employee_id === employeeId && l.id !== leave.id)
    .filter((l) => (l.status ?? 'Pending') === 'Approved')
    .filter((l) => !isUnpaid(l) && isLopEligible(l))
    .filter((l) => getMonthKey(leaveStart(l)) === month)
    .filter((l) => {
      const a = parseLeaveDate(leaveStart(l));
      const b = parseLeaveDate(leaveStart(leave));
      return a && b && a.getTime() < b.getTime();
    })
    .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

  const allowedForThisLeave = Math.max(0, MONTHLY_PAID_LEAVE_CAP - paidUsedBefore);
  return Math.max(0, days - allowedForThisLeave);
};

/** Total LOP days for an employee in a given "YYYY-MM" month. */
export const sumLopDaysForMonth = (
  allLeaves: LeaveLike[],
  employeeId: string,
  monthKey: string
): number => {
  return allLeaves
    .filter((l) => l.employee_id === employeeId)
    .filter((l) => getMonthKey(leaveStart(l)) === monthKey)
    .reduce((sum, l) => {
      const stored = (l as any).lop_days;
      if (stored !== undefined && stored !== null) return sum + (Number(stored) || 0);
      return sum + computeLeaveLopDays(allLeaves, employeeId, l);
    }, 0);
};
