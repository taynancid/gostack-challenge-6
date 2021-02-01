import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import uploadConfig from '../config/upload';

import CreateTransactionService from './CreateTransactionService';
import Transaction from '../models/Transaction';


interface Request {
  transactionsFileName: string,
}
class ImportTransactionsService {
  async LoadCSV(filePath: string): Promise<any[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: any = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }


  async execute({ transactionsFileName }: Request): Promise<Transaction[]> {
    const transactionsFilePath = path.join(uploadConfig.directory, transactionsFileName);

    const transactionsToSave = await this.LoadCSV(transactionsFilePath);

    const createTransactionService = new CreateTransactionService();

    const newTransactions: Transaction[] = [];

    for (const transactionToSave of transactionsToSave) {
      const transaction = await createTransactionService.execute({
        title: transactionToSave[0],
        type: transactionToSave[1],
        value: transactionToSave[2],
        categoryName: transactionToSave[3],
      });

      newTransactions.push(transaction);
    };

    await fs.promises.unlink(transactionsFilePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
