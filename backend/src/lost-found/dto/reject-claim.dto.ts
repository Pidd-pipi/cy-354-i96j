import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectClaimDto {
  @IsString()
  @IsNotEmpty({ message: "请填写驳回原因，例如：特征不符" })
  @MaxLength(255, { message: "驳回原因不能超过 255 个字" })
  reason!: string;
}
