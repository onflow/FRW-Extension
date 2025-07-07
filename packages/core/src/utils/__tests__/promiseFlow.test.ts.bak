import { describe, it, expect } from 'vitest';

import PromiseFlow from '../promiseFlow';

describe('PromiseFlow', () => {
  it('should create a new instance with empty tasks', () => {
    const flow = new PromiseFlow();
    expect(flow.tasks).toEqual([]);
    expect(flow._context).toEqual({});
    expect(flow.requestedApproval).toBe(false);
  });

  it('should add tasks using use method', () => {
    const flow = new PromiseFlow();
    const task = async (ctx, next) => {
      ctx.value = 1;
      await next();
    };

    flow.use(task);
    expect(flow.tasks).toHaveLength(1);
    expect(flow.tasks[0]).toBe(task);
  });

  it('should throw error when non-function is passed to use', () => {
    const flow = new PromiseFlow();
    expect(() => flow.use(null)).toThrow('promise need function to handle');
    expect(() => flow.use(123 as any)).toThrow('promise need function to handle');
  });

  it('should execute tasks in order', async () => {
    const flow = new PromiseFlow();
    const result: number[] = [];

    flow.use(async (ctx, next) => {
      result.push(1);
      await next();
      result.push(4);
    });

    flow.use(async (ctx, next) => {
      result.push(2);
      await next();
      result.push(3);
    });

    const fn = flow.callback();
    await fn({});

    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should maintain context between middleware', async () => {
    const flow = new PromiseFlow();

    flow.use(async (ctx, next) => {
      ctx.value = 1;
      await next();
    });

    flow.use(async (ctx, next) => {
      ctx.value += 1;
      await next();
    });

    const context = {};
    const fn = flow.callback();
    await fn(context);

    expect(context).toHaveProperty('value', 2);
  });

  it('should handle errors in middleware chain', async () => {
    const flow = new PromiseFlow();
    const error = new Error('Test error');

    flow.use(async (ctx, next) => {
      try {
        await next();
      } catch (e) {
        ctx.error = e;
      }
    });

    flow.use(async () => {
      throw error;
    });

    const context = {};
    const fn = flow.callback();
    await fn(context);

    expect(context).toHaveProperty('error', error);
  });
});
