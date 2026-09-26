import { IsDateString, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import type { LostFoundType } from "../entities/lost-found-post.entity";

export class CreatePostDto {
  @IsIn(["lost", "found"], { message: "启事类型只能是 lost（寻物）或 found（招领）" })
  type!: LostFoundType;

  @IsString()
  @MinLength(2, { message: "标题至少 2 个字" })
  @MaxLength(60, { message: "标题不能超过 60 个字" })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: "请选择物品类别" })
  @MaxLength(40)
  category!: string;

  @IsString()
  @IsNotEmpty({ message: "请选择校区" })
  @MaxLength(60)
  campus!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写地点" })
  @MaxLength(120)
  location!: string;

  @IsDateString({}, { message: "请填写有效的丢失/拾取时间" })
  happenedAt!: string;

  @IsString()
  @MinLength(4, { message: "物品特征至少描述 4 个字，便于核对" })
  @MaxLength(500, { message: "物品特征不能超过 500 个字" })
  features!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写联系人姓名" })
  @MaxLength(40)
  contactName!: string;

  @IsString()
  @IsNotEmpty({ message: "请填写联系方式" })
  @MaxLength(120)
  contactInfo!: string;
}
