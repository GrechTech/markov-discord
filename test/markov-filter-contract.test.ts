import assert from 'node:assert/strict';
import { test } from 'node:test';
import Markov from 'markov-strings-db';
import { DataSource } from 'typeorm';

test('markov-strings-db retries filtered results up to maxTries', async () => {
  const dataSourceOptions = Markov.extendDataSourceOptions({
    type: 'better-sqlite3',
    database: ':memory:',
    synchronize: true,
    migrationsRun: false,
  });
  const dataSource = new DataSource(dataSourceOptions);
  const markov = new Markov({ id: 'filter-contract-test', options: { stateSize: 2 } });
  let filterCalls = 0;

  await dataSource.initialize();
  try {
    await markov.setup(dataSource);
    await markov.addData([
      'alpha beta gamma delta epsilon zeta',
      'delta epsilon zeta eta theta iota',
    ]);

    await assert.rejects(
      markov.generate({
        maxTries: 3,
        filter: () => {
          filterCalls += 1;
          return false;
        },
      }),
      /Failed to build a sentence after 3 tries/,
    );
    assert.equal(filterCalls, 3);
  } finally {
    await dataSource.destroy();
  }
});
