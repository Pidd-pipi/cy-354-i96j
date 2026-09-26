import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ConfirmHandoverDto {
  @IsString()
  @IsNotEmpty({ message: "请填写交接结果" })
  @MaxLength(255, { message: "交接结果不能超过 255 个字" })
  result!: string;
}
