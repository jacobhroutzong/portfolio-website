// Synthetic browser calculator. Money is held in integer cents; no property API calls.
const MAX_CENTS = 100_000_000_000;
export function cents(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Use a nonnegative amount with at most two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount > MAX_CENTS) throw new Error('Amount is outside the calculator range.');
  return amount;
}
function payment(principal, annualRate = .085) {
  const rate = annualRate / 12;
  return Math.round(principal * rate / (1 - (1 + rate) ** -360));
}
export function calculate(input) {
  const p = cents(input.purchase), rehab = cents(input.rehab), arv = cents(input.arv), rent = cents(input.rent);
  const tax = cents(input.tax), insurance = cents(input.insurance);
  const contingency = Math.round(rehab * .2), closing = Math.round(p * .03), carry = 4 * 55000;
  const allIn = p + rehab + contingency + closing + carry;
  const economicNoi = rent - Math.round(rent * .28) - tax - insurance - 6000;
  const unitPayment = .085 / 12 / (1 - (1 + .085 / 12) ** -360);
  const dscrCap = Math.max(0, Math.floor(economicNoi / 1.2 / unitPayment));
  const cashflowCap = Math.max(0, Math.floor((economicNoi - 25000) / unitPayment));
  const loan = Math.min(Math.floor(arv * .7), dscrCap, cashflowCap);
  const debt = payment(loan), cashflow = economicNoi - debt;
  const proceeds = loan - Math.round(loan * .03);
  return { allIn, closing, contingency, carry, loan, cashflow, debt,
    maximumOffer: Math.max(0, Math.floor((Math.floor(arv * .75) - rehab - contingency - carry) / 1.03)),
    ratio: arv ? allIn / arv : null, cashLeft: allIn - proceeds, flipNet: Math.round(arv * .91) - allIn,
    dscr: debt ? economicNoi / debt : null,
    downsideRatio: arv ? allIn / (arv * .8) : null,
    downsideCashflow: Math.floor(rent * .8) - Math.round(rent * .8 * .28) - tax - insurance - 6000 - debt,
    readiness: 'Needs verification',
  };
}
