import { IsNotEmpty } from "class-validator";

export class SignInDto {
    @IsNotEmpty()
    identifier: string;
    @IsNotEmpty()
    password: string;
}