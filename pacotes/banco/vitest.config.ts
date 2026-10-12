import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false // Evita condições de corrida em testes de integração com o banco real
  }
});
