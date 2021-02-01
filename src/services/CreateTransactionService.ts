import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string,
  value: number,
  type: 'income' | 'outcome',
  categoryName: string,
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type == 'outcome' && value > balance.total) {
      throw new AppError(
        'insuficcient funds'
      );
    }

    let category = await categoriesRepository.findOne({
      where: { title: categoryName }
    });

    if (!category) {
      category = await categoriesRepository.create({
        title: categoryName,
      });

      await categoriesRepository.save(category);
    }

    const transaction = await transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
