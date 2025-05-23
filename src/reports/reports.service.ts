import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReportsService {
  private states = {
    accounts: 'idle',
    yearly: 'idle',
    fs: 'idle',
  };

  constructor(private eventEmitter: EventEmitter2) {}

  state(scope: string) {
    return this.states[scope];
  }

  updateState(scope: string, status: string) {
    this.states[scope] = status;
  }

  async accounts() {
    this.eventEmitter.emit('reports.accounts.update', 'starting');
    const start = performance.now();
    console.log('Accounts started at:', start);
    const tmpDir = 'tmp';
    const outputFile = 'out/accounts.csv';
    const accountBalances: Record<string, number> = {};

    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const content = await fs.readFile(path.join(tmpDir, file), 'utf-8');
        const lines = content.trim().split('\n');
        for (const line of lines) {
          const [, account, , debit, credit] = line.split(',');
          if (!accountBalances[account]) {
            accountBalances[account] = 0;
          }
          accountBalances[account] +=
            parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
        }
      }
    }

    const output = ['Account,Balance'];
    for (const [account, balance] of Object.entries(accountBalances)) {
      output.push(`${account},${balance.toFixed(2)}`);
    }
    await fs.writeFile(outputFile, output.join('\n'));

    const duration = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
    console.log(
      'Accounts finished at:',
      performance.now(),
      'Duration:',
      duration,
    );
    this.eventEmitter.emit('reports.accounts.update', duration);
  }

  async yearly() {
    this.eventEmitter.emit('reports.yearly.update', 'starting');
    const start = performance.now();
    const tmpDir = 'tmp';
    const outputFile = 'out/yearly.csv';
    const cashByYear: Record<string, number> = {};

    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.endsWith('.csv') && file !== 'yearly.csv') {
        const content = await fs.readFile(path.join(tmpDir, file), 'utf-8');
        const lines = content.trim().split('\n');
        for (const line of lines) {
          const [date, account, , debit, credit] = line.split(',');
          if (account === 'Cash') {
            const year = new Date(date).getFullYear();
            if (!cashByYear[year]) {
              cashByYear[year] = 0;
            }
            cashByYear[year] +=
              parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
          }
        }
      }
    }

    const output = ['Financial Year,Cash Balance'];
    Object.keys(cashByYear)
      .sort()
      .forEach((year) => {
        output.push(`${year},${cashByYear[year].toFixed(2)}`);
      });
    await fs.writeFile(outputFile, output.join('\n'));

    const duration = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
    this.eventEmitter.emit('reports.yearly.update', duration);
  }

  async fs() {
    this.eventEmitter.emit('reports.fs.update', 'starting');
    const start = performance.now();
    const tmpDir = 'tmp';
    const outputFile = 'out/fs.csv';
    const categories = {
      'Income Statement': {
        Revenues: ['Sales Revenue'],
        Expenses: [
          'Cost of Goods Sold',
          'Salaries Expense',
          'Rent Expense',
          'Utilities Expense',
          'Interest Expense',
          'Tax Expense',
        ],
      },
      'Balance Sheet': {
        Assets: [
          'Cash',
          'Accounts Receivable',
          'Inventory',
          'Fixed Assets',
          'Prepaid Expenses',
        ],
        Liabilities: [
          'Accounts Payable',
          'Loan Payable',
          'Sales Tax Payable',
          'Accrued Liabilities',
          'Unearned Revenue',
          'Dividends Payable',
        ],
        Equity: ['Common Stock', 'Retained Earnings'],
      },
    };

    const balances: Record<string, number> = {};
    for (const section of Object.values(categories)) {
      for (const group of Object.values(section)) {
        for (const account of group) {
          balances[account] = 0;
        }
      }
    }

    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.endsWith('.csv') && file !== 'fs.csv') {
        const content = await fs.readFile(path.join(tmpDir, file), 'utf-8');
        const lines = content.trim().split('\n');
        for (const line of lines) {
          const [, account, , debit, credit] = line.split(',');
          if (balances.hasOwnProperty(account)) {
            balances[account] +=
              parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
          }
        }
      }
    }

    const output: string[] = [];
    output.push('Basic Financial Statement', '', 'Income Statement');
    let totalRevenue = 0,
      totalExpenses = 0;

    for (const account of categories['Income Statement']['Revenues']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalRevenue += value;
    }
    for (const account of categories['Income Statement']['Expenses']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalExpenses += value;
    }
    output.push(
      `Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`,
      '',
      'Balance Sheet',
    );

    let totalAssets = 0,
      totalLiabilities = 0,
      totalEquity = 0;
    output.push('Assets');
    for (const account of categories['Balance Sheet']['Assets']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalAssets += value;
    }
    output.push(`Total Assets,${totalAssets.toFixed(2)}`, '', 'Liabilities');

    for (const account of categories['Balance Sheet']['Liabilities']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalLiabilities += value;
    }
    output.push(
      `Total Liabilities,${totalLiabilities.toFixed(2)}`,
      '',
      'Equity',
    );

    for (const account of categories['Balance Sheet']['Equity']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalEquity += value;
    }
    output.push(
      `Retained Earnings (Net Income),${(totalRevenue - totalExpenses).toFixed(2)}`,
    );
    totalEquity += totalRevenue - totalExpenses;
    output.push(
      `Total Equity,${totalEquity.toFixed(2)}`,
      '',
      `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
    );

    await fs.writeFile(outputFile, output.join('\n'));

    const duration = `finished in ${((performance.now() - start) / 1000).toFixed(2)}`;
    this.eventEmitter.emit('reports.fs.update', duration);
  }
}
