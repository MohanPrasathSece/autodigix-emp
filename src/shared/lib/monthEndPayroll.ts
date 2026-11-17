import { supabase } from './supabaseClient';
import { generatePayslipPDFBase64 } from './pdfGenerator';
import { serverLog } from './logger';

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
  pdfBase64?: string,
  filename?: string
) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        text,
        html: html || `<p>${text.replace(/\n/g, '<br/>')}</p>`,
        pdfBase64,
        filename,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to dispatch payslip email:', error);
    return false;
  }
};

/**
 * Automatically checks if month end has arrived (day >= 28 or days 1-5 of following month)
 * and whether payroll for that period was already processed. If not, generates payslips,
 * inserts them into Supabase, and emails each employee their PDF statement.
 */
export async function checkAndProcessMonthEndPayroll(): Promise<{
  processed: boolean;
  period?: string;
  count?: number;
  reason?: string;
}> {
  const now = new Date();
  const day = now.getDate();

  // Month end is considered day 28 or later, or day 1 to 5 of next month for the previous month
  let targetDate: Date | null = null;
  if (day >= 28) {
    targetDate = now;
  } else if (day <= 5) {
    targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  if (!targetDate) {
    return { processed: false, reason: `Day ${day} is not month-end.` };
  }

  const period = targetDate.toLocaleString('default', { month: 'short', year: 'numeric' });

  try {
    // 1. Check if payroll for this period already exists
    const { data: existing, error: checkErr } = await supabase
      .from('payslips')
      .select('id')
      .eq('period', period)
      .limit(1);

    if (checkErr) {
      console.warn('Error checking existing payslips:', checkErr);
      return { processed: false, reason: checkErr.message };
    }

    if (existing && existing.length > 0) {
      return { processed: false, period, reason: `Payroll for ${period} already processed.` };
    }

    // 2. Fetch active employees
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('id, name, email, department, role, status, base_salary, monthly_allowance, monthly_benefits_deduction, payslip_email, tax_percentage')
      .neq('status', 'Terminated');

    if (empErr || !employees || employees.length === 0) {
      return { processed: false, period, reason: empErr?.message || 'No active employees found.' };
    }

    // 3. Fetch absent dates for unpaid leaves
    const { data: absentDates } = await supabase
      .from('absent_dates')
      .select('employee_id, subject');

    // 4. Calculate payslips
    const payslipsToInsert = employees.map((emp: any) => {
      const salary = emp.base_salary || 60000;
      const base_amount = Math.round(salary / 12);
      const allowances_amount = emp.monthly_allowance || 0;

      let unpaid_leave_amount = 0;
      const unpaidDays = (absentDates || [])
        .filter((a: any) => a.employee_id === emp.id && String(a.subject || '').toLowerCase().includes('unpaid'))
        .reduce((acc: number, a: any) => acc + (String(a.subject).toLowerCase().includes('half day') ? 0.5 : 1), 0);

      if (unpaidDays > 0) {
        const dailyRate = base_amount / 22;
        unpaid_leave_amount = Math.round(unpaidDays * dailyRate);
      }

      const gross = base_amount + allowances_amount - unpaid_leave_amount;
      const benefits_amount = emp.monthly_benefits_deduction || 0;
      const taxRate = (emp.tax_percentage !== null && emp.tax_percentage !== undefined && !isNaN(emp.tax_percentage))
        ? Number(emp.tax_percentage) / 100
        : 0.10;
      const tax_amount = Math.round(gross * taxRate);
      const net = gross - tax_amount - benefits_amount;

      return {
        employee_id: emp.id,
        period,
        gross,
        net,
        base_amount,
        allowances_amount,
        unpaid_leave_amount,
        tax_amount,
        benefits_amount,
        status: 'Paid',
      };
    });

    // 5. Insert payslips into Supabase
    const { error: insertErr } = await supabase
      .from('payslips')
      .insert(payslipsToInsert);

    if (insertErr) {
      console.error('Failed to insert auto-payslips:', insertErr);
      return { processed: false, period, reason: insertErr.message };
    }

    // 6. Generate PDFs and dispatch email to each employee
    let emailsSent = 0;
    for (const emp of employees) {
      const p = payslipsToInsert.find((ps) => ps.employee_id === emp.id);
      const targetEmail = emp.payslip_email || emp.email;

      if (p && targetEmail) {
        try {
          const pdfBase64 = generatePayslipPDFBase64({
            employeeName: emp.name,
            employeeId: emp.id,
            email: targetEmail,
            department: emp.department || 'General',
            role: emp.role || 'Staff',
            period,
            base_amount: p.base_amount,
            allowances_amount: p.allowances_amount,
            unpaid_leave_amount: p.unpaid_leave_amount,
            gross: p.gross,
            tax_amount: p.tax_amount,
            benefits_amount: p.benefits_amount,
            net: p.net,
          });

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Autodigix HR</h1>
                <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Official Payslip Statement for ${period}</p>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Hi ${emp.name},</p>
                <p>Your monthly salary for <strong>${period}</strong> has been successfully processed.</p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Gross Salary:</td>
                      <td style="padding: 6px 0; font-weight: bold; text-align: right;">₹ ${p.gross.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Total Deductions:</td>
                      <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ef4444;">- ₹ ${(p.gross - p.net).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                      <td style="padding: 10px 0 0 0; font-weight: bold; color: #0f172a; font-size: 16px;">Net Take-Home Pay:</td>
                      <td style="padding: 10px 0 0 0; font-weight: bold; text-align: right; color: #16a34a; font-size: 18px;">₹ ${p.net.toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                </div>
                <p style="font-size: 14px;">📄 <strong>Your detailed payslip is attached to this email as a PDF document.</strong> You can also view and download it anytime from your employee portal profile.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">This is an automated system email from Autodigix HR.</p>
              </div>
            </div>
          `;

          await sendEmail(
            targetEmail,
            `Payslip Statement - ${period}`,
            `Hi ${emp.name},\n\nYour payroll for ${period} has been processed.\nGross: ₹${p.gross}\nNet: ₹${p.net}\n\nPlease find your attached PDF payslip.`,
            emailHtml,
            pdfBase64,
            `Payslip_${period.replace(/\s+/g, '_')}_${emp.name.replace(/\s+/g, '_')}.pdf`
          );
          emailsSent++;
        } catch (pdfErr) {
          console.error(`Failed to generate/send PDF payslip for ${emp.name}:`, pdfErr);
        }
      }
    }

    serverLog('Month-End Payroll Automated Run', { period, employeesProcessed: employees.length, emailsSent }, 'success');

    return { processed: true, period, count: employees.length };
  } catch (err: any) {
    console.error('Error in month-end payroll auto-runner:', err);
    return { processed: false, reason: err.message };
  }
}
