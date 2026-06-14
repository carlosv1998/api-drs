import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (field: "id" | "sessionId" | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field] : user;
  },
);
