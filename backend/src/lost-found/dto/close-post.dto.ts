import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ClosePostDto {
  @IsString()
  @IsNotEmpty({ message: "请填写关闭原因或处理结果" })
  @MaxLength(255, { message: "处理结果不能超过 255 个字" })
  result!: string;
}
