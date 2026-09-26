import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty({ message: "请填写认领人姓名" })
  @MaxLength(40)
  claimerName!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写认领人联系方式" })
  @MaxLength(120)
  claimerContact!: string;

  @IsString()
  @MinLength(4, { message: "请至少描述 4 个字的物品特征，用于核对" })
  @MaxLength(500, { message: "特征说明不能超过 500 个字" })
  featureProof!: string;
}
