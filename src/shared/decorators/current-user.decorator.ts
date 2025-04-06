import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/modules/users/user.schema';

interface CustomRequest extends Request {
    user?: User;
}
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): User => {
        const request = ctx.switchToHttp().getRequest<CustomRequest>();
        return request.user as User;
    },
);