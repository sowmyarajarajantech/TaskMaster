import { z } from 'zod';
import { insertTaskSchema, insertSubtaskSchema, insertListSchema, tasks, subtasks, lists } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  lists: {
    list: {
      method: 'GET' as const,
      path: '/api/lists',
      responses: {
        200: z.array(z.custom<typeof lists.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/lists',
      input: insertListSchema,
      responses: {
        201: z.custom<typeof lists.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/lists/:id',
      input: insertListSchema.partial(),
      responses: {
        200: z.custom<typeof lists.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/lists/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect & { subtasks: typeof subtasks.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  subtasks: {
    create: {
      method: 'POST' as const,
      path: '/api/tasks/:taskId/subtasks',
      input: insertSubtaskSchema.omit({ taskId: true }),
      responses: {
        201: z.custom<typeof subtasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/subtasks/:id',
      input: insertSubtaskSchema.partial(),
      responses: {
        200: z.custom<typeof subtasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subtasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
