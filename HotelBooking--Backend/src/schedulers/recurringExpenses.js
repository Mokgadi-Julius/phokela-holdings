const cron = require('node-cron');
const { Expenditure } = require('../models');
const { Op } = require('sequelize');

const calculateNextDueDate = (fromDate, frequency) => {
  const date = new Date(fromDate);
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
  }
  return date.toISOString().split('T')[0];
};

const processRecurringExpenses = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const templates = await Expenditure.findAll({
      where: {
        isRecurring: true,
        isPaused: false,
        nextDueDate: { [Op.lte]: today },
      },
    });

    if (templates.length === 0) return;

    let generated = 0;
    for (const template of templates) {
      let currentDue = template.nextDueDate;

      // Catch up on any missed periods
      while (currentDue <= today) {
        await Expenditure.create({
          title: template.title,
          category: template.category,
          amount: template.amount,
          date: currentDue,
          description: template.description,
          reference: template.reference,
          isRecurring: false,
          recurringFrequency: null,
          nextDueDate: null,
        });
        generated++;
        currentDue = calculateNextDueDate(currentDue, template.recurringFrequency);
      }

      await template.update({ nextDueDate: currentDue });
    }

    console.log(`⏰ Recurring expenses: generated ${generated} entr${generated === 1 ? 'y' : 'ies'} from ${templates.length} template${templates.length === 1 ? '' : 's'}`);
  } catch (err) {
    console.error('❌ Recurring expenses scheduler error:', err.message);
  }
};

const startRecurringExpensesScheduler = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', processRecurringExpenses);

  // Run on startup to catch any missed occurrences
  processRecurringExpenses();

  console.log('⏰ Recurring expenses scheduler started (runs daily at midnight)');
};

module.exports = { startRecurringExpensesScheduler, calculateNextDueDate, processRecurringExpenses };
