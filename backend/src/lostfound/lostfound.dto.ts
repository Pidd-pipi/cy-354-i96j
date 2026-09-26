import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

const NOTICE_TYPES = ["lost", "found"] as const;

export class CreateNoticeDto {
  @IsIn(NOTICE_TYPES)
  type!: "lost" | "found";

  @IsString()
  @IsNotEmpty({ message: "请填写校区" })
  @MaxLength(60)
  campus!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写地点" })
  @MaxLength(120)
  location!: string;

  // 丢失/拾到时间，ISO 字符串或 yyyy-MM-dd HH:mm
  @IsString()
  @IsNotEmpty({ message: "请选择时间" })
  happenAt!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写物品名称" })
  @MaxLength(80)
  itemName!: string;

  @IsString()
  @IsNotEmpty({ message: "请描述物品特征" })
  @MinLength(4, { message: "特征描述至少 4 个字，便于核对" })
  @MaxLength(500)
  features!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写联系方式" })
  @MaxLength(80)
  contact!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写发布人昵称" })
  @MaxLength(40)
  publisher!: string;
}

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty({ message: "请填写认领人昵称" })
  @MaxLength(40)
  claimant!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写联系方式" })
  @MaxLength(80)
  contact!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写物品特征以核对" })
  @MinLength(2, { message: "请补充物品特征后再提交认领" })
  @MaxLength(500)
  featureAnswer!: string;
}

export class CompleteClaimDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  resultNote?: string;
}

export class ListNoticeQueryDto {
  @IsOptional()
  @IsIn(["lost", "found", "completed", "public", "all"])
  tab?: "lost" | "found" | "completed" | "public" | "all";

  @IsOptional()
  @IsString()
  @MaxLength(60)
  campus?: string;
}
