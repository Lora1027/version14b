
INKHALE BUSINESS PLATFORM — VERSION 14b (SIMPLE + SALES GROWTH)

- Simple: every record is INCOME (sales) or EXPENSE.
- Net Profit = Income - Expense.
- Growth on /comparison is based on SALES only:
  (Last month Sales - First month Sales) / First month Sales.

Pages:
- /login        : sign up / sign in (Supabase auth).
- /             : dashboard + quick add transaction.
- /transactions : list + filters + delete + CSV + print.
- /comparison   : average sales, average net, growth, monthly breakdown.
- /balances     : capital & wallets (cash, gcash, bank), editable + CSV + print.

Setup:
1) In Supabase SQL Editor, paste supabase/schema.sql and RUN (safe to run more than once).
2) Create .env.local from .env.local.example with your Supabase URL + anon key.
3) Deploy to Vercel with same env vars in project settings.

